import React, { useState, useCallback, useEffect, memo, useRef } from 'react';
import { useReactFlow } from 'reactflow';
import { FaMousePointer } from 'react-icons/fa';
import { debounce } from 'lodash';

// Memoized component to prevent unnecessary re-renders
const SelectionControl = memo(({ selectionMode, setSelectionMode, selectedNodes = [] }) => {
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const reactFlowInstance = useReactFlow();

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prevMode => !prevMode);
    // Reset context menu when toggling mode
    setContextMenuPosition(null);
  }, [setSelectionMode]);

  // Apply selection mode styling
  useEffect(() => {
    // Apply or remove selection mode class
    const reactFlowElement = document.querySelector('.react-flow');
    if (reactFlowElement) {
      if (selectionMode) {
        reactFlowElement.classList.add('selection-mode');
      } else {
        reactFlowElement.classList.remove('selection-mode');
        
        // Clear any selections when exiting selection mode
        if (reactFlowInstance) {
          reactFlowInstance.setNodes(nodes => 
            nodes.map(node => ({ ...node, selected: false }))
          );
        }
      }
    }
    
    return () => {
      // Cleanup on unmount
      if (reactFlowElement) {
        reactFlowElement.classList.remove('selection-mode');
      }
    };
  }, [selectionMode, reactFlowInstance]);

  // Handle right-click to show context menu
  useEffect(() => {
    const handleContextMenu = (event) => {
      console.log('Context menu event triggered');
      console.log('Selection mode:', selectionMode);
      console.log('Selected nodes:', selectedNodes.length);
      
      // Always prevent default browser context menu in the ReactFlow area
      // when in selection mode
      if (selectionMode) {
        event.preventDefault();
        event.stopPropagation();
        
        // Show the context menu regardless of selected nodes (for testing)
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
        console.log('Custom context menu should appear at:', event.clientX, event.clientY);
        
        // Debug the nodes in the ReactFlow instance
        if (reactFlowInstance) {
          const allNodes = reactFlowInstance.getNodes();
          const selectedNodesInFlow = allNodes.filter(node => node.selected);
          console.log('All nodes in flow:', allNodes.length);
          console.log('Selected nodes in flow:', selectedNodesInFlow.length);
          console.log('Selected nodes prop:', selectedNodes.length);
        }
        return false;
      }
    };

    // Use both the ReactFlow container and the pane for better coverage
    const reactFlowElement = document.querySelector('.react-flow');
    const reactFlowPane = document.querySelector('.react-flow__pane');
    
    if (reactFlowElement) {
      // Use capture phase to intercept the event before it bubbles up
      reactFlowElement.addEventListener('contextmenu', handleContextMenu, true);
    }
    
    if (reactFlowPane) {
      // Also attach to the pane which is where most interactions happen
      reactFlowPane.addEventListener('contextmenu', handleContextMenu, true);
    }
    
    // Fallback to document if specific elements aren't found
    if (!reactFlowElement && !reactFlowPane) {
      document.addEventListener('contextmenu', handleContextMenu, true);
    }

    return () => {
      if (reactFlowElement) {
        reactFlowElement.removeEventListener('contextmenu', handleContextMenu, true);
      }
      if (reactFlowPane) {
        reactFlowPane.removeEventListener('contextmenu', handleContextMenu, true);
      }
      if (!reactFlowElement && !reactFlowPane) {
        document.removeEventListener('contextmenu', handleContextMenu, true);
      }
    };
  }, [selectionMode, selectedNodes]);

  // Set cursor style for selection mode
  useEffect(() => {
    const reactFlowPane = document.querySelector('.react-flow__pane');
    if (reactFlowPane && selectionMode) {
      // Change cursor to crosshair when in selection mode
      reactFlowPane.style.cursor = 'crosshair';
    } else if (reactFlowPane) {
      // Reset cursor when not in selection mode
      reactFlowPane.style.cursor = '';
    }

    return () => {
      const pane = document.querySelector('.react-flow__pane');
      if (pane) {
        pane.style.cursor = '';
      }
    };
  }, [selectionMode]);

  const handleContextMenuClose = () => {
    setContextMenuPosition(null);
  };

  const handleDeleteSelected = () => {
    // Get selected nodes directly from the ReactFlow instance
    const allNodes = reactFlowInstance.getNodes();
    const selectedNodesInFlow = allNodes.filter(node => node.selected);
    
    if (selectedNodesInFlow.length > 0) {
      const selectedNodeIds = selectedNodesInFlow.map(node => node.id);
      
      console.log('Deleting nodes:', selectedNodeIds);
      
      // Remove selected nodes
      reactFlowInstance.setNodes(nodes => 
        nodes.filter(node => !selectedNodeIds.includes(node.id))
      );
      
      // Remove edges connected to selected nodes
      reactFlowInstance.setEdges(edges => 
        edges.filter(edge => 
          !selectedNodeIds.includes(edge.source) && 
          !selectedNodeIds.includes(edge.target)
        )
      );
      
      setContextMenuPosition(null);
    } else {
      console.log('No nodes selected to delete');
      setContextMenuPosition(null);
    }
  };

  return (
    <>
      {/* Selection Control Button */}
      <div 
        className={`selection-control ${selectionMode ? 'active' : ''}`}
        onClick={toggleSelectionMode}
        title={selectionMode ? "Exit Selection Mode" : "Enter Selection Mode"}
      >
        <FaMousePointer />
      </div>
      
      {/* Context Menu */}
      {contextMenuPosition && (
        <div 
          className="selection-context-menu"
          style={{
            position: 'fixed', // Changed from absolute to fixed for better positioning
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            padding: '8px 0',
            zIndex: 9999, // Increased z-index to ensure it appears above other elements
            minWidth: '150px' // Added minimum width for better visibility
          }}
        >
          <div className="context-menu-item" onClick={() => {
            // Copy functionality will be implemented later
            alert('Copy functionality will be implemented in a future update');
            setContextMenuPosition(null);
          }}>
            Copy
          </div>
          <div className="context-menu-item" onClick={handleDeleteSelected}>
            Delete All ({reactFlowInstance ? reactFlowInstance.getNodes().filter(n => n.selected).length : 0})
          </div>
          <div className="context-menu-item" onClick={handleContextMenuClose}>
            Cancel
          </div>
        </div>
      )}
    </>
  );
});

export default SelectionControl;
