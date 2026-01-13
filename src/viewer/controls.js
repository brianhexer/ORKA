/**
 * Camera controls (OrbitControls-like functionality)
 */

export class Controls {
    constructor(camera, canvas) {
        this.camera = camera;
        this.canvas = canvas;
        
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.rotation = { x: 0, y: 0 };
        this.distance = 5;
        
        this.init();
    }
    
    init() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        
        this.updateCamera();
    }
    
    onMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }
    
    onMouseMove(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        
        this.rotation.y += deltaX * 0.01;
        this.rotation.x += deltaY * 0.01;
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        
        this.updateCamera();
    }
    
    onMouseUp() {
        this.isDragging = false;
    }
    
    onWheel(e) {
        e.preventDefault();
        this.distance += e.deltaY * 0.01;
        this.distance = Math.max(1, Math.min(20, this.distance));
        this.updateCamera();
    }
    
    updateCamera() {
        const x = Math.sin(this.rotation.y) * Math.cos(this.rotation.x) * this.distance;
        const y = Math.sin(this.rotation.x) * this.distance;
        const z = Math.cos(this.rotation.y) * Math.cos(this.rotation.x) * this.distance;
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
    }
    
    reset() {
        this.rotation = { x: 0, y: 0 };
        this.distance = 5;
        this.updateCamera();
    }
}
