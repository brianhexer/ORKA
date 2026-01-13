/**
 * Main application entry point
 */

import { CameraCapture } from './camera/cameraCapture.js';
import { FeatureDetector } from './slam/featureDetector.js';
import { FeatureTracker } from './slam/tracker.js';
import { PoseEstimator } from './slam/poseEstimator.js';
import { Mapper } from './slam/mapper.js';
import { PointCloudBuilder } from './reconstruction/pointCloudBuilder.js';
import { MeshBuilder } from './reconstruction/meshBuilder.js';
import { SceneManager } from './viewer/sceneManager.js';
import { Renderer } from './viewer/renderer.js';
import { Controls } from './viewer/controls.js';
import { OBJExporter } from './export/objExporter.js';
import { GLTFExporter } from './export/gltfExporter.js';
import { PLYExporter } from './export/plyExporter.js';
import { UIControls } from './ui/controls.js';
import { StatusBar } from './ui/statusBar.js';
import { FileManager } from './ui/fileManager.js';
import { Vector3 } from './utils/math.js';

class SLAMApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.videoElement = document.getElementById('webcam-video');
        this.webcamPreview = document.getElementById('webcam-preview');
        
        // Core components
        this.cameraCapture = new CameraCapture();
        this.featureDetector = new FeatureDetector(500);
        this.featureTracker = new FeatureTracker();
        this.poseEstimator = new PoseEstimator();
        this.mapper = new Mapper();
        this.pointCloudBuilder = new PointCloudBuilder();
        this.meshBuilder = new MeshBuilder();
        
        // Viewer
        this.sceneManager = new SceneManager(this.canvas);
        this.renderer = new Renderer(this.sceneManager);
        this.controls = new Controls(this.sceneManager.getCamera(), this.canvas);
        
        // Exporters
        this.objExporter = new OBJExporter();
        this.gltfExporter = new GLTFExporter();
        this.plyExporter = new PLYExporter();
        
        // UI
        this.uiControls = new UIControls();
        this.statusBar = new StatusBar();
        
        // State
        this.isCapturing = false;
        this.lastFeatures = null;
        this.lastDescriptors = null;
        this.lastImageData = null;
        this.lastPose = null;
        this.currentResolution = '640x480';
        
        this.init();
    }
    
    init() {
        // Setup UI callbacks
        this.uiControls.setCallback('onStart', () => this.startCapture());
        this.uiControls.setCallback('onStop', () => this.stopCapture());
        this.uiControls.setCallback('onReset', () => this.reset());
        this.uiControls.setCallback('onExportObj', () => this.exportOBJ());
        this.uiControls.setCallback('onExportGltf', () => this.exportGLTF());
        this.uiControls.setCallback('onExportPly', () => this.exportPLY());
        this.uiControls.setCallback('onResolutionChange', (res) => {
            this.currentResolution = res;
        });
        
        // Setup resize handler
        window.addEventListener('resize', () => this.onResize());
        this.onResize();
        
        // Start renderer
        this.renderer.start();
        
        this.statusBar.setStatus('Ready');
    }
    
    async startCapture() {
        try {
            this.statusBar.setStatus('Initializing camera...');
            
            await this.cameraCapture.initialize(this.videoElement, this.currentResolution);
            
            // Show webcam preview
            if (this.webcamPreview) {
                this.webcamPreview.style.display = 'block';
            }
            
            // Start frame processing
            this.cameraCapture.startCapture((imageData, width, height) => {
                this.processFrame(imageData);
            });
            
            this.isCapturing = true;
            this.uiControls.setCapturing(true);
            this.statusBar.setStatus('Capturing...');
            
        } catch (error) {
            console.error('Error starting capture:', error);
            this.statusBar.setStatus('Error: ' + error.message);
            alert('Error accessing camera: ' + error.message);
        }
    }
    
    stopCapture() {
        this.cameraCapture.stopCapture();
        this.isCapturing = false;
        this.uiControls.setCapturing(false);
        this.statusBar.setStatus('Stopped');
        
        if (this.webcamPreview) {
            this.webcamPreview.style.display = 'none';
        }
    }
    
    processFrame(imageData) {
        if (!this.isCapturing) return;
        
        this.statusBar.incrementFrame();
        
        try {
            // Detect features
            const features = this.featureDetector.detect(imageData);
            const descriptors = features.map(f => 
                this.featureDetector.computeDescriptor(imageData, f)
            );
            
            if (this.lastFeatures && this.lastDescriptors && features.length > 0) {
                // Track features
                const matches = this.featureTracker.match(
                    this.lastFeatures,
                    this.lastDescriptors,
                    features,
                    descriptors
                );
                
                // Filter matches
                const filteredMatches = this.featureTracker.filterMatches(
                    matches,
                    this.lastFeatures,
                    features
                );
                
                if (filteredMatches.length >= 8) {
                    // Estimate pose
                    const pose = this.poseEstimator.estimatePose(
                        this.lastFeatures,
                        features,
                        filteredMatches
                    );
                    
                    if (pose && filteredMatches.length > 0) {
                        // Always try to triangulate points from matches
                        if (this.lastPose) {
                            // Triangulate points
                            const newPoints = this.mapper.triangulatePoints(
                                this.lastFeatures,
                                features,
                                this.lastPose,
                                pose,
                                filteredMatches
                            );
                            
                            if (newPoints.length > 0) {
                                this.mapper.addPoints(newPoints);
                                this.pointCloudBuilder.addPoints(newPoints);
                                this.updateView();
                            }
                        }
                        
                        // Create keyframe if needed
                        const lastKeyframe = this.mapper.keyframes[this.mapper.keyframes.length - 1];
                        if (this.mapper.shouldCreateKeyframe(pose, lastKeyframe)) {
                            this.mapper.addKeyframe(pose, features, imageData);
                        }
                        
                        this.lastPose = pose;
                    }
                }
            } else {
                // First frame - create initial keyframe
                const initialPose = {
                    R: [1, 0, 0, 0, 1, 0, 0, 0, 1],
                    t: new Vector3(0, 0, 0)
                };
                this.mapper.addKeyframe(initialPose, features, imageData);
                this.lastPose = initialPose;
            }
            
            this.lastFeatures = features;
            this.lastDescriptors = descriptors;
            this.lastImageData = imageData;
            
            // Update point count
            const pointCount = this.pointCloudBuilder.getPointCount();
            this.statusBar.setPointCount(pointCount);
            
            if (pointCount > 0) {
                this.uiControls.setHasModel(true);
            }
            
        } catch (error) {
            console.error('Error processing frame:', error);
        }
    }
    
    updateView() {
        const pointCloudData = this.pointCloudBuilder.getPointCloudData();
        if (pointCloudData.count > 0) {
            this.sceneManager.updatePointCloud(
                pointCloudData.positions,
                pointCloudData.colors
            );
        }
    }
    
    reset() {
        this.stopCapture();
        
        this.mapper.clear();
        this.pointCloudBuilder.clear();
        this.sceneManager.clear();
        
        this.lastFeatures = null;
        this.lastDescriptors = null;
        this.lastImageData = null;
        this.lastPose = null;
        
        this.statusBar.reset();
        this.statusBar.setStatus('Reset');
        this.uiControls.setHasModel(false);
    }
    
    async exportOBJ() {
        try {
            this.statusBar.setStatus('Exporting OBJ...');
            const objContent = this.objExporter.export(this.sceneManager);
            if (objContent) {
                const filename = FileManager.generateFilename('model', 'obj');
                this.objExporter.download(objContent, filename);
                this.statusBar.setStatus('OBJ exported');
            }
        } catch (error) {
            console.error('Error exporting OBJ:', error);
            this.statusBar.setStatus('Export error');
        }
    }
    
    async exportGLTF() {
        try {
            this.statusBar.setStatus('Exporting GLTF...');
            const gltfData = await this.gltfExporter.export(this.sceneManager, 'gltf');
            if (gltfData) {
                const filename = FileManager.generateFilename('model', 'gltf');
                this.gltfExporter.download(gltfData, filename, false);
                this.statusBar.setStatus('GLTF exported');
            }
        } catch (error) {
            console.error('Error exporting GLTF:', error);
            this.statusBar.setStatus('Export error');
        }
    }
    
    async exportPLY() {
        try {
            this.statusBar.setStatus('Exporting PLY...');
            const plyData = this.plyExporter.export(this.sceneManager, false);
            if (plyData) {
                const filename = FileManager.generateFilename('model', 'ply');
                this.plyExporter.download(plyData, filename, false);
                this.statusBar.setStatus('PLY exported');
            }
        } catch (error) {
            console.error('Error exporting PLY:', error);
            this.statusBar.setStatus('Export error');
        }
    }
    
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.canvas.width = width;
        this.canvas.height = height;
        this.sceneManager.onResize(width, height);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SLAMApp();
    });
} else {
    new SLAMApp();
}
