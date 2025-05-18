import { useState, useEffect } from 'react';
import { Modal, Box } from '@mui/material';
import ApiNodeForm from './ApiNodeForm';

/**
 * Modal component for displaying the API node form
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Object} props.bodySchema - The OpenAPI schema for the request body
 * @param {Object} props.defaultBody - Default values for the form fields
 * @param {Function} props.onSave - Callback when form is saved
 */
const ApiNodeModal = ({ open, onClose, bodySchema, defaultBody = {}, onSave }) => {
  const [formValues, setFormValues] = useState(defaultBody);

  useEffect(() => {
    setFormValues(defaultBody);
  }, [defaultBody, open]);

  const handleChange = (values) => {
    setFormValues(values);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formValues);
    }
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="api-node-modal-title"
      aria-describedby="api-node-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 0,
          borderRadius: 1,
          outline: 'none',
        }}
      >
        <ApiNodeForm
          schema={bodySchema}
          defaultValues={formValues}
          onChange={handleChange}
          onClose={handleClose}
          onSave={handleSave}
        />
      </Box>
    </Modal>
  );
};

export default ApiNodeModal;
