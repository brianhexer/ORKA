/**
 * Enhanced point cloud construction with filtering and optimization
 * Provides LIDAR-like point cloud density and accuracy
 */

export class PointCloudBuilder {
    constructor() {
        this.points = [];
        this.colors = [];
        this.confidences = [];
        this.depths = [];
        
        // Filtering parameters
        this.minConfidence = 0.2;
        this.statisticalOutlierThreshold = 2.0;
        this.voxelGridSize = 0.01; // 1cm voxel size for point merging
    }
    
    /**
     * Add points to the cloud with confidence and depth data
     */
    addPoints(points3D) {
        for (const point of points3D) {
            // Filter by confidence
            if (point.confidence !== undefined && point.confidence < this.minConfidence) {
                continue;
            }
            
            this.points.push(point.position.x, point.position.y, point.position.z);
            
            // Add color
            if (point.color) {
                this.colors.push(
                    point.color.r / 255,
                    point.color.g / 255,
                    point.color.b / 255
                );
            } else {
                this.colors.push(1.0, 1.0, 1.0);
            }
            
            // Add confidence
            this.confidences.push(point.confidence || 1.0);
            
            // Add depth for visualization
            if (point.depth) {
                this.depths.push(point.depth);
            } else {
                const depth = Math.sqrt(point.position.x ** 2 + 
                                      point.position.y ** 2 + 
                                      point.position.z ** 2);
                this.depths.push(depth);
            }
        }
    }
    
    /**
     * Get point cloud data with depth-based coloring
     */
    getPointCloudData() {
        if (this.points.length === 0) {
            return {
                positions: new Float32Array(),
                colors: new Float32Array(),
                count: 0
            };
        }
        
        // Color by depth (depth-based coloring for LIDAR effect)
        const depthColors = this.computeDepthColors();
        
        return {
            positions: new Float32Array(this.points),
            colors: new Float32Array(depthColors),
            count: this.points.length / 3,
            confidences: new Float32Array(this.confidences),
            depths: new Float32Array(this.depths)
        };
    }
    
    /**
     * Compute depth-based coloring (HSV color space mapped to depth)
     */
    computeDepthColors() {
        const colors = [];
        
        if (this.depths.length === 0) {
            return Array(this.points.length).fill(1.0);
        }
        
        // Find min/max depth
        const minDepth = Math.min(...this.depths);
        const maxDepth = Math.max(...this.depths);
        const depthRange = maxDepth - minDepth || 1.0;
        
        // Map depth to HSV and convert to RGB
        for (let i = 0; i < this.depths.length; i++) {
            const depth = this.depths[i];
            const normalized = (depth - minDepth) / depthRange;
            
            // Color mapping: blue (near) -> green -> yellow -> red (far)
            const rgb = this.depthToRGB(normalized);
            colors.push(rgb.r, rgb.g, rgb.b);
        }
        
        return colors;
    }
    
    /**
     * Convert normalized depth to RGB color
     */
    depthToRGB(normalized) {
        // Map 0-1 to HSV: Hue 240 (blue) to 0 (red)
        const hue = (1 - normalized) * 240; // 0-240 degrees
        const saturation = 0.9;
        const value = 0.8 + normalized * 0.2; // Brighter for far points
        
        return this.hsvToRGB(hue, saturation, value);
    }
    
    /**
     * Convert HSV to RGB
     */
    hsvToRGB(h, s, v) {
        const c = v * s;
        const hPrime = h / 60;
        const x = c * (1 - Math.abs((hPrime % 2) - 1));
        
        let r = 0, g = 0, b = 0;
        
        if (hPrime < 1) { r = c; g = x; }
        else if (hPrime < 2) { r = x; g = c; }
        else if (hPrime < 3) { g = c; b = x; }
        else if (hPrime < 4) { g = x; b = c; }
        else if (hPrime < 5) { r = x; b = c; }
        else { r = c; b = x; }
        
        const m = v - c;
        return {
            r: Math.max(0, Math.min(1, r + m)),
            g: Math.max(0, Math.min(1, g + m)),
            b: Math.max(0, Math.min(1, b + m))
        };
    }
    
    /**
     * Clear point cloud
     */
    clear() {
        this.points = [];
        this.colors = [];
        this.confidences = [];
        this.depths = [];
    }
    
    /**
     * Get point count
     */
    getPointCount() {
        return this.points.length / 3;
    }
    
