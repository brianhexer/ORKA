/**
 * Enhanced Three.js scene management with LIDAR-like visualization
 */

import * as THREE from 'three';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.pointCloud = null;
        this.mesh = null;
        
        // Visualization settings for LIDAR effect
        this.pointSize = 0.08;
        this.usePerspectiveDepth = true; // Points grow larger when closer (LIDAR effect)
        
        this.init();
    }
    
    init() {
        // Ensure canvas has dimensions
        if (!this.canvas.width || !this.canvas.height) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a); // Darker for depth perception
        this.scene.fog = new THREE.Fog(0x0a0a0a, 100, 1000); // Atmospheric fog for depth
        
        // Camera - use default aspect ratio if dimensions are invalid
        const aspect = (this.canvas.width && this.canvas.height) 
            ? this.canvas.width / this.canvas.height 
            : window.innerWidth / window.innerHeight;
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            aspect,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 5);
        
        // Renderer with enhanced settings
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            premultipliedAlpha: false
        });
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.sortObjects = true;
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        
        // Lighting for depth perception
        const ambientLight = new THREE.AmbientLight(0x404040, 1.2); // Reduced ambient
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Add subtle grid for reference
        const gridHelper = new THREE.GridHelper(20, 20, 0x222222, 0x111111);
        gridHelper.position.y = -0.5;
        this.scene.add(gridHelper);
        
        // Add axes helper for orientation
        const axesHelper = new THREE.AxesHelper(3);
        this.scene.add(axesHelper);
    }
    
    /**
     * Update point cloud with depth-based coloring and sizing
     */
    updatePointCloud(positions, colors) {
        // Remove existing point cloud
        if (this.pointCloud) {
            this.scene.remove(this.pointCloud);
            if (this.pointCloud.geometry) {
                this.pointCloud.geometry.dispose();
            }
            if (this.pointCloud.material) {
                this.pointCloud.material.dispose();
            }
        }
        
        if (!positions || positions.length === 0) {
            return;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        // Use vertex colors if available
        if (colors && colors.length === positions.length) {
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        }
        
        // Create point material with enhanced settings for LIDAR effect
        const material = new THREE.PointsMaterial({
            size: this.pointSize,
            vertexColors: colors && colors.length === positions.length,
            color: 0xffffff,
            sizeAttenuation: this.usePerspectiveDepth,
            fog: true,
            transparent: false,
            alphaTest: 0.0
        });
        
        this.pointCloud = new THREE.Points(geometry, material);
        this.scene.add(this.pointCloud);
    }
    
    /**
     * Update mesh with enhanced material
     */
    updateMesh(geometry) {
        // Remove existing mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            if (this.mesh.material) {
                this.mesh.material.dispose();
            }
        }
        
        if (!geometry) {
            return;
        }
        
        // Enhanced material for better depth perception
        const material = new THREE.MeshStandardMaterial({
            vertexColors: geometry.attributes.color !== undefined,
            color: 0xcccccc,
            side: THREE.DoubleSide,
            metalness: 0.2,
            roughness: 0.8,
            fog: true
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
    }
    
    /**
     * Render the scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Handle window resize
     */
    onResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    /**
     * Get camera
     */
    getCamera() {
        return this.camera;
    }
    
    /**
     * Get scene
     */
    getScene() {
        return this.scene;
    }
    
    /**
     * Clear all geometry
     */
    clear() {
        if (this.pointCloud) {
            this.scene.remove(this.pointCloud);
            this.pointCloud.geometry.dispose();
            this.pointCloud.material.dispose();
            this.pointCloud = null;
        }
        
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }
    }
    
    /**
     * Get point cloud for export
     */
    getPointCloud() {
        return this.pointCloud;
    }
    
    /**
     * Get mesh for export
     */
    getMesh() {
        return this.mesh;
    }
    
    /**
     * Set point size for visualization adjustment
     */
    setPointSize(size) {
        this.pointSize = size;
        if (this.pointCloud && this.pointCloud.material) {
            this.pointCloud.material.size = size;
        }
    }
    
    /**
     * Toggle perspective depth effect
     */
    setPerspectiveDepth(enabled) {
        this.usePerspectiveDepth = enabled;
        if (this.pointCloud && this.pointCloud.material) {
            this.pointCloud.material.sizeAttenuation = enabled;
        }
    }
}
