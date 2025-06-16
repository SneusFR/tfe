import { useState, useEffect } from 'react';
import { Box, TextField, Typography, Button, Switch, FormControlLabel, Checkbox } from '@mui/material';

/**
 * Generates a form from an OpenAPI schema
 * @param {Object} props
 * @param {Object} props.schema - The OpenAPI schema for the request body
 * @param {Object} props.defaultValues - Default values for the form fields
 * @param {Function} props.onChange - Callback when form values change
 * @param {Function} props.onClose - Callback when form is closed
 * @param {Function} props.onSave - Callback when form is saved
 */
const ApiNodeForm = ({ schema, defaultValues = {}, onChange, onClose, onSave }) => {
  const [formValues, setFormValues] = useState(defaultValues);

  useEffect(() => {
    setFormValues(defaultValues);
  }, [defaultValues]);

  // Handle form field change
  const handleChange = (path, value) => {
    setFormValues(prev => {
      const newValues = { ...prev };
      
      // Handle nested paths (e.g. "user.name")
      if (path.includes('.')) {
        const parts = path.split('.');
        let current = newValues;
        
        // Navigate to the nested object
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        
        // Set the value
        current[parts[parts.length - 1]] = value;
      } else {
        // Simple path
        newValues[path] = value;
      }
      
      // Notify parent component
      if (onChange) {
        onChange(newValues);
      }
      
      return newValues;
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formValues);
    }
    if (onClose) {
      onClose();
    }
  };

  // Recursively render form fields based on schema
  const renderFormFields = (schema, path = '') => {
    if (!schema || !schema.properties) {
      return null;
    }

    return Object.entries(schema.properties).map(([key, prop]) => {
      const fieldPath = path ? `${path}.${key}` : key;
      const fieldValue = path ? 
        (formValues[path.split('.')[0]]?.[key] || '') : 
        (formValues[key] || '');
      const isRequired = schema.required?.includes(key);

      // Handle different property types
      switch (prop.type) {
        case 'string':
          return (
            <Box key={fieldPath} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label={`${key}${isRequired ? ' *' : ''}`}
                value={fieldValue}
                onChange={(e) => handleChange(fieldPath, e.target.value)}
                required={isRequired}
                size="small"
                helperText={prop.description}
              />
            </Box>
          );
          
        case 'number':
        case 'integer':
          return (
            <Box key={fieldPath} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label={`${key}${isRequired ? ' *' : ''}`}
                value={fieldValue}
                onChange={(e) => handleChange(fieldPath, e.target.value)}
                required={isRequired}
                type="number"
                size="small"
                helperText={prop.description}
              />
            </Box>
          );
          
        case 'boolean':
          return (
            <Box key={fieldPath} sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!fieldValue}
                    onChange={(e) => handleChange(fieldPath, e.target.checked)}
                  />
                }
                label={key}
              />
            </Box>
          );
          
        case 'object':
          return (
            <Box key={fieldPath} sx={{ mb: 2, pl: 2, borderLeft: '1px solid #eee' }}>
              <Typography variant="subtitle2">{key}</Typography>
              {renderFormFields(prop, fieldPath)}
            </Box>
          );
          
        case 'array':
          // For simplicity, we'll just handle arrays of primitive types for now
          if (prop.items && (prop.items.type === 'string' || prop.items.type === 'number' || prop.items.type === 'integer')) {
            return (
              <Box key={fieldPath} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label={`${key} (comma-separated)${isRequired ? ' *' : ''}`}
                  value={Array.isArray(fieldValue) ? fieldValue.join(', ') : fieldValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    const arrayValue = value ? value.split(',').map(item => item.trim()) : [];
                    handleChange(fieldPath, arrayValue);
                  }}
                  required={isRequired}
                  size="small"
                  helperText={prop.description}
                />
              </Box>
            );
          }
          return null;
          
        default:
          return null;
      }
    });
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 3,
        maxWidth: 400,
        maxHeight: 500,
        overflow: 'auto'
      }}
    >
      <Typography variant="h6" gutterBottom>
        API Request Body
      </Typography>
      
      {schema && renderFormFields(schema)}
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onClose} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button type="submit" variant="contained">
          Save
        </Button>
      </Box>
    </Box>
  );
};

export default ApiNodeForm;
