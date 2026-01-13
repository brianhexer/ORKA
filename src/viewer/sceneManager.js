/**
 * Three.js scene management
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
        
        this.init();
    }
    
    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.canvas.width / this.canvas.height,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 5);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
        
        // Grid helper
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        this.scene.add(gridHelper);
        
        // Axes helper
        const axesHelper = new THREE.AxesHelper(2);
        this.scene.add(axesHelper);
    }
    
    /**
     * Update point cloud
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
        
        if (colors && colors.length === positions.length) {
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        }
        
        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: colors && colors.length === positions.length,
            color: 0xffffff
        });
        
        this.pointCloud = new THREE.Points(geometry, material);
        this.scene.add(this.pointCloud);
    }
    
    /**
     * Update mesh
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
        
        const material = new THREE.MeshStandardMaterial({
            vertexColors: geometry.attributes.color !== undefined,
            color: 0xffffff,
            side: THREE.DoubleSide
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
}
