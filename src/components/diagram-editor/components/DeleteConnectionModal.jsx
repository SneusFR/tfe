import React from 'react';
import '../../../styles/DeleteConnectionModal.css';

const DeleteConnectionModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-connection-modal-overlay">
      <div className="delete-connection-modal">
        <div className="delete-connection-modal-content">
          <h3>Confirmation</h3>
          <p>Voulez-vous supprimer cette connexion ?</p>
          <div className="delete-connection-modal-buttons">
            <button 
              className="delete-connection-modal-button cancel" 
              onClick={onClose}
            >
              Annuler
            </button>
            <button 
              className="delete-connection-modal-button confirm" 
              onClick={onConfirm}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConnectionModal;
