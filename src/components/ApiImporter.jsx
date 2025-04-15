import { useState } from 'react';
// We'll use a simpler approach without SwaggerParser

const ApiImporter = ({ onApiImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importMethod, setImportMethod] = useState('file'); // 'file' or 'url'
  const [url, setUrl] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Read the file as text
      const fileContent = await readFileAsText(file);
      
      // Parse the content as JSON
      let parsedContent;
      try {
        parsedContent = JSON.parse(fileContent);
      } catch (e) {
        // If JSON parsing fails, show an error
        throw new Error('Failed to parse file. Only JSON format is supported in the browser.');
      }

      // Basic validation to check if it's an OpenAPI spec
      if (!isValidOpenApiSpec(parsedContent)) {
        throw new Error('The file does not appear to be a valid OpenAPI specification.');
      }
      
      // Pass the parsed spec to the parent component
      onApiImport(parsedContent);
    } catch (err) {
      setError(`Error parsing API specification: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlImport = async (e) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch the API spec from the URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parse the response as JSON
      const specData = await response.json();
      
      // Basic validation to check if it's an OpenAPI spec
      if (!isValidOpenApiSpec(specData)) {
        throw new Error('The URL does not point to a valid OpenAPI specification.');
      }
      
      // Pass the parsed spec to the parent component
      onApiImport(specData);
    } catch (err) {
      setError(`Error fetching or parsing API specification: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic validation function to check if the object looks like an OpenAPI spec
  const isValidOpenApiSpec = (obj) => {
    // Check for required OpenAPI fields
    return (
      obj &&
      (obj.swagger || obj.openapi) && // Has swagger or openapi version
      obj.paths && // Has paths
      typeof obj.paths === 'object'
    );
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  return (
    <div className="api-importer">
      <h2>Import API Specification</h2>
      
      <div className="import-method-selector">
        <button 
          className={importMethod === 'file' ? 'active' : ''} 
          onClick={() => setImportMethod('file')}
        >
          Upload File
        </button>
        <button 
          className={importMethod === 'url' ? 'active' : ''} 
          onClick={() => setImportMethod('url')}
        >
          Import from URL
        </button>
      </div>

      {importMethod === 'file' ? (
        <div className="file-upload">
          <input 
            type="file" 
            accept=".json"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
          <p className="help-text">
            Upload a Swagger/OpenAPI specification file (.json)
          </p>
        </div>
      ) : (
        <form onSubmit={handleUrlImport} className="url-import">
          <input
            type="url"
            placeholder="Enter Swagger/OpenAPI URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !url}>
            Import
          </button>
          <p className="help-text">
            Enter a URL to a Swagger/OpenAPI specification
          </p>
        </form>
      )}

      {isLoading && <div className="loading">Loading API specification...</div>}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default ApiImporter;
