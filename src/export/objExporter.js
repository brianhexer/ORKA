/**
 * OBJ format exporter
 */

export class OBJExporter {
    /**
     * Export point cloud or mesh to OBJ format
     */
    export(sceneManager) {
        const pointCloud = sceneManager.getPointCloud();
        const mesh = sceneManager.getMesh();
        
        let objContent = '# OBJ file exported from SLAM 3D Reconstruction\n';
        
        if (mesh && mesh.geometry) {
            return this.exportMesh(mesh.geometry);
        } else if (pointCloud && pointCloud.geometry) {
            return this.exportPointCloud(pointCloud.geometry);
        }
        
        return '';
    }
    
    exportMesh(geometry) {
        let objContent = '# OBJ file\n';
        const positions = geometry.attributes.position;
        const normals = geometry.attributes.normal;
        const colors = geometry.attributes.color;
        
        // Write vertices
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            objContent += `v ${x} ${y} ${z}\n`;
            
            if (colors) {
                const r = colors.getX(i);
                const g = colors.getY(i);
                const b = colors.getZ(i);
                objContent += `vc ${r} ${g} ${b}\n`;
            }
        }
        
        // Write normals
        if (normals) {
            for (let i = 0; i < normals.count; i++) {
                const nx = normals.getX(i);
                const ny = normals.getY(i);
                const nz = normals.getZ(i);
                objContent += `vn ${nx} ${ny} ${nz}\n`;
            }
        }
        
        // Write faces (if index exists)
        if (geometry.index) {
            const index = geometry.index;
            for (let i = 0; i < index.count; i += 3) {
                const a = index.getX(i) + 1;
                const b = index.getX(i + 1) + 1;
                const c = index.getX(i + 2) + 1;
                objContent += `f ${a} ${b} ${c}\n`;
            }
        } else {
            // No index - treat as point cloud
            objContent += '# No faces (point cloud)\n';
        }
        
        return objContent;
    }
    
    exportPointCloud(geometry) {
        let objContent = '# OBJ file (Point Cloud)\n';
        const positions = geometry.attributes.position;
        const colors = geometry.attributes.color;
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            objContent += `v ${x} ${y} ${z}\n`;
            
            if (colors) {
                const r = colors.getX(i);
                const g = colors.getY(i);
                const b = colors.getZ(i);
                objContent += `vc ${r} ${g} ${b}\n`;
            }
        }
        
        return objContent;
    }
    
    /**
     * Download OBJ file
     */
    download(objContent, filename = 'model.obj') {
        const blob = new Blob([objContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}
