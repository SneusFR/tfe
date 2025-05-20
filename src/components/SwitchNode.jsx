import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const SwitchNode = ({ data, id }) => {
  // Default values if data is missing
  const [cases, setCases] = useState(data?.cases || [
    { id: '1', value: '', label: 'Case 1' },
    { id: '2', value: '', label: 'Case 2' }
  ]);
  const [editingCaseId, setEditingCaseId] = useState(null);
  const [editingCaseValue, setEditingCaseValue] = useState('');
  const [editingCaseLabel, setEditingCaseLabel] = useState('');
  
  // Store callback in a ref to prevent recreation on each render
  const callbacksRef = useRef({});
  
  // Update callback ref when id changes
  useEffect(() => {
    callbacksRef.current[id] = {
      onCasesChange: (newCases) => {
        if (data.onCasesChange) {
          data.onCasesChange(newCases);
        }
      }
    };
  }, [id, data.onCasesChange]);
  
  // Update local state when data changes
  useEffect(() => {
    if (data?.cases) {
      setCases(data.cases);
    }
  }, [data?.cases]);
  
  const isConnectedToStartingNode = data?.isConnectedToStartingNode || false;
  const connectionIndicator = data?.connectionIndicator;
  
  // Define attribute colors for handles
  const inputColor = '#2196F3'; // Blue for input
  const defaultColor = '#FF9800'; // Orange for default
  const caseColors = useMemo(() => [
    '#4CAF50', // Green
    '#F44336', // Red
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#FFEB3B', // Yellow
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#E91E63', // Pink
  ], []);
  
  // Start editing a case
  const handleCaseDoubleClick = useCallback((caseItem) => {
    setEditingCaseId(caseItem.id);
    setEditingCaseValue(caseItem.value);
    setEditingCaseLabel(caseItem.label);
  }, []);
  
  // Save case changes
  const handleCaseSave = useCallback(() => {
    if (editingCaseId) {
      const updatedCases = cases.map(c => 
        c.id === editingCaseId 
          ? { ...c, value: editingCaseValue, label: editingCaseLabel } 
          : c
      );
      setCases(updatedCases);
      callbacksRef.current[id]?.onCasesChange?.(updatedCases);
      setEditingCaseId(null);
    }
  }, [editingCaseId, editingCaseValue, editingCaseLabel, cases, id]);
  
  // Handle key down events in the editing inputs
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleCaseSave();
    } else if (e.key === 'Escape') {
      setEditingCaseId(null);
    }
  }, [handleCaseSave]);
  
  // Add a new case
  const handleAddCase = useCallback(() => {
    const newId = String(Math.max(...cases.map(c => parseInt(c.id)), 0) + 1);
    const newCase = {
      id: newId,
      value: '',
      label: `Case ${newId}`
    };
    const updatedCases = [...cases, newCase];
    setCases(updatedCases);
    callbacksRef.current[id]?.onCasesChange?.(updatedCases);
  }, [cases, id]);
  
  // Remove a case
  const handleRemoveCase = useCallback((caseId) => {
    if (cases.length <= 1) {
      return; // Don't remove the last case
    }
    const updatedCases = cases.filter(c => c.id !== caseId);
    setCases(updatedCases);
    callbacksRef.current[id]?.onCasesChange?.(updatedCases);
  }, [cases, id]);
  
  // Memoize node style to prevent recreation on each render
  const nodeStyle = useMemo(() => ({
    borderTop: '3px solid #9C27B0', // Purple for switch nodes
    backgroundColor: '#f3e5f5', // Light purple background
    border: '1px solid #e1bee7',
    borderRadius: '5px',
    padding: '10px',
    minWidth: '250px',
    minHeight: '200px',
    boxShadow: '0 4px 8px rgba(156, 39, 176, 0.25)',
    zIndex: 10,
    position: 'relative',
    transition: 'box-shadow 0.3s ease, transform 0.2s ease'
  }), []);
  
  // Execution handle styles
  const getExecutionHandleStyle = useCallback((position) => {
    const baseStyle = {
      background: 'transparent',
      width: 0,
      height: 0,
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
    };
    
    if (position === 'left') {
      return {
        ...baseStyle,
        borderRight: '10px solid ' + EXECUTION_LINK_COLOR,
        top: 50,
        left: -10,
        opacity: 0.8,
      };
    } else {
      return {
        ...baseStyle,
        borderLeft: '10px solid ' + EXECUTION_LINK_COLOR,
        opacity: 0.8,
      };
    }
  }, []);
  
  // Data handle styles
  const getDataHandleStyle = useCallback((color) => {
    return {
      background: color,
      width: '10px',
      height: '10px',
      border: '2px solid white',
      boxShadow: '0 0 3px rgba(0,0,0,0.3)'
    };
  }, []);
  
  // Get color for a case based on its index
  const getCaseColor = useCallback((index) => {
    return caseColors[index % caseColors.length];
  }, [caseColors]);
  
  return (
    <div 
      className="switch-node"
      style={nodeStyle}
    >
      {/* Delete button */}
      {data.deleteButton}
      
      {/* Connection indicator */}
      {connectionIndicator}
      
      {/* Node header */}
      <div className="switch-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="switch-node-type" 
          style={{ 
            backgroundColor: '#9C27B0',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          SWITCH
        </div>
        <div className="switch-node-title" style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Switch Flow
        </div>
      </div>
      
      {/* Cases Section */}
      <div className="switch-node-section">
        <div className="switch-node-label" style={{ 
          fontSize: '11px', 
          marginBottom: '4px', 
          color: '#555',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Cases:</span>
          <button 
            onClick={handleAddCase}
            style={{
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            + Add Case
          </button>
        </div>
        <div className="switch-node-cases" style={{ marginBottom: '8px' }}>
          {cases.map((caseItem, index) => (
            <div 
              key={caseItem.id}
              className="switch-node-case" 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                marginBottom: '4px',
                padding: '4px',
                borderRadius: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                border: `1px solid ${getCaseColor(index)}`
              }}
              onDoubleClick={() => handleCaseDoubleClick(caseItem)}
            >
              {editingCaseId === caseItem.id ? (
                <>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input
                      type="text"
                      value={editingCaseLabel}
                      onChange={(e) => setEditingCaseLabel(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Case label"
                      style={{
                        width: '100%',
                        fontSize: '11px',
                        padding: '2px 4px',
                        border: '1px solid #e1bee7',
                        borderRadius: '2px'
                      }}
                    />
                    <input
                      type="text"
                      value={editingCaseValue}
                      onChange={(e) => setEditingCaseValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Case value"
                      style={{
                        width: '100%',
                        fontSize: '11px',
                        padding: '2px 4px',
                        border: '1px solid #e1bee7',
                        borderRadius: '2px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={handleCaseSave}
                      style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        padding: '2px 4px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingCaseId(null)}
                      style={{
                        backgroundColor: '#F44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        padding: '2px 4px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div 
                    className="case-indicator"
                    style={{ 
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getCaseColor(index),
                      marginRight: '8px'
                    }}
                  ></div>
                  <div className="case-content" style={{ flex: 1, fontSize: '12px' }}>
                    <div className="case-label" style={{ fontWeight: 'bold' }}>
                      {caseItem.label}
                    </div>
                    <div className="case-value" style={{ fontSize: '10px', color: '#666' }}>
                      Value: {caseItem.value || '(empty)'}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveCase(caseItem.id)}
                    style={{
                      backgroundColor: '#F44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '2px',
                      padding: '2px 4px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      visibility: cases.length > 1 ? 'visible' : 'hidden'
                    }}
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Default Case Section */}
      <div className="switch-node-default" style={{ 
        marginBottom: '8px',
        padding: '4px',
        borderRadius: '3px',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        border: `1px solid ${defaultColor}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div 
            className="default-indicator"
            style={{ 
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: defaultColor,
              marginRight: '8px'
            }}
          ></div>
          <div className="default-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>
            Default
          </div>
        </div>
        <div className="default-description" style={{ fontSize: '10px', color: '#666', marginLeft: '16px' }}>
          Executed when no case matches
        </div>
      </div>
      
      {/* Execution flow handles (triangles) */}
      <Handle
        type="target"
        position={Position.Left}
        id="execution"
        style={getExecutionHandleStyle('left')}
      />
      
      {/* Input data handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ 
          ...getDataHandleStyle(inputColor),
          top: '40%',
          left: -5
        }}
      />
      
      {/* Output execution handles - one for each case plus default */}
      {cases.map((caseItem, index) => {
        const verticalPosition = 25 + (index * 15); // Distribute handles vertically
        return (
          <Handle
            key={caseItem.id}
            type="source"
            position={Position.Right}
            id={`execution-case-${caseItem.id}`}
            style={{ 
              ...getExecutionHandleStyle('right'),
              top: `${verticalPosition}%`,
              right: -10
            }}
          />
        );
      })}
      
      {/* Default case handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="execution-default"
        style={{ 
          ...getExecutionHandleStyle('right'),
          top: '85%',
          right: -10
        }}
      />
    </div>
  );
};

export default memo(SwitchNode);
