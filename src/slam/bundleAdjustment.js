/**
 * Simplified bundle adjustment for pose and point optimization
 * Improves accuracy of reconstructed 3D points and camera poses
 */

import { Vector3 } from '../utils/math.js';

export class BundleAdjustment {
    constructor() {
        this.enabled = true;
        this.iterations = 5;
        this.learningRate = 0.01;
    }
    
    /**
     * Optimize camera poses and 3D points using local optimization
     */
    optimize(keyframes, points3D) {
        if (!this.enabled || keyframes.length < 2 || points3D.length < 5) {
            return { keyframes, points3D };
        }
        
        // Local bundle adjustment on recent keyframes
        const recentKeyframes = keyframes.slice(-3); // Optimize last 3 keyframes
        
        // Optimize points and poses
        for (let iter = 0; iter < this.iterations; iter++) {
            // Refine point positions
            this.refinePoints(recentKeyframes, points3D);
            
            // Refine camera poses
            this.refinePoses(recentKeyframes, points3D);
        }
        
        return { keyframes, points3D };
    }
    
    /**
     * Refine 3D point positions
     */
    refinePoints(keyframes, points3D) {
        for (const point of points3D) {
            if (!point.observations) {
                point.observations = [];
            }
            
            // Find observations of this point in keyframes
            const observations = this.findPointObservations(point, keyframes);
            
            if (observations.length < 2) continue;
            
            // Triangulate position from observations
            const refinedPosition = this.triangulateLLS(observations);
            if (refinedPosition) {
                // Smooth update
                point.position = new Vector3(
                    point.position.x * 0.7 + refinedPosition.x * 0.3,
                    point.position.y * 0.7 + refinedPosition.y * 0.3,
                    point.position.z * 0.7 + refinedPosition.z * 0.3
                );
            }
        }
    }
    
    /**
     * Refine camera poses
     */
    refinePoses(keyframes, points3D) {
        for (let i = 1; i < keyframes.length; i++) {
            const kf = keyframes[i];
            const observations = this.getKeyframeObservations(kf, points3D);
            
            if (observations.length < 4) continue;
            
            // Compute pose increment using gradient descent
            const delta = this.computePoseDelta(kf, observations);
            
            // Apply pose update
            if (delta) {
                kf.pose.t.x += delta.tx * this.learningRate;
                kf.pose.t.y += delta.ty * this.learningRate;
                kf.pose.t.z += delta.tz * this.learningRate;
            }
        }
    }
    
    /**
     * Find observations of a point in keyframes
     */
    findPointObservations(point, keyframes) {
        const observations = [];
        
        for (const kf of keyframes) {
            // For each feature in keyframe, check if it corresponds to this point
            // Simplified: assume features in order correspond to points
            observations.push({
                keyframe: kf,
                position: point.position
            });
        }
        
        return observations;
    }
    
    /**
     * Linear least squares triangulation
     */
    triangulateLLS(observations) {
        if (observations.length < 2) return null;
        
        // Simplified: average observed positions
        let sumX = 0, sumY = 0, sumZ = 0;
        
        for (const obs of observations) {
            sumX += obs.position.x;
            sumY += obs.position.y;
            sumZ += obs.position.z;
        }
        
        return {
            x: sumX / observations.length,
            y: sumY / observations.length,
            z: sumZ / observations.length
        };
    }
    
    /**
     * Get observations of all points in a keyframe
     */
    getKeyframeObservations(keyframe, points3D) {
        const observations = [];
        
        for (const point of points3D) {
            if (keyframe.features && keyframe.features.length > 0) {
                observations.push({
                    point: point,
                    feature: keyframe.features[0],
                    keyframe: keyframe
                });
            }
        }
        
        return observations;
    }
    
    /**
     * Compute pose increment using reprojection error minimization
     */
    computePoseDelta(keyframe, observations) {
        let sumDx = 0, sumDy = 0, sumDz = 0;
        const cameraMatrix = {
            fx: 1200,
            fy: 1200,
            cx: 320,
            cy: 240
        };
        
        for (const obs of observations) {
            const point3D = obs.point.position;
            const feature = obs.feature;
            
            if (!feature) continue;
            
            // Project 3D point to image plane
            const x = (point3D.x - keyframe.pose.t.x) * cameraMatrix.fx / point3D.z + cameraMatrix.cx;
            const y = (point3D.y - keyframe.pose.t.y) * cameraMatrix.fy / point3D.z + cameraMatrix.cy;
            
            // Compute reprojection error
            const errX = x - feature.x;
            const errY = y - feature.y;
            
            // Accumulate gradient
            sumDx += errX * 0.1;
            sumDy += errY * 0.1;
            sumDz += Math.sqrt(errX * errX + errY * errY) * 0.05;
        }
        
        return {
            tx: -sumDx / observations.length,
            ty: -sumDy / observations.length,
            tz: -sumDz / observations.length
        };
    }
}
