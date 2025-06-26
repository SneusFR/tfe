import React from 'react';
import '../../../styles/DeleteConnectionModal.css'; // Reusing the same styles

const ConnectionErrorModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-connection-modal-overlay">
      <div className="delete-connection-modal">
        <div className="delete-connection-modal-content">
          <h3>Erreur de connexion</h3>
          <p>{message || "Cette arête d'exécution est déjà connectée. Une arête d'exécution ne peut avoir qu'une source et une cible."}</p>
          <div className="delete-connection-modal-buttons">
            <button 
              className="delete-connection-modal-button confirm" 
              onClick={onClose}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionErrorModal;
