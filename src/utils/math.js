/**
 * Math utilities for 3D transformations and calculations
 */

export class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
    
    add(v) {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }
    
    subtract(v) {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }
    
    multiplyScalar(s) {
        return new Vector3(this.x * s, this.y * s, this.z * s);
    }
    
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    
    cross(v) {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }
    
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    
    normalize() {
        const len = this.length();
        if (len === 0) return new Vector3(0, 0, 0);
        return this.multiplyScalar(1 / len);
    }
}

export class Matrix3 {
    constructor(elements = [1, 0, 0, 0, 1, 0, 0, 0, 1]) {
        this.elements = elements.slice();
    }
    
    static fromRotation(angle, axis) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;
        const x = axis.x;
        const y = axis.y;
        const z = axis.z;
        
        return new Matrix3([
            t * x * x + c, t * x * y - s * z, t * x * z + s * y,
            t * x * y + s * z, t * y * y + c, t * y * z - s * x,
            t * x * z - s * y, t * y * z + s * x, t * z * z + c
        ]);
    }
    
    multiplyVector(v) {
        const e = this.elements;
        return new Vector3(
            e[0] * v.x + e[1] * v.y + e[2] * v.z,
            e[3] * v.x + e[4] * v.y + e[5] * v.z,
            e[6] * v.x + e[7] * v.y + e[8] * v.z
        );
    }
}

export class Matrix4 {
    constructor(elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) {
        this.elements = elements.slice();
    }
    
    static identity() {
        return new Matrix4();
    }
    
    static fromRotationTranslation(rotation, translation) {
        const m = new Matrix4();
        const r = rotation;
        const t = translation;
        
        m.elements[0] = r[0]; m.elements[1] = r[1]; m.elements[2] = r[2];
        m.elements[4] = r[3]; m.elements[5] = r[4]; m.elements[6] = r[5];
        m.elements[8] = r[6]; m.elements[9] = r[7]; m.elements[10] = r[8];
        m.elements[12] = t.x; m.elements[13] = t.y; m.elements[14] = t.z;
        
        return m;
    }
    
    multiply(m) {
        const a = this.elements;
        const b = m.elements;
        const result = new Matrix4();
        const r = result.elements;
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                r[i * 4 + j] = 
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
        
        return result;
    }
}

export function triangulatePoint(p1, p2, P1, P2) {
    // Simple triangulation using DLT (Direct Linear Transform)
    const A = [
        p1.x * P1[8] - P1[0], p1.x * P1[9] - P1[1], p1.x * P1[10] - P1[2],
        p1.y * P1[8] - P1[4], p1.y * P1[9] - P1[5], p1.y * P1[10] - P1[6],
        p2.x * P2[8] - P2[0], p2.x * P2[9] - P2[1], p2.x * P2[10] - P2[2],
        p2.y * P2[8] - P2[4], p2.y * P2[9] - P2[5], p2.y * P2[10] - P2[6]
    ];
    
    // SVD or least squares solution (simplified)
    // For now, return a simple approximation
    return new Vector3(p1.x, p1.y, 1.0);
}

export function computeEssentialMatrix(points1, points2) {
    // Simplified essential matrix computation
    // In practice, this would use the 8-point algorithm
    if (points1.length < 8 || points2.length < 8) {
        return null;
    }
    
    // Placeholder - would implement proper 8-point algorithm
    return new Matrix3();
}
