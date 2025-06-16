import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Typography,
  Tooltip,
  CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LinkIcon from '@mui/icons-material/Link';
import SendIcon from '@mui/icons-material/Send';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import '../styles/ApiImporter.css';

const ApiImporter = ({ onApiImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [importMethod, setImportMethod] = useState('file'); // 'file' or 'url'
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);
    setError(null);
    setSuccess(false);

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
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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
    setSuccess(false);

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
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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

  const clearFileSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="api-importer">
      <Typography variant="h6" className="api-importer-title">
        <CloudUploadIcon fontSize="small" style={{ marginRight: '4px' }} />
        Import API Specification
      </Typography>
      
      <div className="import-method-selector">
        <motion.button 
          className={`method-button ${importMethod === 'file' ? 'active' : ''}`}
          onClick={() => {
            setImportMethod('file');
            setError(null);
          }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <UploadFileIcon fontSize="small" />
          Upload File
        </motion.button>
        <motion.button 
          className={`method-button ${importMethod === 'url' ? 'active' : ''}`}
          onClick={() => {
            setImportMethod('url');
            setError(null);
          }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <LinkIcon fontSize="small" />
          Import from URL
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {importMethod === 'file' ? (
          <motion.div 
            className="file-upload"
            key="file-upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="file-input-container">
              <motion.label 
                className="file-input-label"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <UploadFileIcon fontSize="small" />
                {selectedFile ? 'Change File' : 'Choose API Specification File'}
                <input 
                  type="file" 
                  className="file-input"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  ref={fileInputRef}
                />
              </motion.label>
            </div>
            
            {selectedFile && (
              <div className="selected-file">
                <InsertDriveFileIcon fontSize="small" />
                {selectedFile.name}
              </div>
            )}
            
            <p className="help-text">
              Upload a Swagger/OpenAPI specification file (.json)
            </p>
          </motion.div>
        ) : (
          <motion.form 
            onSubmit={handleUrlImport} 
            className="url-import"
            key="url-import"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="url-input-container">
              <input
                type="url"
                className="url-input"
                placeholder="Enter Swagger/OpenAPI URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
              <motion.button 
                type="submit" 
                className="url-import-button"
                disabled={isLoading || !url}
                whileHover={!isLoading && url ? { y: -2 } : {}}
                whileTap={!isLoading && url ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <>
                    <SendIcon fontSize="small" />
                    Import
                  </>
                )}
              </motion.button>
            </div>
            <p className="help-text">
              Enter a URL to a Swagger/OpenAPI specification
            </p>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="loading-spinner"></div>
            Loading API specification...
          </motion.div>
        )}
        
        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ErrorIcon fontSize="small" />
            {error}
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            className="success-message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircleIcon fontSize="small" />
            API specification imported successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApiImporter;
