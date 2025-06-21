import React from 'react';
import { motion } from 'framer-motion';

/**
 * NoFlowOverlay component that displays when no flow is active
 * Provides a message and a button to create or load a flow
 */
const NoFlowOverlay = ({ toggleFlowModal }) => {
  return (
    <div className="flow-required-overlay" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      color: 'white',
      textAlign: 'center',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '500px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        <h2 style={{ marginTop: 0 }}>Aucun flow actif</h2>
        <p>Vous devez créer un nouveau flow ou charger un flow existant pour continuer.</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFlowModal}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Créer ou charger un flow
        </motion.button>
      </motion.div>
    </div>
  );
};

export default NoFlowOverlay;
