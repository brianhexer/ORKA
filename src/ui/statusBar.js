/**
 * Status bar management
 */

export class StatusBar {
    constructor() {
        this.statusValue = document.getElementById('status-value');
        this.framesValue = document.getElementById('frames-value');
        this.pointsValue = document.getElementById('points-value');
        this.fpsValue = document.getElementById('fps-value');
        
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        this.frameTimes = [];
    }
    
    setStatus(status) {
        if (this.statusValue) {
            this.statusValue.textContent = status;
        }
    }
    
    incrementFrame() {
        this.frameCount++;
        this.updateFPS();
        
        if (this.framesValue) {
            this.framesValue.textContent = this.frameCount;
        }
    }
    
    setPointCount(count) {
        if (this.pointsValue) {
            this.pointsValue.textContent = count;
        }
    }
    
    updateFPS() {
        const now = performance.now();
        this.frameTimes.push(now);
        
        // Keep only last second of frame times
        const oneSecondAgo = now - 1000;
        this.frameTimes = this.frameTimes.filter(time => time > oneSecondAgo);
        
        if (this.fpsValue) {
            const fps = this.frameTimes.length;
            this.fpsValue.textContent = fps;
        }
    }
    
    reset() {
        this.frameCount = 0;
        this.frameTimes = [];
        if (this.framesValue) this.framesValue.textContent = '0';
        if (this.pointsValue) this.pointsValue.textContent = '0';
        if (this.fpsValue) this.fpsValue.textContent = '0';
    }
}
