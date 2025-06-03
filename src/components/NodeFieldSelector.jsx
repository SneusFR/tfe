import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaCog, FaTimes } from 'react-icons/fa';

// Styles for the field selector
const styles = {
  gearIcon: {
    cursor: 'pointer',
    color: '#e74c3c',
    fontSize: '14px',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: '50%',
    padding: '3px',
    border: '1px solid rgba(231, 76, 60, 0.3)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '6px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
  },
  gearIconHover: {
    transform: 'scale(1.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 0 5px rgba(231, 76, 60, 0.5)',
    color: '#e74c3c',
  },
  modal: {
    position: 'fixed',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    padding: '16px',
    zIndex: 1000,
    minWidth: '250px',
    maxWidth: '300px',
    border: '1px solid #ccc',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    borderBottom: '1px solid #eee',
    paddingBottom: '8px',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#777',
    fontSize: '16px',
    padding: '0',
  },
  fieldList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  fieldItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  checkbox: {
    marginRight: '10px',
  },
  fieldLabel: {
    fontSize: '13px',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    marginTop: '16px',
    cursor: 'pointer',
    width: '100%',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  saveButtonHover: {
    backgroundColor: '#45a049',
  },
  selectAllContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee',
  },
  selectAllButton: {
    background: 'none',
    border: 'none',
    color: '#2196F3',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '0',
  }
};

const NodeFieldSelector = ({ 
  node, 
  isSelected, 
  fields, 
  visibleFields, 
  onVisibleFieldsChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [localVisibleFields, setLocalVisibleFields] = useState(visibleFields || []);
  const modalRef = useRef(null);
  const gearIconRef = useRef(null);

  // Update local state when props change
  useEffect(() => {
    setLocalVisibleFields(visibleFields || []);
  }, [visibleFields]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen && 
        modalRef.current && 
        !modalRef.current.contains(event.target) &&
        gearIconRef.current && 
        !gearIconRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculate position for the modal
  const calculatePosition = () => {
    if (!gearIconRef.current) return { x: 0, y: 0 };
    
    const rect = gearIconRef.current.getBoundingClientRect();
    
    // Position the modal to the right of the gear icon by default
    let x = rect.right + 10;
    let y = rect.top;
    
    // Get window dimensions
    const modalWidth = 300;
    const modalHeight = 400; // Increased height estimate
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Check if modal would go off the right edge of the screen
    if (x + modalWidth > windowWidth) {
      // Position to the left of the gear icon instead
      x = rect.left - modalWidth - 10;
    }
    
    // Check if modal would go off the bottom of the screen
    if (y + modalHeight > windowHeight) {
      // Position above the gear icon if it would go off the bottom
      y = Math.max(10, windowHeight - modalHeight - 10);
    }
    
    // Ensure modal is always visible on screen
    x = Math.max(10, Math.min(windowWidth - modalWidth - 10, x));
    y = Math.max(10, Math.min(windowHeight - modalHeight - 10, y));
    
    return { x, y };
  };

  const toggleModal = () => {
    if (!isOpen) {
      const newPosition = calculatePosition();
      setPosition(newPosition);
      console.log("Opening modal at position:", newPosition);
    } else {
      console.log("Closing modal");
    }
    setIsOpen(!isOpen);
  };

  const handleFieldToggle = (field) => {
    setLocalVisibleFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  const handleSave = () => {
    onVisibleFieldsChange(localVisibleFields);
    setIsOpen(false);
  };

  const selectAll = () => {
    setLocalVisibleFields([...fields]);
  };

  const selectNone = () => {
    setLocalVisibleFields([]);
  };

  // Always show the gear icon for now (for testing)
  // Later we can make it conditional based on isSelected
  // if (!isSelected) return null;

  return (
    <>
      <div
        ref={gearIconRef}
        style={{
          ...styles.gearIcon,
          ...(hovering ? styles.gearIconHover : {})
        }}
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          e.preventDefault();
          toggleModal();
          console.log("Gear icon clicked, toggling modal:", !isOpen);
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        title="Configure visible fields"
      >
        <FaCog size={16} />
      </div>

      {/* Modal portal */}
      {createPortal(
        isOpen && (
        <div
          ref={modalRef}
          style={{
            ...styles.modal,
            top: `${position.y}px`,
            left: `${position.x}px`,
            display: isOpen ? 'block' : 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.modalHeader}>
            <div style={styles.modalTitle}>Configure Node Fields</div>
            <button 
              style={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          <div style={styles.selectAllContainer}>
            <button 
              style={styles.selectAllButton} 
              onClick={selectAll}
            >
              Select All
            </button>
            <button 
              style={styles.selectAllButton} 
              onClick={selectNone}
            >
              Select None
            </button>
          </div>

          <div style={styles.fieldList}>
            {fields.map(field => (
              <div key={field} style={styles.fieldItem}>
                <input
                  type="checkbox"
                  id={`field-${field}`}
                  checked={localVisibleFields.includes(field)}
                  onChange={() => handleFieldToggle(field)}
                  style={styles.checkbox}
                />
                <label 
                  htmlFor={`field-${field}`}
                  style={styles.fieldLabel}
                >
                  {field}
                </label>
              </div>
            ))}
          </div>

          <button 
            style={{
              ...styles.saveButton,
              ...(hovering === 'save' ? styles.saveButtonHover : {})
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            onMouseEnter={() => setHovering('save')}
            onMouseLeave={() => setHovering(false)}
          >
            Apply Changes
          </button>
        </div>
        ),
        document.body
      )}
    </>
  );
};

export default NodeFieldSelector;
