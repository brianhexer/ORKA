/**
 * 3D mapping and point cloud construction
 */

import { Vector3, triangulatePoint } from '../utils/math.js';

export class Mapper {
    constructor() {
        this.points3D = [];
        this.keyframes = [];
        this.currentKeyframeId = 0;
        this.keyframeThreshold = 0.5; // Minimum translation to create keyframe
    }
    
    /**
     * Add keyframe
     */
    addKeyframe(pose, features, imageData) {
        const keyframe = {
            id: this.currentKeyframeId++,
            pose: pose,
            features: features,
            imageData: imageData,
            timestamp: performance.now()
        };
        
        this.keyframes.push(keyframe);
        return keyframe.id;
    }
    
    /**
     * Triangulate 3D points from matched features
     */
    triangulatePoints(features1, features2, pose1, pose2, matches) {
        const newPoints = [];
        
        // Simplified triangulation
        for (const match of matches) {
            const f1 = features1[match.queryIdx];
            const f2 = features2[match.trainIdx];
            
            // Simple triangulation (would use proper method in practice)
            const point3D = this.triangulate(f1, f2, pose1, pose2);
            
            if (point3D && this.isValidPoint(point3D)) {
                newPoints.push({
                    position: point3D,
                    color: { r: 255, g: 255, b: 255 },
                    confidence: 1.0
                });
            }
        }
        
        return newPoints;
    }
    
    triangulate(f1, f2, pose1, pose2) {
        // Simplified triangulation
        // In practice, would use proper camera projection matrices
        
        // Assume forward motion and estimate depth
        const dx = f2.x - f1.x;
        const dy = f2.y - f1.y;
        const disparity = Math.sqrt(dx * dx + dy * dy);
        
        if (disparity < 1) return null;
        
        // Estimate depth (simplified)
        const depth = 100 / (disparity + 1);
        
        // Convert to 3D (simplified camera model)
        const x = (f1.x - 320) * depth / 800;
        const y = (f1.y - 240) * depth / 800;
        const z = depth;
        
        return new Vector3(x, y, z);
    }
    
    isValidPoint(point) {
        // Check if point is reasonable
        return point.z > 0 && point.z < 1000 &&
               Math.abs(point.x) < 1000 &&
               Math.abs(point.y) < 1000;
    }
    
    /**
     * Add 3D points to map
     */
    addPoints(points) {
        this.points3D.push(...points);
    }
    
    /**
     * Get all 3D points
     */
    getPoints() {
        return this.points3D;
    }
    
    /**
     * Clear all points
     */
    clear() {
        this.points3D = [];
        this.keyframes = [];
        this.currentKeyframeId = 0;
    }
    
    /**
     * Get point count
     */
    getPointCount() {
        return this.points3D.length;
    }
    
    /**
     * Check if we should create a new keyframe
     */
    shouldCreateKeyframe(currentPose, lastKeyframe) {
        if (!lastKeyframe) return true;
        
        const translation = currentPose.t.subtract(lastKeyframe.pose.t);
        const distance = translation.length();
        
        return distance > this.keyframeThreshold;
    }
}
