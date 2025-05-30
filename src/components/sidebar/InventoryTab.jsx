import ApiImporter from '../ApiImporter';

const InventoryTab = ({ 
  apiSpec, 
  apiInventoryNodes, 
  onApiImport 
}) => {
  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>API Inventory</h3>
      </div>
      
      <ApiImporter onApiImport={onApiImport} />
      
      {apiSpec && (
        <div className="api-info">
          <h4>{apiSpec.info?.title || 'Untitled API'}</h4>
          <p>{apiSpec.info?.description || ''}</p>
          <div className="api-stats">
            <span>Version: {apiSpec.info?.version || 'Unknown'}</span>
            <span>Endpoints: {apiInventoryNodes.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTab;
