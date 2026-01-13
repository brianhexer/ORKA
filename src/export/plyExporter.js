/**
 * PLY format exporter
 */

export class PLYExporter {
    /**
     * Export point cloud or mesh to PLY format
     */
    export(sceneManager, binary = false) {
        const pointCloud = sceneManager.getPointCloud();
        const mesh = sceneManager.getMesh();
        
        if (mesh && mesh.geometry) {
            return this.exportMesh(mesh.geometry, binary);
        } else if (pointCloud && pointCloud.geometry) {
            return this.exportPointCloud(pointCloud.geometry, binary);
        }
        
        return binary ? new ArrayBuffer(0) : '';
    }
    
    exportPointCloud(geometry, binary = false) {
        const positions = geometry.attributes.position;
        const colors = geometry.attributes.color;
        const hasColors = colors !== undefined;
        const vertexCount = positions.count;
        
        if (binary) {
            return this.exportBinary(positions, colors, vertexCount, hasColors, false);
        } else {
            return this.exportASCII(positions, colors, vertexCount, hasColors, false);
        }
    }
    
    exportMesh(geometry, binary = false) {
        const positions = geometry.attributes.position;
        const colors = geometry.attributes.color;
        const hasColors = colors !== undefined;
        const vertexCount = positions.count;
        const hasFaces = geometry.index !== null;
        
        if (binary) {
            return this.exportBinary(positions, colors, vertexCount, hasColors, hasFaces, geometry.index);
        } else {
            return this.exportASCII(positions, colors, vertexCount, hasColors, hasFaces, geometry.index);
        }
    }
    
    exportASCII(positions, colors, vertexCount, hasColors, hasFaces, index = null) {
        let plyContent = 'ply\n';
        plyContent += 'format ascii 1.0\n';
        plyContent += `element vertex ${vertexCount}\n`;
        plyContent += 'property float x\n';
        plyContent += 'property float y\n';
        plyContent += 'property float z\n';
        
        if (hasColors) {
            plyContent += 'property uchar red\n';
            plyContent += 'property uchar green\n';
            plyContent += 'property uchar blue\n';
        }
        
        if (hasFaces && index) {
            const faceCount = index.count / 3;
            plyContent += `element face ${faceCount}\n`;
            plyContent += 'property list uchar int vertex_indices\n';
        }
        
        plyContent += 'end_header\n';
        
        // Write vertices
        for (let i = 0; i < vertexCount; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            plyContent += `${x} ${y} ${z}`;
            
            if (hasColors) {
                const r = Math.round(colors.getX(i) * 255);
                const g = Math.round(colors.getY(i) * 255);
                const b = Math.round(colors.getZ(i) * 255);
                plyContent += ` ${r} ${g} ${b}`;
            }
            
            plyContent += '\n';
        }
        
        // Write faces
        if (hasFaces && index) {
            for (let i = 0; i < index.count; i += 3) {
                const a = index.getX(i);
                const b = index.getX(i + 1);
                const c = index.getX(i + 2);
                plyContent += `3 ${a} ${b} ${c}\n`;
            }
        }
        
        return plyContent;
    }
    
    exportBinary(positions, colors, vertexCount, hasColors, hasFaces, index = null) {
        // Binary PLY export would go here
        // For now, fall back to ASCII
        return this.exportASCII(positions, colors, vertexCount, hasColors, hasFaces, index);
    }
    
    /**
     * Download PLY file
     */
    download(plyData, filename = 'model.ply', isBinary = false) {
        const blob = isBinary
            ? new Blob([plyData], { type: 'application/octet-stream' })
            : new Blob([plyData], { type: 'text/plain' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}
