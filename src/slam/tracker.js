/**
 * Feature tracking between frames
 */

export class FeatureTracker {
    constructor() {
        this.maxDistance = 50;
        this.descriptorDistanceThreshold = 1000;
    }
    
    /**
     * Match features between two frames using descriptor distance
     */
    match(features1, descriptors1, features2, descriptors2) {
        const matches = [];
        
        for (let i = 0; i < features1.length; i++) {
            let bestMatch = null;
            let bestDistance = Infinity;
            let secondBestDistance = Infinity;
            
            for (let j = 0; j < features2.length; j++) {
                // Check spatial distance first
                const spatialDist = this.euclideanDistance(features1[i], features2[j]);
                if (spatialDist > this.maxDistance) continue;
                
                // Compute descriptor distance
                const descDist = this.hammingDistance(descriptors1[i], descriptors2[j]);
                
                if (descDist < bestDistance) {
                    secondBestDistance = bestDistance;
                    bestDistance = descDist;
                    bestMatch = j;
                } else if (descDist < secondBestDistance) {
                    secondBestDistance = descDist;
                }
            }
            
            // Ratio test (Lowe's ratio test)
            if (bestMatch !== null && bestDistance < this.descriptorDistanceThreshold) {
                if (secondBestDistance === Infinity || bestDistance / secondBestDistance < 0.8) {
                    matches.push({
                        queryIdx: i,
                        trainIdx: bestMatch,
                        distance: bestDistance
                    });
                }
            }
        }
        
        return matches;
    }
    
    euclideanDistance(f1, f2) {
        const dx = f1.x - f2.x;
        const dy = f1.y - f2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    hammingDistance(desc1, desc2) {
        if (!desc1 || !desc2 || desc1.length !== desc2.length) {
            return Infinity;
        }
        
        let distance = 0;
        for (let i = 0; i < desc1.length; i++) {
            distance += Math.abs(desc1[i] - desc2[i]);
        }
        
        return distance;
    }
    
    /**
     * Filter matches using RANSAC for outlier removal
     */
    filterMatches(matches, features1, features2, iterations = 100, threshold = 3.0) {
        if (matches.length < 8) return matches;
        
        let bestInliers = [];
        let bestModel = null;
        
        for (let iter = 0; iter < iterations; iter++) {
            // Randomly select 4 matches
            const sample = this.randomSample(matches, 4);
            if (sample.length < 4) continue;
            
            // Compute model (simplified - just use translation)
            const model = this.estimateTranslation(
                sample.map(m => features1[m.queryIdx]),
                sample.map(m => features2[m.trainIdx])
            );
            
            // Count inliers
            const inliers = [];
            for (const match of matches) {
                const p1 = features1[match.queryIdx];
                const p2 = features2[match.trainIdx];
                const error = this.computeError(p1, p2, model);
                
                if (error < threshold) {
                    inliers.push(match);
                }
            }
            
            if (inliers.length > bestInliers.length) {
                bestInliers = inliers;
                bestModel = model;
            }
        }
        
        return bestInliers;
    }
    
    randomSample(array, n) {
        const shuffled = array.slice().sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(n, array.length));
    }
    
    estimateTranslation(points1, points2) {
        if (points1.length !== points2.length || points1.length === 0) {
            return { dx: 0, dy: 0 };
        }
        
        let dx = 0, dy = 0;
        for (let i = 0; i < points1.length; i++) {
            dx += points2[i].x - points1[i].x;
            dy += points2[i].y - points1[i].y;
        }
        
        return {
            dx: dx / points1.length,
            dy: dy / points1.length
        };
    }
    
    computeError(p1, p2, model) {
        const dx = p2.x - p1.x - model.dx;
        const dy = p2.y - p1.y - model.dy;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
