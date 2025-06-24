import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { Handle, Position } from 'reactflow';
import { Editor, EditorState, RichUtils, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';
import DeleteButton from '../../components/common/DeleteButton';

// Material UI icons for formatting toolbar
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';

// Connection colors
const EXECUTION_LINK_COLOR = '#555'; // Gray for execution links
const DATA_LINK_COLOR = '#3498db'; // Blue for data links
const MAIL_BODY_COLOR = '#FF6D00'; // Orange for mail body nodes

const MailBodyNode = ({ data, id }) => {
  // State to control visibility of the editor content
  const [isContentVisible, setIsContentVisible] = useState(true);
  
  // Toggle content visibility
  const toggleContentVisibility = useCallback((e) => {
    e.stopPropagation();
    setIsContentVisible(prev => !prev);
  }, []);
  
  // Initialize editor state from data or with empty content
  const [editorState, setEditorState] = useState(() => {
    if (data?.content) {
      try {
        // Try to parse the content as raw Draft.js content
        return EditorState.createWithContent(convertFromRaw(JSON.parse(data.content)));
      } catch (e) {
        // If parsing fails, create with plain text
        return EditorState.createWithContent(ContentState.createFromText(data?.content || 'Enter your email template here...'));
      }
    }
    return EditorState.createWithContent(ContentState.createFromText('Enter your email template here...'));
  });
  
  // Track detected variables in the content
  const [variables, setVariables] = useState([]);
  
  // Store callback in a ref to prevent recreation on each render
  const callbacksRef = useRef({});
  
  // Editor ref for focus management
  const editorRef = useRef(null);
  
  // Update callback ref when id changes
  useEffect(() => {
    callbacksRef.current[id] = (newContent) => {
      if (data.onContentChange) {
        data.onContentChange(newContent);
      }
    };
  }, [id, data.onContentChange]);
  
  // Detect variables in the content (words starting with $)
  useEffect(() => {
    const contentState = editorState.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    const text = rawContent.blocks.map(block => block.text).join('\n');
    
    // Find all variables (words starting with $)
    const variableRegex = /\$([a-zA-Z][a-zA-Z0-9_]*)/g;
    const matches = [...text.matchAll(variableRegex)];
    
    // Extract unique variable names
    const uniqueVars = [...new Set(matches.map(match => match[1]))];
    
    // Update variables state if changed
    if (JSON.stringify(uniqueVars) !== JSON.stringify(variables)) {
      setVariables(uniqueVars);
    }
    
    // Save content to node data
    const contentJson = JSON.stringify(rawContent);
    callbacksRef.current[id]?.(contentJson);
  }, [editorState, id, variables]);
  
  // Handle editor state changes
  const handleEditorChange = useCallback((state) => {
    setEditorState(state);
  }, []);
  
  // Handle keyboard shortcuts for formatting
  const handleKeyCommand = useCallback((command, editorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  }, []);
  
  // Toggle block type (lists, quotes, etc.)
  const toggleBlockType = useCallback((blockType) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  }, [editorState]);
  
  // Toggle inline style (bold, italic, etc.)
  const toggleInlineStyle = useCallback((inlineStyle) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  }, [editorState]);
  
  // Focus the editor when clicking on the node
  const focusEditor = useCallback((e) => {
    // Stop propagation to prevent the node from being selected
    e.stopPropagation();
    
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);
  
  // Memoize node style to prevent recreation on each render
  const nodeStyle = useMemo(() => ({
    borderTop: `3px solid ${MAIL_BODY_COLOR}`,
    backgroundColor: '#FFF3E0', // Light orange background
    border: '1px solid #FFE0B2',
    borderRadius: '5px',
    padding: '10px',
    minWidth: '300px',
    minHeight: '150px',
    boxShadow: '0 4px 8px rgba(255, 109, 0, 0.25)',
    zIndex: 10,
    position: 'relative',
    transition: 'box-shadow 0.3s ease, transform 0.2s ease'
  }), []);
  
  // Memoize header style
  const headerTypeStyle = useMemo(() => ({
    backgroundColor: MAIL_BODY_COLOR,
    padding: '2px 6px',
    borderRadius: '3px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '10px',
    marginRight: '8px'
  }), []);
  
  // Memoize content style
  const contentStyle = useMemo(() => ({
    fontSize: '12px',
    color: '#333',
    marginBottom: '8px',
    padding: '8px',
    borderRadius: '3px',
    background: '#fff',
    minHeight: '100px',
    border: '1px solid #FFE0B2',
    overflow: 'auto'
  }), []);
  
  // Memoize toolbar style
  const toolbarStyle = useMemo(() => ({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '8px',
    padding: '4px',
    borderRadius: '3px',
    background: '#FFF8E1',
    border: '1px solid #FFE0B2'
  }), []);
  
  // Memoize toolbar button style
  const toolbarButtonStyle = useMemo(() => ({
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px'
  }), []);
  
  // Memoize active toolbar button style
  const activeToolbarButtonStyle = useMemo(() => ({
    ...toolbarButtonStyle,
    background: '#FFE0B2'
  }), [toolbarButtonStyle]);
  
  // Memoize handle style
  const handleStyle = useMemo(() => ({
    background: DATA_LINK_COLOR,
    width: '8px',
    height: '8px'
  }), []);
  
  // Memoize variable handle style
  const variableHandleStyle = useMemo(() => ({
    background: '#9C27B0', // Purple for variables
    width: '8px',
    height: '8px'
  }), []);
  
  // Get current inline styles
  const currentInlineStyles = editorState.getCurrentInlineStyle();
  
  // Get current block type
  const currentBlockType = editorState
    .getCurrentContent()
    .getBlockForKey(editorState.getSelection().getStartKey())
    .getType();
  
  // Handle toolbar button click without losing focus
  const handleToolbarButtonClick = useCallback((action, value = null) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (action === 'toggleInlineStyle') {
      toggleInlineStyle(value);
    } else if (action === 'toggleBlockType') {
      toggleBlockType(value);
    }
    
    // Re-focus the editor after applying the style
    if (editorRef.current) {
      setTimeout(() => {
        editorRef.current.focus();
      }, 0);
    }
  }, [toggleInlineStyle, toggleBlockType]);
  
  return (
    <div
      className="mail-body-node"
      style={nodeStyle}
    >
      {/* Delete button - visibility controlled by CSS */}
      {data.onDelete && <DeleteButton id={id} onDelete={data.onDelete} />}
      
      {/* Connection indicator */}
      {data.connectionIndicator}
      
      {/* Node header */}
      <div className="mail-body-node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', justifyContent: 'space-between' }}>
        <div
          className="mail-body-node-type"
          style={headerTypeStyle}
        >
          MAIL BODY
        </div>
        <button
          type="button"
          onClick={toggleContentVisibility}
          style={{
            border: 'none',
            background: MAIL_BODY_COLOR,
            color: 'white',
            borderRadius: '3px',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            fontSize: '16px'
          }}
          title={isContentVisible ? "Hide editor" : "Show editor"}
        >
          {isContentVisible ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
        </button>
      </div>
      
      {/* Formatting toolbar (conditionally visible) */}
      {isContentVisible && (
      <div className="mail-body-toolbar" style={toolbarStyle} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          style={currentInlineStyles.has('BOLD') ? activeToolbarButtonStyle : toolbarButtonStyle}
          onClick={handleToolbarButtonClick('toggleInlineStyle', 'BOLD')}
          title="Bold"
        >
          <FormatBoldIcon fontSize="small" />
        </button>
        <button
          type="button"
          style={currentInlineStyles.has('ITALIC') ? activeToolbarButtonStyle : toolbarButtonStyle}
          onClick={handleToolbarButtonClick('toggleInlineStyle', 'ITALIC')}
          title="Italic"
        >
          <FormatItalicIcon fontSize="small" />
        </button>
        <button
          type="button"
          style={currentInlineStyles.has('UNDERLINE') ? activeToolbarButtonStyle : toolbarButtonStyle}
          onClick={handleToolbarButtonClick('toggleInlineStyle', 'UNDERLINE')}
          title="Underline"
        >
          <FormatUnderlinedIcon fontSize="small" />
        </button>
        <button
          type="button"
          style={currentBlockType === 'header-one' ? activeToolbarButtonStyle : toolbarButtonStyle}
          onClick={handleToolbarButtonClick('toggleBlockType', 'header-one')}
          title="Heading 1"
        >
          <FormatSizeIcon fontSize="small" />1
        </button>
        <button
          type="button"
          style={currentBlockType === 'header-two' ? activeToolbarButtonStyle : toolbarButtonStyle}
          onClick={handleToolbarButtonClick('toggleBlockType', 'header-two')}
          title="Heading 2"
        >
          <FormatSizeIcon fontSize="small" />2
        </button>
        <button
          type="button"
          style={currentBlockType === 'unordered-list-item' ? activeToolbarButtonStyle : toolbarButtonStyle}
          onClick={handleToolbarButtonClick('toggleBlockType', 'unordered-list-item')}
          title="Bullet List"
        >
          <FormatListBulletedIcon fontSize="small" />
        </button>
        <button
          type="button"
          style={currentBlockType === 'ordered-list-item' ? activeToolbarButtonStyle : toolbarButtonStyle}
          onClick={handleToolbarButtonClick('toggleBlockType', 'ordered-list-item')}
          title="Numbered List"
        >
          <FormatListNumberedIcon fontSize="small" />
        </button>
        <button
          type="button"
          style={currentBlockType === 'blockquote' ? activeToolbarButtonStyle : toolbarButtonStyle}
          onClick={handleToolbarButtonClick('toggleBlockType', 'blockquote')}
          title="Quote"
        >
          <FormatQuoteIcon fontSize="small" />
        </button>
        <button
          type="button"
          style={currentBlockType === 'code-block' ? activeToolbarButtonStyle : toolbarButtonStyle}
          onClick={handleToolbarButtonClick('toggleBlockType', 'code-block')}
          title="Code Block"
        >
          <CodeIcon fontSize="small" />
        </button>
      </div>
      
      )}
      
      {/* Rich text editor (conditionally visible) */}
      {isContentVisible && (
        <div
          className="mail-body-content"
          style={contentStyle}
          onClick={focusEditor}
        >
          <Editor
            ref={editorRef}
            editorState={editorState}
            onChange={handleEditorChange}
            handleKeyCommand={handleKeyCommand}
            placeholder="Enter your email template here..."
            spellCheck={true}
          />
        </div>
      )}
      
      {/* Variables section */}
      {variables.length > 0 && (
        <div className="mail-body-variables" style={{ marginTop: '8px', fontSize: '11px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Template Variables:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {variables.map(variable => (
              <div 
                key={variable} 
                style={{ 
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div style={{ 
                  background: '#F3E5F5', 
                  border: '1px solid #E1BEE7', 
                  borderRadius: '3px', 
                  padding: '2px 6px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '12px' // Space for the handle
                }}>
                  ${variable}
                </div>
                {/* Input handle positioned to the left of each variable */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`var-${variable}`}
                  style={{
                    ...variableHandleStyle,
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Output handle for the complete mail body content */}
      <Handle
        type="source"
        position={Position.Right}
        id="output-content"
        style={handleStyle}
      />
    </div>
  );
};

export default memo(MailBodyNode);
