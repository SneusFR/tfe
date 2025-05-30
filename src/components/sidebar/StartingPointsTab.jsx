import { 
  Start as StartIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { 
  Badge,
  TextField
} from '@mui/material';
import ConditionItem from './ConditionItem';
import { filterConditions } from './utils';

const StartingPointsTab = ({ 
  conditions, 
  conditionsLoading, 
  conditionsError, 
  startingPointsSearchTerm, 
  onStartingPointsSearchChange, 
  canEdit 
}) => {
  const filteredConditions = filterConditions(conditions, startingPointsSearchTerm);

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Starting Point Nodes</h3>
        <Badge badgeContent={conditions.length} color="primary" max={99}>
          <StartIcon />
        </Badge>
      </div>
      
      {/* Search starting points */}
      <div className="task-filters">
        <TextField
          size="small"
          placeholder="Search starting points..."
          value={startingPointsSearchTerm}
          onChange={(e) => onStartingPointsSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          fullWidth
        />
      </div>

      {/* Starting Points list */}
      <div className="task-groups">
        {conditionsLoading && (
          <div className="loading-state">
            Loading starting points...
          </div>
        )}

        {conditionsError && (
          <div className="error-state">
            {conditionsError}
          </div>
        )}

        {!conditionsLoading && conditions.length === 0 && (
          <div className="empty-group">
            No conditions created yet. Create conditions to use them as starting points.
          </div>
        )}

        {!conditionsLoading && conditions.length > 0 && (
          <div className="task-group">
            <div className="group-header">
              <div className="group-title">
                <StartIcon />
                <span>STARTING POINTS ({filteredConditions.length})</span>
              </div>
            </div>
            
            <div className="task-list">
              {filteredConditions.map(condition => (
                <ConditionItem
                  key={condition.id}
                  condition={{
                    ...condition,
                    conditionText: condition.conditionText.length > 70 
                      ? `${condition.conditionText.substring(0, 70)}...` 
                      : condition.conditionText,
                    returnText: condition.returnText
                  }}
                  canEdit={canEdit}
                  isDraggable={true}
                  chipLabel="STARTING POINT"
                  chipColor="#4CAF50"
                  borderColor="#4CAF50"
                />
              ))}
            </div>
          </div>
        )}

        {!conditionsLoading && conditions.length > 0 && 
         filteredConditions.length === 0 && startingPointsSearchTerm && (
          <div className="empty-group">
            No starting points match your search
          </div>
        )}
      </div>
    </div>
  );
};

export default StartingPointsTab;
