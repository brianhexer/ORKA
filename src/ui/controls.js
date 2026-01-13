/**
 * UI controls management
 */

export class UIControls {
    constructor() {
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.exportObjBtn = document.getElementById('export-obj-btn');
        this.exportGltfBtn = document.getElementById('export-gltf-btn');
        this.exportPlyBtn = document.getElementById('export-ply-btn');
        this.resolutionSelect = document.getElementById('resolution');
        
        this.callbacks = {
            onStart: null,
            onStop: null,
            onReset: null,
            onExportObj: null,
            onExportGltf: null,
            onExportPly: null,
            onResolutionChange: null
        };
        
        this.init();
    }
    
    init() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => {
                if (this.callbacks.onStart) {
                    this.callbacks.onStart();
                }
            });
        }
        
        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => {
                if (this.callbacks.onStop) {
                    this.callbacks.onStop();
                }
            });
        }
        
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                if (this.callbacks.onReset) {
                    this.callbacks.onReset();
                }
            });
        }
        
        if (this.exportObjBtn) {
            this.exportObjBtn.addEventListener('click', () => {
                if (this.callbacks.onExportObj) {
                    this.callbacks.onExportObj();
                }
            });
        }
        
        if (this.exportGltfBtn) {
            this.exportGltfBtn.addEventListener('click', () => {
                if (this.callbacks.onExportGltf) {
                    this.callbacks.onExportGltf();
                }
            });
        }
        
        if (this.exportPlyBtn) {
            this.exportPlyBtn.addEventListener('click', () => {
                if (this.callbacks.onExportPly) {
                    this.callbacks.onExportPly();
                }
            });
        }
        
        if (this.resolutionSelect) {
            this.resolutionSelect.addEventListener('change', (e) => {
                if (this.callbacks.onResolutionChange) {
                    this.callbacks.onResolutionChange(e.target.value);
                }
            });
        }
    }
    
    setCallback(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        }
    }
    
    setCapturing(isCapturing) {
        if (this.startBtn) this.startBtn.disabled = isCapturing;
        if (this.stopBtn) this.stopBtn.disabled = !isCapturing;
        if (this.resetBtn) this.resetBtn.disabled = isCapturing;
    }
    
    setHasModel(hasModel) {
        if (this.exportObjBtn) this.exportObjBtn.disabled = !hasModel;
        if (this.exportGltfBtn) this.exportGltfBtn.disabled = !hasModel;
        if (this.exportPlyBtn) this.exportPlyBtn.disabled = !hasModel;
        if (this.resetBtn) this.resetBtn.disabled = !hasModel && !this.startBtn?.disabled;
    }
    
    getResolution() {
        return this.resolutionSelect ? this.resolutionSelect.value : '640x480';
    }
}
