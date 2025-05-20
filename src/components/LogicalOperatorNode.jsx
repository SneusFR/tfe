import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const LogicalOperatorNode = ({ data, id }) => {
  // Default values if data is missing
  const [operatorType, setOperatorType] = useState(data?.operatorType || 'AND');
  const [inputCount, setInputCount] = useState(data?.inputCount || 2);
  
  // Store callback in a ref to prevent recreation on each render
  const callbacksRef = useRef({});
  
  // Update callback ref when id changes
  useEffect(() => {
    callbacksRef.current[id] = {
      onOperatorTypeChange: (newType) => {
        if (data.onOperatorTypeChange) {
          data.onOperatorTypeChange(newType);
        }
      },
      onInputCountChange: (newCount) => {
        if (data.onInputCountChange) {
          data.onInputCountChange(newCount);
        }
      }
    };
  }, [id, data.onOperatorTypeChange, data.onInputCountChange]);
  
  // Update local state when data changes
  useEffect(() => {
    if (data?.operatorType) {
      setOperatorType(data.operatorType);
    }
    if (data?.inputCount) {
      setInputCount(data.inputCount);
    }
  }, [data?.operatorType, data?.inputCount]);
  
  const isConnectedToStartingNode = data?.isConnectedToStartingNode || false;
  const connectionIndicator = data?.connectionIndicator;
  
  // Define attribute colors for handles
  const inputColor = '#2196F3'; // Blue for input
  const trueColor = '#4CAF50'; // Green for true
  const falseColor = '#F44336'; // Red for false
  
  // Get operator type options
  const operatorOptions = useMemo(() => [
    { value: 'AND', label: 'AND - All inputs must be true' },
    { value: 'OR', label: 'OR - At least one input must be true' },
    { value: 'XOR', label: 'XOR - Exactly one input must be true' },
    { value: 'NAND', label: 'NAND - Not all inputs are true' },
    { value: 'NOR', label: 'NOR - All inputs are false' },
    { value: 'XNOR', label: 'XNOR - All inputs are the same' }
  ], []);
  
  // Handle operator type change
  const handleOperatorTypeChange = useCallback((e) => {
    const newType = e.target.value;
    setOperatorType(newType);
    callbacksRef.current[id]?.onOperatorTypeChange?.(newType);
  }, [id]);
  
  // Handle input count change
  const handleInputCountChange = useCallback((e) => {
    const newCount = parseInt(e.target.value, 10);
    if (!isNaN(newCount) && newCount >= 2 && newCount <= 10) {
      setInputCount(newCount);
      callbacksRef.current[id]?.onInputCountChange?.(newCount);
    }
  }, [id]);
  
  // Memoize node style to prevent recreation on each render
  const nodeStyle = useMemo(() => ({
    borderTop: '3px solid #00BCD4', // Cyan for logical operator nodes
    backgroundColor: '#e0f7fa', // Light cyan background
    border: '1px solid #b2ebf2',
    borderRadius: '5px',
    padding: '10px',
    minWidth: '250px',
    minHeight: '150px',
    boxShadow: '0 4px 8px rgba(0, 188, 212, 0.25)',
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
  
  // Generate inputs based on inputCount
  const inputs = useMemo(() => {
    return Array.from({ length: inputCount }, (_, i) => ({
      id: `input-${i + 1}`,
      label: `Input ${i + 1}`
    }));
  }, [inputCount]);
  
  return (
    <div 
      className="logical-operator-node"
      style={nodeStyle}
    >
      {/* Delete button */}
      {data.deleteButton}
      
      {/* Connection indicator */}
      {connectionIndicator}
      
      {/* Node header */}
      <div className="logical-operator-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="logical-operator-node-type" 
          style={{ 
            backgroundColor: '#00BCD4',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          LOGIC
        </div>
        <div className="logical-operator-node-title" style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Logical Operator
        </div>
      </div>
      
      {/* Operator Type Selector */}
      <div className="logical-operator-node-section">
        <div className="logical-operator-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Operator Type:
        </div>
        <select
          value={operatorType}
          onChange={handleOperatorTypeChange}
          style={{
            width: '100%',
            padding: '4px',
            fontSize: '12px',
            borderRadius: '3px',
            border: '1px solid #b2ebf2',
            backgroundColor: '#fff',
            marginBottom: '8px'
          }}
        >
          {operatorOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Input Count Selector */}
      <div className="logical-operator-node-section">
        <div className="logical-operator-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Number of Inputs:
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <input
            type="range"
            min="2"
            max="10"
            value={inputCount}
            onChange={handleInputCountChange}
            style={{
              flex: 1,
              marginRight: '8px'
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
            {inputCount}
          </span>
        </div>
      </div>
      
      {/* Inputs Section */}
      <div className="logical-operator-node-section">
        <div className="logical-operator-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Inputs:
        </div>
        <div className="logical-operator-node-inputs" style={{ marginBottom: '8px' }}>
          {inputs.map((input, index) => (
            <div 
              key={input.id}
              className="logical-operator-node-input" 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                marginBottom: '4px',
                padding: '4px',
                borderRadius: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid #b2ebf2'
              }}
            >
              <div 
                className="input-indicator"
                style={{ 
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: inputColor,
                  marginRight: '8px'
                }}
              ></div>
              <div className="input-label" style={{ fontSize: '12px' }}>
                {input.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Output Paths Section */}
      <div className="logical-operator-node-section">
        <div className="logical-operator-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Output Paths:
        </div>
        <div className="logical-operator-node-paths" style={{ marginBottom: '8px' }}>
          {/* True Path */}
          <div 
            className="logical-operator-node-path" 
            style={{ 
              display: 'flex',
              alignItems: 'center',
              marginBottom: '4px',
              padding: '4px',
              borderRadius: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              border: `1px solid ${trueColor}`
            }}
          >
            <div 
              className="path-indicator"
              style={{ 
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: trueColor,
                marginRight: '8px'
              }}
            ></div>
            <div className="path-label" style={{ fontSize: '12px' }}>
              True
            </div>
          </div>
          
          {/* False Path */}
          <div 
            className="logical-operator-node-path" 
            style={{ 
              display: 'flex',
              alignItems: 'center',
              marginBottom: '4px',
              padding: '4px',
              borderRadius: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              border: `1px solid ${falseColor}`
            }}
          >
            <div 
              className="path-indicator"
              style={{ 
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: falseColor,
                marginRight: '8px'
              }}
            ></div>
            <div className="path-label" style={{ fontSize: '12px' }}>
              False
            </div>
          </div>
        </div>
      </div>
      
      {/* Execution flow handles (triangles) */}
      <Handle
        type="target"
        position={Position.Left}
        id="execution"
        style={getExecutionHandleStyle('left')}
      />
      
      {/* Input data handles - dynamically generated based on inputCount */}
      {inputs.map((input, index) => {
        const verticalPosition = 25 + (index * (50 / inputCount)); // Distribute handles vertically
        return (
          <Handle
            key={input.id}
            type="target"
            position={Position.Left}
            id={input.id}
            style={{ 
              ...getDataHandleStyle(inputColor),
              top: `${verticalPosition}%`,
              left: -5
            }}
          />
        );
      })}
      
      {/* Output execution handles - true and false */}
      <Handle
        type="source"
        position={Position.Right}
        id="execution-true"
        style={{ 
          ...getExecutionHandleStyle('right'),
          top: '35%',
          right: -10
        }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="execution-false"
        style={{ 
          ...getExecutionHandleStyle('right'),
          top: '65%',
          right: -10
        }}
      />
    </div>
  );
};

export default memo(LogicalOperatorNode);
