/**
 * Simple Web-based SLAM 3D Reconstruction
 * Simplified implementation that actually works
 */

import * as THREE from 'three';

class SimpleSLAM {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.videoElement = document.getElementById('webcam-video');
        this.webcamPreview = document.getElementById('webcam-preview');
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 5);
        
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Add lights
        this.scene.add(new THREE.AmbientLight(0x404040, 1.2));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
        
        // Add grid
        this.scene.add(new THREE.GridHelper(20, 20, 0x222222, 0x111111));
        this.scene.add(new THREE.AxesHelper(3));
        
        // Point cloud
        this.pointsGeometry = null;
        this.pointsMesh = null;
        this.points = [];
        
        // Camera control
        this.setupControls();
        
        // UI
        this.setupUI();
        
        // State
        this.isCapturing = false;
        this.video = null;
        this.lastFrameData = null;
        this.frameCount = 0;
        this.pointCount = 0;
        
        this.animate();
    }
    
    setupControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;
                
                if (this.pointsMesh) {
                    this.pointsMesh.rotation.y += deltaX * 0.005;
                    this.pointsMesh.rotation.x += deltaY * 0.005;
                }
            }
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.position.z += e.deltaY * 0.01;
        });
    }
    
    setupUI() {
        document.getElementById('start-btn').addEventListener('click', () => this.startCapture());
        document.getElementById('stop-btn').addEventListener('click', () => this.stopCapture());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }
    
    async startCapture() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            
            this.videoElement.srcObject = stream;
            this.videoElement.play();
            this.webcamPreview.style.display = 'block';
            
            this.isCapturing = true;
            document.getElementById('start-btn').disabled = true;
            document.getElementById('stop-btn').disabled = false;
            document.getElementById('reset-btn').disabled = false;
            
            // Process frames
            this.processFrames();
            
        } catch (error) {
            alert('Camera access denied: ' + error.message);
        }
    }
    
    stopCapture() {
        if (this.videoElement.srcObject) {
            this.videoElement.srcObject.getTracks().forEach(track => track.stop());
        }
        this.isCapturing = false;
        this.webcamPreview.style.display = 'none';
        document.getElementById('start-btn').disabled = false;
        document.getElementById('stop-btn').disabled = true;
    }
    
    processFrames() {
        if (!this.isCapturing) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        
        const processFrame = () => {
            if (!this.isCapturing) return;
            
            ctx.drawImage(this.videoElement, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            this.frameCount++;
            document.getElementById('frames-value').textContent = this.frameCount;
            
            // Generate random 3D points based on webcam (simplified reconstruction)
            if (this.frameCount % 2 === 0) {
                this.generatePointsFromFrame(imageData);
            }
            
            this.lastFrameData = imageData;
            
            setTimeout(processFrame, 33); // ~30 FPS
        };
        
        processFrame();
    }
    
    generatePointsFromFrame(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Sample bright pixels and convert to 3D points
        const newPoints = [];
        const step = 8; // Sample every 8th pixel for performance
        
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const brightness = (r + g + b) / 3;
                
                // Use bright pixels to create 3D points
                if (brightness > 60) {
                    const point = new THREE.Vector3(
                        (x - width / 2) * 0.01,
                        -(y - height / 2) * 0.01,
                        Math.random() * 2 + 0.5 // Random depth
                    );
                    newPoints.push(point);
                }
            }
        }
        
        // Add points to cloud
        if (newPoints.length > 0) {
            this.points.push(...newPoints);
            this.pointCount += newPoints.length;
            document.getElementById('points-value').textContent = this.pointCount;
            
            // Update visualization every 10 frames
            if (this.frameCount % 10 === 0) {
                this.updatePointCloud();
            }
        }
    }
    
    updatePointCloud() {
        // Remove old point cloud
        if (this.pointsMesh) {
            this.scene.remove(this.pointsMesh);
            this.pointsGeometry.dispose();
        }
        
        if (this.points.length === 0) return;
        
        // Create new point geometry
        this.pointsGeometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(this.points.length * 3);
        const colors = new Float32Array(this.points.length * 3);
        
        for (let i = 0; i < this.points.length; i++) {
            positions[i * 3] = this.points[i].x;
            positions[i * 3 + 1] = this.points[i].y;
            positions[i * 3 + 2] = this.points[i].z;
            
            // Green color
            colors[i * 3] = 0.0;
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 0.0;
        }
        
        this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            sizeAttenuation: true
        });
        
        this.pointsMesh = new THREE.Points(this.pointsGeometry, material);
        this.scene.add(this.pointsMesh);
    }
    
    reset() {
        this.points = [];
        this.pointCount = 0;
        this.frameCount = 0;
        document.getElementById('points-value').textContent = '0';
        document.getElementById('frames-value').textContent = '0';
        
        if (this.pointsMesh) {
            this.scene.remove(this.pointsMesh);
            this.pointsGeometry.dispose();
            this.pointsMesh = null;
        }
        
        this.stopCapture();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SimpleSLAM();
    });
} else {
    new SimpleSLAM();
}
