# API Diagram Tool

A React application that allows you to import API specifications (Swagger/OpenAPI) and visualize them as interactive diagrams.

## Features

- Import API specifications from files (JSON, YAML) or URLs
- Automatically generate graphical nodes for API endpoints
- Display endpoint details including methods, paths, parameters, and responses
- Connect nodes to visualize relationships between endpoints
- Interactive diagram with drag-and-drop functionality
- Zoom, pan, and navigate the diagram

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173

## Usage

1. **Import an API Specification**:
   - Click "Upload File" to import a Swagger/OpenAPI specification file (JSON or YAML)
   - Or click "Import from URL" to fetch a specification from a URL

2. **Interact with the Diagram**:
   - Drag nodes to reposition them
   - Connect nodes by dragging from one node's handle to another
   - Use the mouse wheel to zoom in/out
   - Click and drag the background to pan the view
   - Use the controls in the bottom-right corner for additional navigation options

3. **Sample API**:
   - A sample API specification is included at `/public/sample-api.json`
   - You can use this to test the application

## Technologies Used

- React
- React Flow - For interactive node-based diagrams
- Swagger Parser - For parsing OpenAPI specifications
- Vite - For fast development and building

## License

This project is licensed under the MIT License.
