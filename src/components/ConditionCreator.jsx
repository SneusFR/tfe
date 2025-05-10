import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useFlowAccess } from '../hooks/useFlowAccess';
import '../styles/ConditionCreator.css';

const ConditionCreator = ({ onCreateCondition }) => {
  const { hasAccess } = useFlowAccess('editor');
  const [conditionText, setConditionText] = useState('');
  const [returnText, setReturnText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!conditionText.trim() || !returnText.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      onCreateCondition({
        type: 'conditionNode',
        data: {
          conditionText,
          returnText
        }
      });

      // Reset form and close
      setConditionText('');
      setReturnText('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating condition:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="condition-creator">
      {hasAccess && (
        <motion.button
          className="open-condition-creator" 
          onClick={() => setIsOpen(true)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <AddIcon fontSize="small" />
          Create Condition
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="condition-creator-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="condition-creator-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="condition-creator-header">
                <Typography variant="h6" className="condition-creator-title">
                  Create Mail Condition
                </Typography>
              </div>
              
              <form onSubmit={handleSubmit} className="condition-creator-form">
                <div className="form-group">
                  <label className="form-label">
                    Type of mail:
                  </label>
                  <textarea
                    className="form-textarea"
                    value={conditionText}
                    onChange={(e) => setConditionText(e.target.value)}
                    placeholder="Describe the type of mail this condition should match..."
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    Return:
                  </label>
                  <textarea
                    className="form-textarea"
                    value={returnText}
                    onChange={(e) => setReturnText(e.target.value)}
                    placeholder="Enter the text to return when this condition matches..."
                  />
                </div>
                
                <div className="form-actions">
                  <motion.button
                    type="button"
                    className="cancel-button"
                    onClick={() => setIsOpen(false)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="create-button"
                    disabled={isSubmitting || !conditionText.trim() || !returnText.trim()}
                    whileHover={!isSubmitting ? { y: -2 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Node'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConditionCreator;
