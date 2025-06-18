import { 
  Settings as SettingsIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { 
  Badge,
  TextField
} from '@mui/material';
import ConditionCreator from '../condition/ConditionCreator';
import ConditionItem from './ConditionItem';
import { filterConditions } from './utils';

const ConditionsTab = ({ 
  conditions, 
  conditionsLoading, 
  conditionsError, 
  conditionsSearchTerm, 
  onConditionsSearchChange, 
  onCreateCondition, 
  onConditionDelete, 
  canEdit 
}) => {
  const filteredConditions = filterConditions(conditions, conditionsSearchTerm);

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Mail Conditions</h3>
        <Badge badgeContent={conditions.length} color="primary" max={99}>
          <SettingsIcon />
        </Badge>
      </div>
      
      {/* Create condition */}
      <div className="task-filters">
        <ConditionCreator onCreateCondition={onCreateCondition} />
      </div>
      
      {/* Search conditions */}
      <div className="task-filters">
        <TextField
          size="small"
          placeholder="Search conditions..."
          value={conditionsSearchTerm}
          onChange={(e) => onConditionsSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          fullWidth
        />
      </div>

      {/* Conditions list */}
      <div className="task-groups">
        {conditionsLoading && (
          <div className="loading-state">
            Loading conditions...
          </div>
        )}

        {conditionsError && (
          <div className="error-state">
            {conditionsError}
          </div>
        )}

        {!conditionsLoading && filteredConditions.length === 0 && conditionsSearchTerm && (
          <div className="empty-group">
            No conditions match your search
          </div>
        )}

        {!conditionsLoading && conditions.length === 0 && !conditionsSearchTerm && (
          <div className="empty-group">
            No conditions created yet. Use the form above to create your first condition.
          </div>
        )}

        {!conditionsLoading && filteredConditions.length > 0 && (
          <div className="task-group">
            <div className="group-header">
              <div className="group-title">
                <SettingsIcon />
                <span>CONDITIONS ({filteredConditions.length})</span>
              </div>
            </div>
            
            <div className="task-list">
              {filteredConditions.map(condition => (
                <ConditionItem
                  key={condition.id}
                  condition={condition}
                  onDelete={onConditionDelete}
                  canEdit={canEdit}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionsTab;
