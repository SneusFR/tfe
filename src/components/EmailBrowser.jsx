// EmailBrowser.jsx
import { useState, useEffect } from 'react';
import '../styles/EmailBrowser.css';
import { mockEmails } from '../data/mockEmails';
import conditionStore from '../store/conditionStore';
import taskStore from '../store/taskStore';

// Constantes de configuration de l'API OpenAI
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Constantes de configuration de l'API Unipile
const UNIPILE_EMAIL_HEADERS = {
  'X-API-KEY': import.meta.env.VITE_UNIPILE_EMAIL_API_KEY,
  accept: 'application/json',
};

const accountId = import.meta.env.VITE_UNIPILE_EMAIL_ACCOUNT_ID;
const baseUrl = import.meta.env.VITE_UNIPILE_BASE_URL?.endsWith('/')
  ? import.meta.env.VITE_UNIPILE_BASE_URL.slice(0, -1)
  : import.meta.env.VITE_UNIPILE_BASE_URL;

const emailsPerPage = 15;

const EmailBrowser = () => {
  // États pour la liste d'e-mails et le chargement
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [expandedEmailId, setExpandedEmailId] = useState(null);

  // Pour la pagination par curseur
  // pageCursors[0] correspond à la première page (curseur null)
  const [pageCursors, setPageCursors] = useState([null]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Formatage de la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Fonction de récupération des e-mails en utilisant fetch et la pagination par curseur
  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupère le curseur correspondant à la page actuelle (le premier est null)
      const currentCursor = pageCursors[currentPage - 1];
      // Fetching emails for the current page

      // Construction de l'URL avec les paramètres
      let queryParams = new URLSearchParams({
        account_id: accountId,
        limit: emailsPerPage,
      });
      if (currentCursor) {
        queryParams.append("cursor", currentCursor);
      }
      const url = `${baseUrl}/emails?${queryParams.toString()}`;
      // Request URL constructed

      // Appel fetch
      const response = await fetch(url, {
        headers: UNIPILE_EMAIL_HEADERS,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // API response received

      // Filtrer les e-mails de type inbox et limiter au nombre par page
      const items = data.items;
      const inboxEmails = items.filter((e) => e.role === 'inbox').slice(0, emailsPerPage);
      setEmails(inboxEmails);

      // Récupération du curseur pour la page suivante
      const newCursor = data.cursor;
      setHasNextPage(!!newCursor);

      // Ajout du nouveau curseur à la liste s'il est présent et s'il n'existe pas déjà
      if (currentPage === pageCursors.length && newCursor) {
        setPageCursors([...pageCursors, newCursor]);
      }

      setLoading(false);
    } catch (apiError) {
      console.warn("API fetch failed, falling back to mock data:", apiError);
      // Utiliser les données mock en cas d'erreur
      const startIndex = (currentPage - 1) * emailsPerPage;
      const endIndex = startIndex + emailsPerPage;
      const paginatedEmails = mockEmails.slice(startIndex, endIndex);
      setEmails(paginatedEmails);
      setHasNextPage(false);
      setLoading(false);
    }
  };

  // Lancer la récupération à chaque changement de page
  useEffect(() => {
    fetchEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Gestion du bouton "Précédent"
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Gestion du bouton "Suivant"
  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Action sur le bouton "Analyze"
  const handleAnalyzeEmail = async (email) => {
    console.log("📧 [EMAIL ANALYSIS] Starting analysis of email:", JSON.stringify({
      id: email.id,
      subject: email.subject,
      sender: email.from_attendee?.display_name || email.from_attendee?.identifier
    }, null, 2));
    // Email analysis initiated
    setAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisResult(null);
    
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
      await extractConditionsAndCreateTasks(result, email);
      
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
  const extractConditionsAndCreateTasks = async (analysisResult, email) => {
    console.log("🔍 [CONDITION MATCHING] Checking for matching conditions in analysis result");
    
    // Récupérer toutes les conditions existantes
    const conditions = conditionStore.getAllConditions();
    
    // Utiliser Promise.all pour gérer plusieurs tâches en parallèle
    const taskPromises = conditions
      .filter(condition => analysisResult.includes(condition.returnText))
      .map(async (condition) => {
        console.log(`✅ [CONDITION MATCHED] Found matching condition: "${condition.returnText}"`);
        
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

  // Affichage pendant le chargement
  if (loading && emails.length === 0) {
    return (
      <div className="email-browser">
        <div className="email-browser-header">
          <h2>Emails</h2>
        </div>
        <div className="loading-container">
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
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Rendu principal en gardant votre design existant
  return (
    <div className="email-browser">
      <div className="email-browser-header">
        <h2>Emails</h2>
      </div>

      {emails.length === 0 ? (
        <div className="no-emails-message">
          <p>No emails found</p>
        </div>
      ) : (
        <>
          <div className="email-list">
            {emails.map((email) => (
              <div key={email.id} className="email-item">
                <div className="email-content">
                  <div className="email-subject">
                    {email.subject || "(No subject)"}
                  </div>
                  <div className="email-details">
                    <span className="email-sender">
                      {email.from_attendee?.display_name ||
                        email.from_attendee?.identifier ||
                        "Unknown"}
                    </span>
                    <span className="email-date">
                      {formatDate(email.date)}
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
                <button
                  className="analyze-button"
                  onClick={() => handleAnalyzeEmail(email)}
                  title="Analyze this email"
                  disabled={analyzing}
                >
                  <span className="analyze-icon">🤖</span> Analyze
                </button>
              </div>
            ))}
          </div>
          
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
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} {hasNextPage ? "" : " (Fin)"}
            </span>
            <button
              className="pagination-button"
              onClick={handleNextPage}
              disabled={!hasNextPage}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EmailBrowser;
