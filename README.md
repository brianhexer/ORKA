# Web-Based Real-Time SLAM 3D Reconstruction

A web-based application for real-time 3D reconstruction using SLAM (Simultaneous Localization and Mapping) from a live webcam feed.

## Features

- Real-time 3D reconstruction from webcam input
- SLAM-based feature detection and tracking
- Interactive 3D viewer with point clouds and meshes
- Model editing and optimization tools
- Export to multiple formats (OBJ, GLTF, PLY)
- GitHub Pages deployment

## Technology Stack

- **Three.js** - 3D rendering and visualization
- **OpenCV.js** - Computer vision and feature detection
- **WebRTC** - Webcam access
- **Vite** - Build tool and development server

## Setup

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Build

```bash
npm run build
```

Build output will be in the `dist/` directory.

## Usage

1. Click "Start Capture" to begin webcam feed
2. Move the camera around the object/scene to capture different angles
3. The 3D reconstruction will update in real-time
4. Use the export buttons to download the 3D model in various formats
5. Click "Reset" to clear the current reconstruction

## Browser Requirements

- Modern browser with WebGL support
- WebRTC (getUserMedia) support
- ES6+ JavaScript support

## Deployment

This project is configured for GitHub Pages deployment. The GitHub Actions workflow will automatically build and deploy on push to main branch.

## License

MIT
