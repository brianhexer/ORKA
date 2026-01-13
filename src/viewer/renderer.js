/**
 * Rendering pipeline
 */

export class Renderer {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.isRendering = false;
        this.animationFrameId = null;
    }
    
    start() {
        if (this.isRendering) return;
        this.isRendering = true;
        this.render();
    }
    
    stop() {
        this.isRendering = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    render() {
        if (!this.isRendering) return;
        
        this.sceneManager.render();
        this.animationFrameId = requestAnimationFrame(() => this.render());
    }
}
