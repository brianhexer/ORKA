/**
 * Camera capture module using WebRTC
 */

export class CameraCapture {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.canvas = null;
        this.context = null;
        this.isCapturing = false;
        this.frameCallbacks = [];
        this.frameRate = 30;
        this.lastFrameTime = 0;
        this.animationFrameId = null;
    }
    
    async initialize(videoElement, resolution = '640x480') {
        this.videoElement = videoElement;
        const [width, height] = resolution.split('x').map(Number);
        
        try {
            const constraints = {
                video: {
                    width: { ideal: width },
                    height: { ideal: height },
                    facingMode: 'user'
                }
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve();
                };
            });
            
            // Create canvas for frame capture
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.videoElement.videoWidth;
            this.canvas.height = this.videoElement.videoHeight;
            this.context = this.canvas.getContext('2d', { willReadFrequently: true });
            
            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            throw error;
        }
    }
    
    startCapture(callback) {
        if (!this.stream) {
            throw new Error('Camera not initialized');
        }
        
        this.isCapturing = true;
        if (callback) {
            this.frameCallbacks.push(callback);
        }
        
        this.captureFrame();
    }
    
    stopCapture() {
        this.isCapturing = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.frameCallbacks = [];
    }
    
    captureFrame() {
        if (!this.isCapturing) return;
        
        const now = performance.now();
        const elapsed = now - this.lastFrameTime;
        const targetInterval = 1000 / this.frameRate;
        
        if (elapsed >= targetInterval) {
            this.context.drawImage(this.videoElement, 0, 0);
            const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Call all registered callbacks
            this.frameCallbacks.forEach(callback => {
                try {
                    callback(imageData, this.canvas.width, this.canvas.height);
                } catch (error) {
                    console.error('Error in frame callback:', error);
                }
            });
            
            this.lastFrameTime = now;
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.captureFrame());
    }
    
    getCurrentFrame() {
        if (!this.context || !this.videoElement) {
            return null;
        }
        
        this.context.drawImage(this.videoElement, 0, 0);
        return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    
    getWidth() {
        return this.canvas ? this.canvas.width : 0;
    }
    
    getHeight() {
        return this.canvas ? this.canvas.height : 0;
    }
    
    release() {
        this.stopCapture();
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        
        this.canvas = null;
        this.context = null;
    }
}