    /**
     * Filter outliers using statistical methods (based on neighbors)
     */
    filterOutliers() {
        if (this.points.length < 27) return; // Need at least 9 points
        
        const pointCount = this.points.length / 3;
        const threshold = 2.0; // Standard deviation multiplier
        
        // Build spatial index (simplified - uses distance threshold)
        const neighbors = this.findNeighbors();
        
        // Compute mean distance to neighbors
        const distances = [];
        for (let i = 0; i < pointCount; i++) {
            if (neighbors[i].length === 0) {
                distances[i] = Infinity;
                continue;
            }
            
            let sumDist = 0;
            for (const neighborIdx of neighbors[i]) {
                const dx = this.points[i * 3] - this.points[neighborIdx * 3];
                const dy = this.points[i * 3 + 1] - this.points[neighborIdx * 3 + 1];
                const dz = this.points[i * 3 + 2] - this.points[neighborIdx * 3 + 2];
                sumDist += Math.sqrt(dx * dx + dy * dy + dz * dz);
            }
            distances[i] = sumDist / neighbors[i].length;
        }
        
        // Compute statistics
        const mean = distances.filter(d => d !== Infinity).reduce((a, b) => a + b, 0) / 
                    distances.filter(d => d !== Infinity).length;
        const variance = distances.filter(d => d !== Infinity)
            .reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / 
            distances.filter(d => d !== Infinity).length;
        const stdDev = Math.sqrt(variance);
        const outlierThreshold = mean + threshold * stdDev;
        
        // Filter outliers
        this.filterByCondition((i) => distances[i] <= outlierThreshold);
    }
    
    /**
     * Find neighbors for each point (within distance threshold)
     */
    findNeighbors(radius = 0.05) {
        const pointCount = this.points.length / 3;
        const neighbors = Array(pointCount).fill(null).map(() => []);
        
        // O(n^2) - could be optimized with spatial indexing
        for (let i = 0; i < pointCount; i++) {
            for (let j = i + 1; j < pointCount; j++) {
                const dx = this.points[i * 3] - this.points[j * 3];
                const dy = this.points[i * 3 + 1] - this.points[j * 3 + 1];
                const dz = this.points[i * 3 + 2] - this.points[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                if (dist < radius) {
                    neighbors[i].push(j);
                    neighbors[j].push(i);
                }
            }
        }
        
        return neighbors;
    }
    
    /**
     * Filter points based on condition
     */
    filterByCondition(condition) {
        const pointCount = this.points.length / 3;
        const filteredPoints = [];
        const filteredColors = [];
        const filteredConfidences = [];
        const filteredDepths = [];
        
        for (let i = 0; i < pointCount; i++) {
            if (condition(i)) {
                filteredPoints.push(
                    this.points[i * 3],
                    this.points[i * 3 + 1],
                    this.points[i * 3 + 2]
                );
                filteredColors.push(
                    this.colors[i * 3],
                    this.colors[i * 3 + 1],
                    this.colors[i * 3 + 2]
                );
                filteredConfidences.push(this.confidences[i]);
                filteredDepths.push(this.depths[i]);
            }
        }
        
        this.points = filteredPoints;
        this.colors = filteredColors;
        this.confidences = filteredConfidences;
        this.depths = filteredDepths;
    }
    
    /**
     * Merge nearby points using voxel grid
     */
    mergeNearbyPoints() {
        const voxelGrid = new Map();
        const pointCount = this.points.length / 3;
        
        // Group points into voxels
        for (let i = 0; i < pointCount; i++) {
            const voxelKey = [
                Math.floor(this.points[i * 3] / this.voxelGridSize),
                Math.floor(this.points[i * 3 + 1] / this.voxelGridSize),
                Math.floor(this.points[i * 3 + 2] / this.voxelGridSize)
            ].join(',');
            
            if (!voxelGrid.has(voxelKey)) {
                voxelGrid.set(voxelKey, []);
            }
            voxelGrid.get(voxelKey).push(i);
        }
        
        // Average points in same voxel
        const mergedPoints = [];
        const mergedColors = [];
        const mergedConfidences = [];
        const mergedDepths = [];
        
        for (const indices of voxelGrid.values()) {
            let sumX = 0, sumY = 0, sumZ = 0;
            let sumR = 0, sumG = 0, sumB = 0;
            let sumConf = 0, sumDepth = 0;
            
            for (const i of indices) {
                sumX += this.points[i * 3];
                sumY += this.points[i * 3 + 1];
                sumZ += this.points[i * 3 + 2];
                sumR += this.colors[i * 3];
                sumG += this.colors[i * 3 + 1];
                sumB += this.colors[i * 3 + 2];
                sumConf += this.confidences[i];
                sumDepth += this.depths[i];
            }
            
            const n = indices.length;
            mergedPoints.push(sumX / n, sumY / n, sumZ / n);
            mergedColors.push(sumR / n, sumG / n, sumB / n);
            mergedConfidences.push(sumConf / n);
            mergedDepths.push(sumDepth / n);
        }
        
        this.points = mergedPoints;
        this.colors = mergedColors;
        this.confidences = mergedConfidences;
        this.depths = mergedDepths;
    }
}
