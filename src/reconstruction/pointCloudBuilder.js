/**
 * Point cloud construction and management
 */

export class PointCloudBuilder {
    constructor() {
        this.points = [];
        this.colors = [];
    }
    
    /**
     * Add points to the cloud
     */
    addPoints(points3D) {
        for (const point of points3D) {
            this.points.push(point.position.x, point.position.y, point.position.z);
            
            if (point.color) {
                this.colors.push(
                    point.color.r / 255,
                    point.color.g / 255,
                    point.color.b / 255
                );
            } else {
                this.colors.push(1.0, 1.0, 1.0);
            }
        }
    }
    
    /**
     * Get point cloud data for Three.js
     */
    getPointCloudData() {
        return {
            positions: new Float32Array(this.points),
            colors: new Float32Array(this.colors),
            count: this.points.length / 3
        };
    }
    
    /**
     * Clear point cloud
     */
    clear() {
        this.points = [];
        this.colors = [];
    }
    
    /**
     * Get point count
     */
    getPointCount() {
        return this.points.length / 3;
    }
    
    /**
     * Filter outliers using statistical methods
     */
    filterOutliers() {
        // Simple outlier removal based on distance from mean
        if (this.points.length < 9) return;
        
        // Compute centroid
        let cx = 0, cy = 0, cz = 0;
        const count = this.points.length / 3;
        
        for (let i = 0; i < this.points.length; i += 3) {
            cx += this.points[i];
            cy += this.points[i + 1];
            cz += this.points[i + 2];
        }
        
        cx /= count;
        cy /= count;
        cz /= count;
        
        // Compute distances and filter
        const distances = [];
        for (let i = 0; i < this.points.length; i += 3) {
            const dx = this.points[i] - cx;
            const dy = this.points[i + 1] - cy;
            const dz = this.points[i + 2] - cz;
            distances.push(Math.sqrt(dx * dx + dy * dy + dz * dz));
        }
        
        // Compute threshold (mean + 2*std)
        const mean = distances.reduce((a, b) => a + b, 0) / distances.length;
        const variance = distances.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / distances.length;
        const std = Math.sqrt(variance);
        const threshold = mean + 2 * std;
        
        // Filter points
        const filteredPoints = [];
        const filteredColors = [];
        
        for (let i = 0; i < distances.length; i++) {
            if (distances[i] < threshold) {
                const idx = i * 3;
                filteredPoints.push(
                    this.points[idx],
                    this.points[idx + 1],
                    this.points[idx + 2]
                );
                filteredColors.push(
                    this.colors[idx],
                    this.colors[idx + 1],
                    this.colors[idx + 2]
                );
            }
        }
        
        this.points = filteredPoints;
        this.colors = filteredColors;
    }
}
