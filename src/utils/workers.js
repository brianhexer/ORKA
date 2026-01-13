/**
 * Web Worker management utilities
 */

let featureDetectionWorker = null;

export function createFeatureDetectionWorker() {
    if (typeof Worker === 'undefined') {
        console.warn('Web Workers not supported');
        return null;
    }
    
    // Worker code will be inlined or loaded from separate file
    // For now, return null and handle in main thread
    return null;
}

export function terminateWorker(worker) {
    if (worker) {
        worker.terminate();
    }
}

export function postMessageToWorker(worker, message) {
    if (worker) {
        worker.postMessage(message);
    }
}
