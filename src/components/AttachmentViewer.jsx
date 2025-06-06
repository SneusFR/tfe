import { useState, useEffect, useContext } from 'react';
import '../styles/AttachmentViewer.css';
import { getApi } from '../utils/flowApiHelper';
import { FlowContext } from '../context/FlowContext';
import { useFlowManager } from '../context/FlowManagerContext';

const AttachmentViewer = () => {
  // Récupérer le flow courant depuis les contextes disponibles
  const { currentFlow: flowContextFlow } = useContext(FlowContext);
  const { currentFlow: managerContextFlow } = useFlowManager();
  
  // Utiliser le flow disponible dans l'un ou l'autre des contextes
  const currentFlow = flowContextFlow || managerContextFlow;
  
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Récupérer toutes les pièces jointes des emails du flow courant
  const fetchAttachments = async () => {
    if (!currentFlow?.id) {
      setAttachments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getApi();
      // Récupérer tous les emails du flow courant
      const response = await api.get(`/api/emails/flow/${currentFlow.id}`);
      const emails = response.data;
      
      // Extraire toutes les pièces jointes de ces emails
      const allAttachments = [];
      emails.forEach(email => {
        if (email.attachments && email.attachments.length > 0) {
          email.attachments.forEach(attachment => {
            allAttachments.push({
              ...attachment,
              emailSubject: email.subject,
              emailDate: email.date,
              emailFrom: email.from?.name || email.from?.address
            });
          });
        }
      });
      
      setAttachments(allAttachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      setError("Failed to load attachments. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Charger les pièces jointes au chargement du composant et lorsque le flow change
  useEffect(() => {
    fetchAttachments();
  }, [currentFlow?.id]);

  // Filtrer les pièces jointes en fonction de la recherche
  const filteredAttachments = attachments.filter(attachment => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (attachment.name && attachment.name.toLowerCase().includes(query)) ||
      (attachment.emailSubject && attachment.emailSubject.toLowerCase().includes(query)) ||
      (attachment.emailFrom && attachment.emailFrom.toLowerCase().includes(query))
    );
  });

  // Fonction pour ouvrir une pièce jointe
  const openAttachment = async (attachment) => {
    setSelectedAttachment(attachment);
    setPreviewError(null);
    
    try {
      const api = getApi();
      const response = await api.get(`/api/attachments/${attachment.id}/download`, {
        responseType: 'blob'
      });
      
      // Créer une URL pour le blob
      const url = URL.createObjectURL(response.data);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      setPreviewError("Impossible de charger la pièce jointe. Essayez de la télécharger directement.");
    }
  };

  // Télécharger directement la pièce jointe
  const downloadAttachment = (attachment) => {
    const api = getApi();
    const downloadUrl = `${api.defaults.baseURL}/api/attachments/${attachment.id}/download`;
    
    // Ouvrir l'URL dans un nouvel onglet pour télécharger
    window.open(downloadUrl, '_blank');
  };

  // Fermer la prévisualisation
  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedAttachment(null);
    setPreviewUrl(null);
    setPreviewError(null);
  };

  // Déterminer le type de prévisualisation en fonction du type MIME
  const getPreviewComponent = () => {
    if (!selectedAttachment) return null;
    
    // Si une erreur s'est produite lors du chargement de la prévisualisation
    if (previewError) {
      return (
        <div className="attachment-preview-content attachment-download">
          <p>{previewError}</p>
          <button 
            onClick={() => downloadAttachment(selectedAttachment)}
            className="download-button"
          >
            Télécharger le fichier
          </button>
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="attachment-preview-content">
          <div className="loading-spinner"></div>
          <p className="loading-message">Chargement de la prévisualisation...</p>
        </div>
      );
    }

    const mime = selectedAttachment.mime?.toLowerCase() || '';

    if (mime.startsWith('image/')) {
      return (
        <div className="attachment-preview-content">
          <img 
            src={previewUrl} 
            alt={selectedAttachment.name} 
            onError={() => setPreviewError("Impossible d'afficher cette image.")}
          />
        </div>
      );
    } else if (mime === 'application/pdf') {
      return (
        <div className="attachment-preview-content">
          <iframe 
            src={previewUrl} 
            title={selectedAttachment.name}
            width="100%" 
            height="100%"
            onError={() => setPreviewError("Impossible d'afficher ce PDF.")}
          />
          <div className="preview-fallback">
            <p>Si le PDF ne s'affiche pas correctement, vous pouvez le télécharger directement :</p>
            <button 
              onClick={() => downloadAttachment(selectedAttachment)}
              className="download-button"
            >
              Télécharger le PDF
            </button>
          </div>
        </div>
      );
    } else {
      // Pour les autres types de fichiers, proposer le téléchargement
      return (
        <div className="attachment-preview-content attachment-download">
          <p>Ce type de fichier ne peut pas être prévisualisé.</p>
          <button 
            onClick={() => downloadAttachment(selectedAttachment)}
            className="download-button"
          >
            Télécharger le fichier
          </button>
        </div>
      );
    }
  };

  // Fonction pour formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Taille inconnue';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Fonction pour obtenir l'icône en fonction du type MIME
  const getFileIcon = (mime) => {
    if (!mime) return '📄';
    
    mime = mime.toLowerCase();
    
    if (mime.startsWith('image/')) return '🖼️';
    if (mime === 'application/pdf') return '📕';
    if (mime.includes('word') || mime === 'application/msword' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '📝';
    if (mime.includes('excel') || mime === 'application/vnd.ms-excel' || mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return '📊';
    if (mime.includes('powerpoint') || mime === 'application/vnd.ms-powerpoint' || mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return '📊';
    if (mime.includes('zip') || mime.includes('compressed')) return '🗜️';
    if (mime.includes('text/')) return '📄';
    
    return '📄';
  };

  // Affichage pendant le chargement
  if (loading && attachments.length === 0) {
    return (
      <div className="attachment-viewer">
        <div className="attachment-viewer-header">
          <h2>Pièces jointes</h2>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-message">Chargement des pièces jointes...</p>
        </div>
      </div>
    );
  }

  // Rendu principal
  return (
    <div className="attachment-viewer">
      <div className="attachment-viewer-header">
        <h2>Pièces jointes</h2>
        <div className="attachment-search">
          <span className="attachment-search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Rechercher des pièces jointes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchAttachments} className="retry-button">
            <span>↻</span> Réessayer
          </button>
        </div>
      )}

      {!loading && !error && filteredAttachments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📎</div>
          <p className="empty-state-text">Aucune pièce jointe trouvée</p>
          <p className="empty-state-subtext">
            {searchQuery 
              ? "Essayez d'ajuster votre recherche" 
              : "Aucun email avec des pièces jointes n'a été analysé dans ce flow"}
          </p>
        </div>
      )}

      {filteredAttachments.length > 0 && (
        <div className="attachments-grid">
          {filteredAttachments.map((attachment) => (
            <div 
              key={attachment.id} 
              className="attachment-card"
            >
              <div 
                className="attachment-preview-action"
                onClick={() => openAttachment(attachment)}
                title="Prévisualiser"
              >
                <div className="attachment-icon">
                  {getFileIcon(attachment.mime)}
                </div>
                <div className="attachment-details">
                  <div className="attachment-name" title={attachment.name}>
                    {attachment.name}
                  </div>
                  <div className="attachment-meta">
                    <span className="attachment-size">{formatFileSize(attachment.size)}</span>
                    <span className="attachment-type">{attachment.mime?.split('/')[1] || 'Unknown'}</span>
                  </div>
                  <div className="attachment-email-info" title={attachment.emailSubject}>
                    <span className="attachment-email-subject">{attachment.emailSubject}</span>
                    <span className="attachment-email-from">{attachment.emailFrom}</span>
                  </div>
                </div>
              </div>
              <div className="attachment-actions">
                <button 
                  className="attachment-download-button"
                  onClick={() => downloadAttachment(attachment)}
                  title="Télécharger directement"
                >
                  ⬇️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAttachment && (
        <div className="attachment-preview-overlay" onClick={closePreview}>
          <div className="attachment-preview-container" onClick={(e) => e.stopPropagation()}>
            <div className="attachment-preview-header">
              <h3>{selectedAttachment.name}</h3>
              <button className="close-preview-button" onClick={closePreview}>×</button>
            </div>
            {getPreviewComponent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentViewer;
