import { memo, useState, useEffect, useRef, useCallback, useMemo, createRef } from 'react';
import { Handle, Position } from 'reactflow';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db';    // Blue for data links

const ConditionalFlowNode = ({ data, id }) => {
  // Default values if data is missing
  const [conditionType, setConditionType] = useState(data?.conditionType || 'equals');
  const [compareValue, setCompareValue] = useState(data?.value || '');
  const [inputValue, setInputValue] = useState(data?.inputValue || '');
  
  // Store callback in a ref to prevent recreation on each render
  const callbacksRef = useRef({});
  
  // Update callback ref when id changes
  useEffect(() => {
    callbacksRef.current[id] = {
      onConditionTypeChange: (newType) => {
        if (data.onConditionTypeChange) {
          data.onConditionTypeChange(newType);
        }
      },
      onValueChange: (newValue) => {
        if (data.onValueChange) {
          data.onValueChange(newValue);
        }
      },
      onInputValueChange: (newInputValue) => {
        if (data.onInputValueChange) {
          data.onInputValueChange(newInputValue);
        }
      }
    };
  }, [id, data.onConditionTypeChange, data.onValueChange, data.onInputValueChange]);
  
  // Update local state when data changes
  useEffect(() => {
    if (data?.conditionType) {
      setConditionType(data.conditionType);
    }
    if (data?.value !== undefined) {
      setCompareValue(data.value);
    }
    if (data?.inputValue !== undefined) {
      setInputValue(data.inputValue);
    }
  }, [data?.conditionType, data?.value, data?.inputValue]);
  
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [isEditingInputValue, setIsEditingInputValue] = useState(false);
  const isConnectedToStartingNode = data?.isConnectedToStartingNode || false;
  const connectionIndicator = data?.connectionIndicator;
  
  // Define attribute colors for handles
  const inputColor = '#2196F3'; // Blue for input
  const trueColor = '#4CAF50'; // Green for true
  const falseColor = '#F44336'; // Red for false
  const defaultColor = '#FF9800'; // Orange for default
  
  // Get condition type options
  const conditionOptions = useMemo(() => [
    { value: 'equals', label: 'Equals (===)' },
    { value: 'notEquals', label: 'Not Equals (!==)' },
    { value: 'contains', label: 'Contains' },
    { value: 'notContains', label: 'Not Contains' },
    { value: 'greaterThan', label: 'Greater Than (>)' },
    { value: 'lessThan', label: 'Less Than (<)' },
    { value: 'greaterOrEqual', label: 'Greater or Equal (>=)' },
    { value: 'lessOrEqual', label: 'Less or Equal (<=)' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
    { value: 'isEmpty', label: 'Is Empty' },
    { value: 'isNotEmpty', label: 'Is Not Empty' },
    { value: 'isTrue', label: 'Is True' },
    { value: 'isFalse', label: 'Is False' }
  ], []);
  
  const handleValueDoubleClick = () => {
    setIsEditingValue(true);
  };
  
  // Memoized handlers to prevent recreation on each render
  const handleValueBlur = useCallback(() => {
    setIsEditingValue(false);
    callbacksRef.current[id]?.onValueChange?.(compareValue);
  }, [id, compareValue]);
  
  const handleValueKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      setIsEditingValue(false);
      callbacksRef.current[id]?.onValueChange?.(compareValue);
    }
  }, [id, compareValue]);
  
  const handleInputValueDoubleClick = () => {
    setIsEditingInputValue(true);
  };
  
  const handleInputValueBlur = useCallback(() => {
    setIsEditingInputValue(false);
    callbacksRef.current[id]?.onInputValueChange?.(inputValue);
  }, [id, inputValue]);
  
  const handleInputValueKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      setIsEditingInputValue(false);
      callbacksRef.current[id]?.onInputValueChange?.(inputValue);
    }
  }, [id, inputValue]);
  
  const handleConditionTypeChange = useCallback((e) => {
    const newType = e.target.value;
    setConditionType(newType);
    callbacksRef.current[id]?.onConditionTypeChange?.(newType);
  }, [id]);
  
  // Determine if we need to show the value input field
  // Some conditions like isEmpty, isNotEmpty, isTrue, isFalse don't need a comparison value
  const showValueInput = useMemo(() => {
    return !['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(conditionType);
  }, [conditionType]);
  
  // Determine how many output paths we need based on the condition type
  const outputPaths = useMemo(() => {
    // Most conditions have true/false outputs
    const paths = [
      { id: 'true', label: 'True', color: trueColor },
      { id: 'false', label: 'False', color: falseColor }
    ];
    
    // For some conditions we might want to add a "default" or "error" path
    // For example, if comparing numbers but the input is not a number
    if (!['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(conditionType)) {
      paths.push({ id: 'default', label: 'Default', color: defaultColor });
    }
    
    return paths;
  }, [conditionType, trueColor, falseColor, defaultColor]);
  
  // Create refs for output path elements
  const pathRefs = useRef(outputPaths.map(() => createRef()));
  
  // Update refs when outputPaths change
  useEffect(() => {
    pathRefs.current = outputPaths.map(() => createRef());
  }, [outputPaths]);
  
  // Memoize node style to prevent recreation on each render
  const nodeStyle = useMemo(() => ({
    borderTop: '3px solid #FF9800', // Orange for conditional flow nodes
    backgroundColor: '#fff3e0', // Light orange background
    border: '1px solid #ffe0b2',
    borderRadius: '5px',
    padding: '10px',
    minWidth: '250px',
    minHeight: '150px',
    boxShadow: '0 4px 8px rgba(255, 152, 0, 0.25)',
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
        top: 0,
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
  
  return (
    <div 
      className="conditional-flow-node"
      style={nodeStyle}
    >
      {/* Delete button */}
      {data.deleteButton}
      
      {/* Connection indicator */}
      {connectionIndicator}
      
      {/* Node header */}
      <div className="conditional-flow-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          className="conditional-flow-node-type" 
          style={{ 
            backgroundColor: '#FF9800',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '10px',
            marginRight: '8px'
          }}
        >
          CONDITION
        </div>
        <div className="conditional-flow-node-title" style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Conditional Flow
        </div>
      </div>
      
      {/* Condition Type Selector */}
      <div className="conditional-flow-node-section">
        <div className="conditional-flow-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Condition Type:
        </div>
        <select
          value={conditionType}
          onChange={handleConditionTypeChange}
          style={{
            width: '100%',
            padding: '4px',
            fontSize: '12px',
            borderRadius: '3px',
            border: '1px solid #ffe0b2',
            backgroundColor: '#fff',
            marginBottom: '8px'
          }}
        >
          {conditionOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Value Input */}
      <div className="conditional-flow-node-section">
        <div className="conditional-flow-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Value condition:
        </div>
        <div 
          className="conditional-flow-node-value" 
          style={{ 
            fontSize: '12px',
            color: '#333',
            marginBottom: '8px',
            padding: '4px',
            borderRadius: '3px',
            background: '#fff',
            minHeight: '30px',
            border: '1px solid #ffe0b2',
            cursor: 'pointer'
          }}
          onDoubleClick={handleInputValueDoubleClick}
        >
          {isEditingInputValue ? (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleInputValueBlur}
              onKeyDown={handleInputValueKeyDown}
              autoFocus
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                padding: '0',
                background: 'transparent'
              }}
            />
          ) : (
            inputValue || 'Double-click to enter value...'
          )}
        </div>
      </div>
      
      {/* Compare Value Input - Only shown for conditions that need a comparison value */}
      {showValueInput && (
        <div className="conditional-flow-node-section">
          <div className="conditional-flow-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
            Value to compare:
          </div>
          <div 
            className="conditional-flow-node-value" 
            style={{ 
              fontSize: '12px',
              color: '#333',
              marginBottom: '8px',
              padding: '4px',
              borderRadius: '3px',
              background: '#fff',
              minHeight: '30px',
              border: '1px solid #ffe0b2',
              cursor: 'pointer'
            }}
            onDoubleClick={handleValueDoubleClick}
          >
            {isEditingValue ? (
              <input
                type="text"
                value={compareValue}
                onChange={(e) => setCompareValue(e.target.value)}
                onBlur={handleValueBlur}
                onKeyDown={handleValueKeyDown}
                autoFocus
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  padding: '0',
                  background: 'transparent'
                }}
              />
            ) : (
              compareValue || 'Double-click to enter comparison value...'
            )}
          </div>
        </div>
      )}
      
      {/* Output Paths Section */}
      <div className="conditional-flow-node-section">
        <div className="conditional-flow-node-label" style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Output Paths:
        </div>
        <div className="conditional-flow-node-paths" style={{ marginBottom: '8px' }}>
          {outputPaths.map((path, index) => (
            <div 
              key={path.id}
              className="conditional-flow-node-path" 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                marginBottom: '4px',
                padding: '4px',
                borderRadius: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                border: `1px solid ${path.color}`,
                position: 'relative'
              }}
            >
              <div 
                className="path-indicator"
                style={{ 
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: path.color,
                  marginRight: '8px'
                }}
              ></div>
              <div className="path-label" style={{ fontSize: '12px', flex: 1 }}>
                {path.label}
              </div>
              {/* Inline handle for each path */}
              <Handle
                type="source"
                position={Position.Right}
                id={`execution-${path.id}`}
                style={{ 
                  ...getExecutionHandleStyle('right'),
                  position: 'absolute',
                  top: '50%',
                  right: 0,
                  transform: 'translate(100%, -50%)'
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Execution flow handles (triangles) */}
      <Handle
        type="target"
        position={Position.Left}
        id="execution"
        style={getExecutionHandleStyle('left')}
      />
      
      {/* Input data handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="value-input"
        style={{ 
          ...getDataHandleStyle(inputColor),
          top: '38%',
          left: -5
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="compare-input"
        style={{ 
          ...getDataHandleStyle(inputColor),
          top: '55%',
          left: -5
        }}
      />
    </div>
  );
};

export default memo(ConditionalFlowNode);
