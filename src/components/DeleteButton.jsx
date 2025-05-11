import React, { memo } from 'react';
import { FaTimes } from 'react-icons/fa';

const DeleteButton = memo(({ id, onDelete }) => {
  return (
    <div 
      className="node-delete-button"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(id);
      }}
      style={{
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: '#ff4d4f',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '12px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        zIndex: 100
      }}
    >
      <FaTimes />
    </div>
  );
});

export default DeleteButton;
