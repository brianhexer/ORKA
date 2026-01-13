/**
 * Feature detection using simplified ORB-like algorithm
 * For browser compatibility, we use a simplified approach
 */

export class FeatureDetector {
    constructor(maxFeatures = 500) {
        this.maxFeatures = maxFeatures;
        this.fastThreshold = 30;
    }
    
    /**
     * Detect features in an image (simplified FAST-like detector)
     */
    detect(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const features = [];
        
        // Convert to grayscale
        const gray = this.toGrayscale(data, width, height);
        
        // Simple corner detection (Harris-like)
        const corners = this.detectCorners(gray, width, height);
        
        // Select top features
        corners.sort((a, b) => b.score - a.score);
        return corners.slice(0, this.maxFeatures);
    }
    
    toGrayscale(data, width, height) {
        const gray = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        }
        return gray;
    }
    
    detectCorners(gray, width, height) {
        const corners = [];
        const radius = 3;
        const threshold = 50;
        
        for (let y = radius; y < height - radius; y += 2) {
            for (let x = radius; x < width - radius; x += 2) {
                const score = this.computeCornerScore(gray, x, y, width, height, radius);
                
                if (score > threshold) {
                    corners.push({
                        x: x,
                        y: y,
                        score: score
                    });
                }
            }
        }
        
        return corners;
    }
    
    computeCornerScore(gray, x, y, width, height, radius) {
        const center = gray[y * width + x];
        let diff = 0;
        
        // Check surrounding pixels
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx === 0 && dy === 0) continue;
                const idx = (y + dy) * width + (x + dx);
                const pixel = gray[idx];
                diff += Math.abs(pixel - center);
            }
        }
        
        return diff / (radius * radius * 4 - 1);
    }
    
    /**
     * Compute simple descriptor (patch-based)
     */
    computeDescriptor(imageData, feature) {
        const width = imageData.width;
        const data = imageData.data;
        const patchSize = 8;
        const descriptor = [];
        
        const gray = this.toGrayscale(data, width, imageData.height);
        const x = Math.floor(feature.x);
        const y = Math.floor(feature.y);
        
        for (let dy = -patchSize / 2; dy < patchSize / 2; dy++) {
            for (let dx = -patchSize / 2; dx < patchSize / 2; dx++) {
                const px = Math.max(0, Math.min(width - 1, x + dx));
                const py = Math.max(0, Math.min(imageData.height - 1, y + dy));
                const idx = py * width + px;
                descriptor.push(gray[idx]);
            }
        }
        
        return new Uint8Array(descriptor);
    }
}
