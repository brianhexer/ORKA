/**
 * Enhanced feature detection using multi-scale ORB-like algorithm
 * Provides higher quality features for LIDAR-like 3D reconstruction
 */

export class FeatureDetector {
    constructor(maxFeatures = 800) {
        this.maxFeatures = maxFeatures;
        this.scales = [0.8, 1.0, 1.2]; // Multi-scale detection
        this.descriptorSize = 256; // Larger descriptor for better matching
    }
    
    /**
     * Detect features in an image using multi-scale Harris corners
     */
    detect(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const features = [];
        
        // Convert to grayscale
        const gray = this.toGrayscale(data, width, height);
        
        // Compute image gradients
        const gradX = this.computeGradient(gray, width, height, 'x');
        const gradY = this.computeGradient(gray, width, height, 'y');
        
        // Multi-scale corner detection
        for (const scale of this.scales) {
            const corners = this.detectHarrisCorners(gray, gradX, gradY, width, height, scale);
            features.push(...corners);
        }
        
        // Remove duplicates and non-maximum suppression
        const uniqueFeatures = this.nonMaximumSuppression(features, 8);
        
        // Select top features by score
        uniqueFeatures.sort((a, b) => b.score - a.score);
        return uniqueFeatures.slice(0, this.maxFeatures);
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
    
    /**
     * Compute image gradients (Sobel operator)
     */
    computeGradient(gray, width, height, direction) {
        const gradient = new Float32Array(width * height);
        
        const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
        const kernel = direction === 'x' ? sobelX : sobelY;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sum = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const idx = (y + dy) * width + (x + dx);
                        sum += gray[idx] * kernel[dy + 1][dx + 1];
                    }
                }
                gradient[y * width + x] = sum;
            }
        }
        
        return gradient;
    }
    
    /**
     * Harris corner detection
     */
    detectHarrisCorners(gray, gradX, gradY, width, height, scale) {
        const corners = [];
        const radius = Math.ceil(2 * scale);
        const threshold = 40 * scale;
        const step = Math.max(1, Math.floor(1 / scale));
        
        // Compute Harris response
        for (let y = radius; y < height - radius; y += step) {
            for (let x = radius; x < width - radius; x += step) {
                const response = this.computeHarrisResponse(gradX, gradY, x, y, width, height, radius);
                
                if (response > threshold) {
                    corners.push({
                        x: x,
                        y: y,
                        score: response,
                        scale: scale
                    });
                }
            }
        }
        
        return corners;
    }
    
    /**
     * Compute Harris corner response
     */
    computeHarrisResponse(gradX, gradY, x, y, width, height, radius) {
        let sumXX = 0, sumYY = 0, sumXY = 0;
        const k = 0.04; // Harris parameter
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const idx = (y + dy) * width + (x + dx);
                const gx = gradX[idx];
                const gy = gradY[idx];
                
                sumXX += gx * gx;
                sumYY += gy * gy;
                sumXY += gx * gy;
            }
        }
        
        const trace = sumXX + sumYY;
        const det = (sumXX * sumYY) - (sumXY * sumXY);
        
        return Math.max(0, det - k * trace * trace);
    }
    
    /**
     * Non-maximum suppression to avoid duplicate detections
     */
    nonMaximumSuppression(features, radius) {
        if (features.length === 0) return [];
        
        // Sort by score
        features.sort((a, b) => b.score - a.score);
        
        const suppressed = [];
        for (const feature of features) {
            let isSuppressed = false;
            
            for (const kept of suppressed) {
                const dx = feature.x - kept.x;
                const dy = feature.y - kept.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < radius) {
                    isSuppressed = true;
                    break;
                }
            }
            
            if (!isSuppressed) {
                suppressed.push(feature);
            }
        }
        
        return suppressed;
    }
    
    /**
     * Compute BRIEF-like descriptor
     */
    computeDescriptor(imageData, feature) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const gray = this.toGrayscale(data, width, height);
        
        const x = Math.floor(feature.x);
        const y = Math.floor(feature.y);
        const descriptor = new Uint8Array(this.descriptorSize);
        
        // BRIEF test pairs (simplified)
        const patchSize = 31;
        let bitIndex = 0;
        
        for (let i = 0; i < this.descriptorSize && bitIndex < this.descriptorSize; i++) {
            const angle1 = Math.random() * 2 * Math.PI;
            const angle2 = Math.random() * 2 * Math.PI;
            const r1 = Math.random() * patchSize / 2;
            const r2 = Math.random() * patchSize / 2;
            
            const x1 = Math.floor(x + r1 * Math.cos(angle1));
            const y1 = Math.floor(y + r1 * Math.sin(angle1));
            const x2 = Math.floor(x + r2 * Math.cos(angle2));
            const y2 = Math.floor(y + r2 * Math.sin(angle2));
            
            // Bounds check
            if (x1 >= 0 && x1 < width && y1 >= 0 && y1 < height &&
                x2 >= 0 && x2 < width && y2 >= 0 && y2 < height) {
                
                const p1 = gray[y1 * width + x1];
                const p2 = gray[y2 * width + x2];
                descriptor[bitIndex] = p1 < p2 ? 1 : 0;
                bitIndex++;
            }
        }
        
        return descriptor;
    }
}
