// EmailBrowser.jsx
import { useState, useEffect, useContext, useMemo } from 'react';
import '../../styles/EmailBrowser.css';
import conditionStore from '../../store/conditionStore';
import taskStore from '../../store/taskStore';
import emailStore from '../../store/emailStore';
import { FlowContext } from '../../context/FlowContext';
import { useFlowManager } from '../../context/FlowManagerContext';
import AttachmentViewer from './AttachmentViewer';

// Constantes de configuration de l'API OpenAI
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const EmailBrowser = () => {
  // Récupérer le flow courant depuis les contextes disponibles
  const { currentFlow: flowContextFlow } = useContext(FlowContext);
  const { currentFlow: managerContextFlow } = useFlowManager();
  
  // Utiliser le flow disponible dans l'un ou l'autre des contextes
  const currentFlow = flowContextFlow || managerContextFlow;
  
  // États pour la liste d'e-mails et le chargement
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [expandedEmailId, setExpandedEmailId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'analyzed', 'unanalyzed', 'attachments'
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les emails en fonction de l'onglet actif et de la recherche
  const filteredEmails = useMemo(() => {
    // Utiliser les méthodes du store pour filtrer et rechercher
    const searchResults = emailStore.searchEmails(searchQuery, emails);
    return emailStore.filterEmails(activeTab, searchResults);
  }, [emails, activeTab, searchQuery]);
  
  // Compter les emails par catégorie
  const emailCounts = useMemo(() => {
    const databaseEmails = emailStore.getDatabaseEmails();
    return {
      all: emails.length,
      analyzed: emails.filter(email => databaseEmails.includes(email.id)).length,
      unanalyzed: emails.filter(email => !databaseEmails.includes(email.id)).length
    };
  }, [emails]);

  // Fonction de récupération des e-mails en utilisant le store
  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Définir le flow courant dans le store si nécessaire
      if (currentFlow?.id && emailStore.getCurrentFlowId() !== currentFlow.id) {
        emailStore.setCurrentFlowId(currentFlow.id);
      }
      
      // Récupérer les emails via le store
      const fetchedEmails = await emailStore.fetchEmails({ forceRefresh: true });
      setEmails(fetchedEmails);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching emails:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Lancer la récupération au chargement du composant et quand le flow change
  useEffect(() => {
    if (currentFlow?.id) {
      emailStore.setCurrentFlowId(currentFlow.id);
    }
    fetchEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFlow]);

  // Gestion du bouton "Précédent"
  const handlePrevPage = () => {
    if (emailStore.prevPage()) {
      fetchEmails();
    }
  };

  // Gestion du bouton "Suivant"
  const handleNextPage = () => {
    if (emailStore.nextPage()) {
      fetchEmails();
    }
  };

  // Action sur le bouton "Analyze"
  const handleAnalyzeEmail = async (email) => {
    // Vérifier si l'email est déjà en base de données
    if (emailStore.isEmailInDatabase(email.id)) {
      console.log("⚠️ [EMAIL ANALYSIS] Email already in database, skipping analysis:", email.id);
      return;
    }
    
    // Utiliser le flow courant ou récupérer celui du taskStore si non disponible
    const flowId = currentFlow?.id || taskStore.getCurrentFlowId();
    console.log(`🔄 [FLOW INFO] Using flow ID: ${flowId || 'none'} for email analysis`);
    
    console.log("📧 [EMAIL ANALYSIS] Starting analysis of email:", JSON.stringify({
      id: email.id,
      subject: email.subject,
      sender: email.from_attendee?.display_name || email.from_attendee?.identifier
    }, null, 2));
    // Email analysis initiated
    setAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisResult(null);
    
    // Sauvegarder l'email dans la base de données via le store
    try {
      await emailStore.saveEmailToDatabase(email, flowId);
    } catch (error) {
      console.error("Error saving email to database:", error);
      // On continue l'analyse même si la sauvegarde a échoué
    }
    
    // Récupérer les conditions depuis le store
    const conditions = conditionStore.getAllConditions();
    const prompt = conditionStore.generateOpenAIPrompt();
    
    // Préparer le contenu de l'email pour l'analyse
    const emailContent = {
      id: email.id,
      subject: email.subject,
      sender: email.from_attendee?.display_name || email.from_attendee?.identifier || 
              email.from?.name || "Unknown Sender",
      date: email.date,
      body: email.body_plain || email.snippet || "No content available"
    };
    
    // Simuler une progression pendant l'analyse
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);
    
    try {
      // Appel à l'API OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant qui analyse les emails et donne des réponses selon des conditions spécifiques.'
            },
            {
              role: 'user',
              content: `Je te présente un email à analyser. Voici les conditions à vérifier: ${prompt || "Aucune condition définie, tu peux faire une analyse générale de l'email."}\n\nVoici l'email:\nDe: ${emailContent.sender}\nSujet: ${emailContent.subject}\nDate: ${emailContent.date}\nContenu: ${emailContent.body}`
            }
          ],
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("🤖 [EMAIL ANALYSIS] OpenAI analysis completed with result:", data.choices[0]?.message?.content);
      
      // Récupérer la réponse
      const result = data.choices[0]?.message?.content || "Aucun résultat d'analyse disponible";
      
      setAnalysisResult(result);
      
      // Extraire les conditions reconnues et créer des tâches (maintenant asynchrone)
      await extractConditionsAndCreateTasks(result, email, flowId);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      // Après 3 secondes, cacher la barre de progression
      setTimeout(() => {
        setAnalysisProgress(0);
        setAnalyzing(false);
      }, 3000);
      
    } catch (error) {
      console.error("Error analyzing email with OpenAI:", error);
      setAnalysisResult(`Erreur lors de l'analyse: ${error.message}`);
      clearInterval(progressInterval);
      setAnalysisProgress(0);
      setAnalyzing(false);
    }
  };
  
  // Extraire les conditions de la réponse et créer des tâches
  const extractConditionsAndCreateTasks = async (analysisResult, email, flowId) => {
    console.log("🔍 [CONDITION MATCHING] Checking for matching conditions in analysis result (case-insensitive)");
    
    // Récupérer toutes les conditions existantes
    const conditions = conditionStore.getAllConditions();
    
    // Si aucune condition ne correspond, ne pas créer de tâche "email_processing"
    // Utiliser toLowerCase() pour rendre la comparaison insensible à la casse
    const matchingConditions = conditions.filter(condition => 
      analysisResult.toLowerCase().includes(condition.returnText.toLowerCase())
    );
    
    if (matchingConditions.length === 0) {
      console.log("⚠️ [CONDITION MATCHING] No matching conditions found, no tasks will be created");
      return;
    }
    
    // Utiliser Promise.all pour gérer plusieurs tâches en parallèle
    const taskPromises = matchingConditions.map(async (condition) => {
      console.log(`✅ [CONDITION MATCHED] Found matching condition: "${condition.returnText}" in analysis result (case-insensitive match)`);
      
      // Extraire l'email de l'expéditeur à partir de from_attendee.identifier
      const senderEmail = email.from_attendee?.identifier || 'unknown@example.com';
      const senderName = email.from_attendee?.display_name || senderEmail;
      const recipientEmail = email.to_attendees?.[0]?.identifier || 'unknown@example.com';
      
      // Extraire les informations des pièces jointes si elles existent
      const attachments = email.attachments || [];
      console.log(`📎 [EMAIL ATTACHMENTS] Found ${attachments.length} attachments in email:`, 
        attachments.map(a => ({ id: a.id, name: a.name })));
      
      // --- Récupérer le sujet ---
      const subject =
            email.subject                                       ||
            email.headers?.Subject                              ||
            email.headers?.find(h => h.name?.toLowerCase()==='subject')?.value ||
            email.title                                         || null;

      // --- Récupérer le body/plain ---
      const bodyPlain =
            email.body_plain || email.snippet || email.preview || null;

      // Créer la tâche en utilisant les données de l'email
      const taskData = {
        type: condition.returnText,
        description: `Email de ${senderName}: ${subject || "(Sans objet)"}`,
        source: 'email',
        sourceId: email.id, // ID de l'email pour récupérer les pièces jointes
        unipileEmailId: email.id, // Stocker explicitement l'ID Unipile pour la persistance
        flow: flowId, // Utiliser le flowId passé en paramètre
        senderEmail: senderEmail,
        recipientEmail: recipientEmail,
        attachments: attachments, // Ajouter les pièces jointes à la tâche
        subject,           // ne sera plus undefined
        senderName: senderName, // Ajouter le nom de l'expéditeur
        recipientName: email.to_attendees?.[0]?.display_name || recipientEmail, // Ajouter le nom du destinataire
        body: bodyPlain,   // ne sera plus undefined
        date: email.date || null, // Ajouter la date de l'email (ou null)
        attachmentId: attachments && attachments.length > 0 ? attachments[0].id : null // Ajouter l'ID de la première pièce jointe
      };
      
      console.log(`📧 [EMAIL DATA] Using email ID: ${email.id} for task creation`);
      
      try {
        // Ajouter la tâche (maintenant asynchrone)
        const newTask = await taskStore.addTask(taskData);
        console.log("📋 [TASK CREATION] Created new task:", JSON.stringify(newTask, null, 2));
        
        // Déclencher un événement personnalisé pour notifier la création de tâche
        // Cela permettra à d'autres composants (comme ModernSidebar) de rafraîchir leur liste de tâches
        const taskCreatedEvent = new CustomEvent('taskCreated', { 
          detail: { task: newTask, flowId: taskStore.getCurrentFlowId() } 
        });
        window.dispatchEvent(taskCreatedEvent);
        
        return newTask;
      } catch (error) {
        console.error("❌ [TASK CREATION] Failed to create task:", error);
        return null;
      }
    });
    
    // Attendre que toutes les tâches soient créées
    await Promise.all(taskPromises);
  };
  
  // Toggle l'expansion du corps de l'email
  const toggleEmailExpansion = (emailId) => {
    if (expandedEmailId === emailId) {
      setExpandedEmailId(null);
    } else {
      setExpandedEmailId(emailId);
    }
  };

  // Fonction de recherche
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Affichage pendant le chargement
  if (loading && emails.length === 0) {
    return (
      <div className="email-browser">
        <div className="email-browser-header">
          <h2>Emails</h2>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-message">Loading emails...</p>
        </div>
      </div>
    );
  }

  // Gestion d'une éventuelle erreur
  if (error) {
    return (
      <div className="email-browser">
        <div className="email-browser-header">
          <h2>Emails</h2>
        </div>
        <div className="error-container">
          <p className="error-message">Error: {error}</p>
          <p className="error-details">Using mock data for demonstration.</p>
          <button onClick={fetchEmails} className="retry-button">
            <span>↻</span> Retry
          </button>
        </div>
      </div>
    );
  }

  // Rendu principal avec le nouveau design
  return (
    <div className="email-browser">
      <div className="email-browser-header">
        <h2>Emails</h2>
      </div>
      
      <div className="email-tabs">
        <div 
          className={`email-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Emails
          <span className="email-tab-count">{emailCounts.all}</span>
        </div>
        <div 
          className={`email-tab ${activeTab === 'analyzed' ? 'active' : ''}`}
          onClick={() => setActiveTab('analyzed')}
        >
          Analyzed
          <span className="email-tab-count">{emailCounts.analyzed}</span>
        </div>
        <div 
          className={`email-tab ${activeTab === 'unanalyzed' ? 'active' : ''}`}
          onClick={() => setActiveTab('unanalyzed')}
        >
          Unanalyzed
          <span className="email-tab-count">{emailCounts.unanalyzed}</span>
        </div>
        <div 
          className={`email-tab ${activeTab === 'attachments' ? 'active' : ''}`}
          onClick={() => setActiveTab('attachments')}
        >
          Pièces jointes
          <span className="email-tab-count">📎</span>
        </div>
      </div>
      
      {activeTab !== 'attachments' && (
        <div className="email-filters">
          <div className="email-search">
            <span className="email-search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search emails..." 
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
      )}

      {activeTab === 'attachments' ? (
        <AttachmentViewer />
      ) : (
        <div className="email-list-container">
        {filteredEmails.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-text">No emails found</p>
            <p className="empty-state-subtext">
              {searchQuery 
                ? "Try adjusting your search query" 
                : activeTab === 'analyzed' 
                  ? "No analyzed emails yet" 
                  : activeTab === 'unanalyzed' 
                    ? "All emails have been analyzed" 
                    : "Your inbox is empty"}
            </p>
          </div>
        ) : (
          <>
            <div className="email-list-header">
              <span>{filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="email-list">
              {filteredEmails.map((email) => (
                <div 
                  key={email.id} 
                  className={`email-item ${emailStore.isEmailInDatabase(email.id) ? 'in-database' : ''}`}
                  onClick={() => toggleEmailExpansion(email.id)}
                >
                  <div className="email-content">
                    <div className="email-subject">
                      {email.subject || "(No subject)"}
                    </div>
                  <div className="email-details">
                      <span className="email-sender">
                        <span className="email-sender-icon">
                          {emailStore.getSenderInitials(email.from_attendee?.display_name)}
                        </span>
                        {email.from_attendee?.display_name ||
                          email.from_attendee?.identifier ||
                          "Unknown"}
                      </span>
                      <span className="email-date">
                        {emailStore.formatDate(email.date)}
                      </span>
                    </div>
                    <div className={`email-preview ${expandedEmailId === email.id ? 'expanded' : ''}`}>
                      {email.body_plain || email.snippet || "(No preview available)"}
                      {(email.body_plain || email.snippet) && (
                        <button 
                          className="expand-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEmailExpansion(email.id);
                          }}
                        >
                          {expandedEmailId === email.id ? 'Show Less' : 'Show More'}
                        </button>
                      )}
                    </div>
                  </div>
                  {emailStore.isEmailInDatabase(email.id) ? (
                    <div className="analyzed-badge">
                      <span className="analyze-icon">✓</span> Analyzed
                    </div>
                  ) : (
                    <button
                      className="analyze-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnalyzeEmail(email);
                      }}
                      title="Analyze this email"
                      disabled={analyzing}
                    >
                      <span className="analyze-icon">🤖</span> Analyze
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      )}
          
      {analyzing && (
        <div className="analysis-overlay">
          <div className="analysis-container">
            <h3>Analysing Email...</h3>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
            {analysisProgress === 100 && analysisResult && (
              <div className="analysis-result">
                <h4>Analyse terminée:</h4>
                <div className="result-content">{analysisResult}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pagination">
        <button
          className="pagination-button"
          onClick={handlePrevPage}
          disabled={emailStore.getCurrentPage() === 1}
        >
          <span>←</span> Previous
        </button>
        <span className="page-info">
          Page {emailStore.getCurrentPage()} {emailStore.hasNextPage() ? "" : " (End)"}
        </span>
        <button
          className="pagination-button"
          onClick={handleNextPage}
          disabled={!emailStore.hasNextPage()}
        >
          Next <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default EmailBrowser;
