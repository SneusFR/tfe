import { 
  Settings as SettingsIcon,
  Assignment as TaskIcon,
  Inventory as InventoryIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AccountTree as ConditionalFlowIcon,
  Start as StartIcon,
  Input as InputIcon,
  Email as EmailIcon,
  Psychology as AIIcon,
  MoreHoriz as MiscIcon,
  Api as ApiIcon
} from '@mui/icons-material';
import { Badge, Tooltip } from '@mui/material';
import { SIDEBAR_TABS } from './constants';

const SidebarTabs = ({ 
  activeTab, 
  onTabChange, 
  totalPendingTasks, 
  conditionsCount, 
  isCollapsed, 
  isHidden,
  onToggleCollapsed,
  onToggleHidden 
}) => {
  return (
    <div className="sidebar-tabs">
      <Tooltip title="Conditions" placement="right">
        <div
          className={`tab-icon ${activeTab === SIDEBAR_TABS.CONDITIONS ? 'active' : ''}`}
          onClick={() => {
            onTabChange(SIDEBAR_TABS.CONDITIONS);
            if (isCollapsed) onToggleCollapsed();
          }}
        >
          <SettingsIcon />
        </div>
      </Tooltip>
      
      <Tooltip title="Tasks" placement="right">
        <div
          className={`tab-icon ${activeTab === SIDEBAR_TABS.TASKS ? 'active' : ''}`}
          onClick={() => {
            onTabChange(SIDEBAR_TABS.TASKS);
            if (isCollapsed) onToggleCollapsed();
          }}
        >
          <Badge badgeContent={totalPendingTasks} color="error" max={99}>
            <TaskIcon />
          </Badge>
        </div>
      </Tooltip>
      
      <Tooltip title="Inventory" placement="right">
        <div
          className={`tab-icon ${activeTab === SIDEBAR_TABS.INVENTORY ? 'active' : ''}`}
          onClick={() => {
            onTabChange(SIDEBAR_TABS.INVENTORY);
            if (isCollapsed) onToggleCollapsed();
          }}
        >
          <InventoryIcon />
        </div>
      </Tooltip>
      
      <div className="sidebar-divider"></div>
      
      <Tooltip title="Starting Points" placement="right">
        <div
          className={`tab-icon ${activeTab === SIDEBAR_TABS.STARTING_POINTS ? 'active' : ''}`}
          onClick={() => {
            onTabChange(SIDEBAR_TABS.STARTING_POINTS);
            if (isCollapsed) onToggleCollapsed();
          }}
        >
          <Badge badgeContent={conditionsCount} color="primary" max={99}>
            <StartIcon />
          </Badge>
        </div>
      </Tooltip>
      
      <Tooltip title="Conditional Flow" placement="right">
        <div
          className={`tab-icon ${activeTab === SIDEBAR_TABS.CONDITIONAL_FLOW ? 'active' : ''}`}
          onClick={() => {
            onTabChange(SIDEBAR_TABS.CONDITIONAL_FLOW);
            if (isCollapsed) onToggleCollapsed();
          }}
        >
          <ConditionalFlowIcon />
        </div>
      </Tooltip>
      
      <Tooltip title="Input Nodes" placement="right">
        <div
          className={`tab-icon ${activeTab === SIDEBAR_TABS.INPUT_NODES ? 'active' : ''}`}
          onClick={() => {
            onTabChange(SIDEBAR_TABS.INPUT_NODES);
            if (isCollapsed) onToggleCollapsed();
          }}
        >
          <InputIcon />
        </div>
      </Tooltip>
      
      <Tooltip title="Email Nodes" placement="right">
        <div
          className={`tab-icon ${activeTab === SIDEBAR_TABS.EMAIL_NODES ? 'active' : ''}`}
          onClick={() => {
            onTabChange(SIDEBAR_TABS.EMAIL_NODES);
            if (isCollapsed) onToggleCollapsed();
          }}
        >
          <EmailIcon />
        </div>
      </Tooltip>
      
      <Tooltip title="AI Nodes" placement="right">
        <div
          className={`tab-icon ${activeTab === SIDEBAR_TABS.AI_NODES ? 'active' : ''}`}
          onClick={() => {
            onTabChange(SIDEBAR_TABS.AI_NODES);
            if (isCollapsed) onToggleCollapsed();
          }}
        >
          <AIIcon />
        </div>
      </Tooltip>
      
      <Tooltip title="API Nodes" placement="right">
        <div
          className={`tab-icon ${activeTab === SIDEBAR_TABS.API_NODES ? 'active' : ''}`}
          onClick={() => {
            onTabChange(SIDEBAR_TABS.API_NODES);
            if (isCollapsed) onToggleCollapsed();
          }}
        >
          <ApiIcon />
        </div>
      </Tooltip>
      
      <Tooltip title="Misc Nodes" placement="right">
        <div
          className={`tab-icon ${activeTab === SIDEBAR_TABS.MISC_NODES ? 'active' : ''}`}
          onClick={() => {
            onTabChange(SIDEBAR_TABS.MISC_NODES);
            if (isCollapsed) onToggleCollapsed();
          }}
        >
          <MiscIcon />
        </div>
      </Tooltip>
      
      <Tooltip title={isCollapsed ? "Expand sidebar" : "Hide sidebar"} placement="right">
        <div
          className="tab-icon toggle-icon"
          onClick={onToggleHidden}
        >
          {isHidden ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </div>
      </Tooltip>
    </div>
  );
};

export default SidebarTabs;
