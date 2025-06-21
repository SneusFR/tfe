// emailStore.js
import { getApi, getFlowApi } from '../utils/flowApiHelper';
import { mockEmails } from '../data/mockEmails';

// Instance API générique
const api = getApi();

/* ------------------------------------------------------------------ */
/*  État local (cache + flow courant)                                 */
/* ------------------------------------------------------------------ */
let currentFlowId = null;

let emailsCache = {
  data:        [],   // liste des emails déjà récupérés
  lastFetched: null, // timestamp du dernier fetch
  loading:     false, // évite les appels concurrents
  promise:     null,  // stocke la promesse de la requête en cours
  pageCursors: [null], // curseurs de pagination [0] correspond à la première page
  currentPage: 1,     // page courante
  hasNextPage: true   // indique s'il y a une page suivante
};

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

/* ------------------------------------------------------------------ */
/*  Utilitaires                                                       */
/* ------------------------------------------------------------------ */
// Supprime les clés dont la valeur est undefined
const stripUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const getFlowApiFor = (maybeFlow) => {
  if (maybeFlow && maybeFlow.id)         return getFlowApi(maybeFlow.id);
  if (currentFlowId)                    return getFlowApi(currentFlowId);
  return api;
};

// Formatage de la date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  
  // Format relative time if less than 24 hours ago
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 24) {
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} min${diffMinutes !== 1 ? 's' : ''} ago`;
    } else {
      const hours = Math.floor(diffHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
  } else if (diffHours < 48) {
    return 'Yesterday';
  } else {
    // Format as date
    return date.toLocaleDateString(undefined, { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

// Get sender initials for avatar
const getSenderInitials = (sender) => {
  if (!sender) return '?';
  
  const parts = sender.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  } else {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
};

/* ------------------------------------------------------------------ */
/*  Store                                                             */
/* ------------------------------------------------------------------ */
const emailStore = {
  /* ---------------- Gestion du flow courant ----------------------- */
  setCurrentFlowId(flowId) {
    currentFlowId = flowId;
    this.clearCache();
  },
  
  getCurrentFlowId() {
    return currentFlowId;
  },

  /* -------------------- Pagination -------------------------------- */
  getCurrentPage() {
    return emailsCache.currentPage;
  },
  
  getPageCursors() {
    return [...emailsCache.pageCursors];
  },
  
  hasNextPage() {
    return emailsCache.hasNextPage;
  },
  
  setCurrentPage(page) {
    if (page >= 1 && page <= emailsCache.pageCursors.length) {
      emailsCache.currentPage = page;
    }
  },
  
  nextPage() {
    if (emailsCache.hasNextPage && emailsCache.currentPage < emailsCache.pageCursors.length) {
      emailsCache.currentPage += 1;
      return true;
    }
    return false;
  },
  
  prevPage() {
    if (emailsCache.currentPage > 1) {
      emailsCache.currentPage -= 1;
      return true;
    }
    return false;
  },

  /* -------------------- Récupération des emails ------------------- */
  async fetchEmails(opts = {}) {
    const now = Date.now();
    
    // Cache frais ? on renvoie la copie
    if (
      emailsCache.data.length &&
      emailsCache.lastFetched &&
      now - emailsCache.lastFetched < 30_000 &&
      !opts.forceRefresh
    ) {
      return [...emailsCache.data];
    }
    
    // Si une requête est déjà en cours, on attend la promesse
    if (emailsCache.loading && emailsCache.promise) {
      return emailsCache.promise;
    }
    
    try {
      emailsCache.loading = true;
      
      // Récupère le curseur correspondant à la page actuelle
      const currentCursor = emailsCache.pageCursors[emailsCache.currentPage - 1];
      
      // Construction de l'URL avec les paramètres
      let queryParams = new URLSearchParams({
        account_id: accountId,
        limit: emailsPerPage,
      });
      
      if (currentCursor) {
        queryParams.append("cursor", currentCursor);
      }
      
      const url = `${baseUrl}/emails?${queryParams.toString()}`;
      
      // Stocke la promesse pour pouvoir la renvoyer si fetchEmails est appelé à nouveau
      // pendant que la requête est en cours
      emailsCache.promise = fetch(url, {
        headers: UNIPILE_EMAIL_HEADERS,
      })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Filtrer les e-mails de type inbox et limiter au nombre par page
        const items = data.items;
        const inboxEmails = items.filter((e) => e.role === 'inbox').slice(0, emailsPerPage);
        
        emailsCache.data = inboxEmails;
        emailsCache.lastFetched = now;
        
        // Récupération du curseur pour la page suivante
        const newCursor = data.cursor;
        emailsCache.hasNextPage = !!newCursor;
        
        // Ajout du nouveau curseur à la liste s'il est présent et s'il n'existe pas déjà
        if (emailsCache.currentPage === emailsCache.pageCursors.length && newCursor) {
          emailsCache.pageCursors = [...emailsCache.pageCursors, newCursor];
        }
        
        // Vérifier quels emails sont déjà dans la base de données
        await this.checkEmailsInDatabase(inboxEmails);
        
        return [...emailsCache.data];
      })
      .catch((error) => {
        console.warn("API fetch failed, falling back to mock data:", error);
        
        // Utiliser les données mock en cas d'erreur
        const startIndex = (emailsCache.currentPage - 1) * emailsPerPage;
        const endIndex = startIndex + emailsPerPage;
        const paginatedEmails = mockEmails.slice(startIndex, endIndex);
        
        emailsCache.data = paginatedEmails;
        emailsCache.hasNextPage = endIndex < mockEmails.length;
        
        // Même avec les données mock, on essaie de vérifier si certains emails sont en base
        this.checkEmailsInDatabase(paginatedEmails);
        
        return [...emailsCache.data];
      })
      .finally(() => {
        emailsCache.loading = false;
        emailsCache.promise = null;
      });
      
      return emailsCache.promise;
    } catch (error) {
      emailsCache.loading = false;
      emailsCache.promise = null;
      throw error;
    }
  },
  
  /* -------------------- Vérification en base de données ----------- */
  async checkEmailsInDatabase(emailsList) {
    try {
      // Utiliser l'API générique au lieu de l'API spécifique au flow
      const api = getApi();
      const flowId = currentFlowId;
      
      // Récupérer tous les emails de la base de données pour ce flow
      const response = flowId 
        ? await api.get(`/api/emails/flow/${flowId}`)
        : await api.get('/api/emails');
        
      const dbEmails = response.data;
      
      // Extraire les IDs des emails de la base de données
      const dbEmailIds = dbEmails.map(email => email.unipileEmailId || email.emailId);
      
      console.log("📋 [DATABASE CHECK] Found emails in database:", dbEmailIds);
      
      // Mettre à jour l'état avec les IDs des emails de la base de données
      emailsCache.databaseEmails = dbEmailIds;
      
      return dbEmailIds;
    } catch (error) {
      console.error("❌ [DATABASE CHECK] Failed to check emails in database:", error);
      // En cas d'erreur, on continue avec une liste vide
      emailsCache.databaseEmails = emailsCache.databaseEmails || [];
      return emailsCache.databaseEmails;
    }
  },
  
  /* -------------------- Récupération des emails en base ----------- */
  getDatabaseEmails() {
    return emailsCache.databaseEmails || [];
  },
  
  isEmailInDatabase(emailId) {
    return (emailsCache.databaseEmails || []).includes(emailId);
  },
  
  /* -------------------- Sauvegarde d'un email -------------------- */
  async saveEmailToDatabase(email, flowId) {
    try {
      console.log("💾 [EMAIL SAVE] Saving email to database:", email.id);
      // Utiliser l'API générique au lieu de l'API spécifique au flow
      const api = getApi();
      
      // Extraire les informations nécessaires de l'email
      const senderEmail = email.from_attendee?.identifier || 'unknown@example.com';
      const senderName = email.from_attendee?.display_name || senderEmail;
      const recipientEmail = email.to_attendees?.[0]?.identifier || 'unknown@example.com';
      const recipientName = email.to_attendees?.[0]?.display_name || recipientEmail;
      
      // Extraire le sujet
      const subject = email.subject || 
                     email.headers?.Subject || 
                     email.headers?.find(h => h.name?.toLowerCase()==='subject')?.value || 
                     email.title || 
                     "(Sans objet)";
      
      // Extraire le corps
      const body = email.body_plain || email.snippet || email.preview || "";
      
      // Extraire les pièces jointes
      const attachments = (email.attachments || []).map(attachment => ({
        name: attachment.name || 'attachment',
        mime: attachment.mime || 'application/octet-stream',
        size: attachment.size || 0,
        storageKey: attachment.id || attachment.storageKey || null,
        skipTaskCreation: true // Ajouter ce paramètre pour éviter la création automatique de tâche pour les pièces jointes
      }));
      
      // Préparer les données pour l'API
      const emailData = {
        emailId: email.id, // ID Unipile
        unipileEmailId: email.id, // Doublon pour assurer la compatibilité
        flow: flowId || currentFlowId, // Utiliser le flowId passé en paramètre ou le flow courant
        subject,
        from: {
          name: senderName,
          address: senderEmail
        },
        to: [{
          name: recipientName,
          address: recipientEmail
        }],
        date: email.date || new Date().toISOString(),
        body,
        attachments,
        skipTaskCreation: true // Ajouter ce paramètre pour éviter la création automatique de tâche email_processing
      };
      
      // Appel à l'API pour sauvegarder l'email
      const response = await api.post('/api/emails', emailData);
      console.log("✅ [EMAIL SAVE] Email saved successfully:", response.data);
      
      // Ajouter l'ID de l'email à la liste des emails en base de données
      emailsCache.databaseEmails = [...(emailsCache.databaseEmails || []), email.id];
      
      return response.data;
    } catch (error) {
      console.error("❌ [EMAIL SAVE] Failed to save email:", error);
      // Si l'erreur est due au fait que l'email existe déjà, on ne considère pas ça comme une erreur
      if (error.response && error.response.status === 400 && error.response.data.message.includes('existe déjà')) {
        console.log("ℹ️ [EMAIL SAVE] Email already exists in database");
        
        // S'assurer que l'email est marqué comme étant en base de données
        if (!(emailsCache.databaseEmails || []).includes(email.id)) {
          emailsCache.databaseEmails = [...(emailsCache.databaseEmails || []), email.id];
        }
        
        return { id: email.id, alreadyExists: true };
      }
      throw error;
    }
  },
  
  /* -------------------- Récupération d'un email par ID ------------ */
  async getEmailById(id) {
    // Vérifier d'abord dans le cache
    const cachedEmail = emailsCache.data.find(email => email.id === id);
    if (cachedEmail) return cachedEmail;
    
    // Sinon, essayer de récupérer depuis l'API
    try {
      // Utiliser l'API générique au lieu de l'API spécifique au flow
      const api = getApi();
      const response = await api.get(`/api/emails/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching email ${id}:`, error);
      throw error;
    }
  },
  
  /* -------------------- Recherche d'emails ----------------------- */
  searchEmails(query, emails = null) {
    if (!query || !query.trim()) {
      return emails || emailsCache.data;
    }
    
    const searchQuery = query.toLowerCase();
    const emailsToSearch = emails || emailsCache.data;
    
    return emailsToSearch.filter(email => 
      (email.subject && email.subject.toLowerCase().includes(searchQuery)) ||
      (email.from_attendee?.display_name && email.from_attendee.display_name.toLowerCase().includes(searchQuery)) ||
      (email.from_attendee?.identifier && email.from_attendee.identifier.toLowerCase().includes(searchQuery)) ||
      (email.body_plain && email.body_plain.toLowerCase().includes(searchQuery))
    );
  },
  
  /* -------------------- Filtrage d'emails ------------------------ */
  filterEmails(filter, emails = null) {
    const emailsToFilter = emails || emailsCache.data;
    const databaseEmails = emailsCache.databaseEmails || [];
    
    switch (filter) {
      case 'analyzed':
        return emailsToFilter.filter(email => databaseEmails.includes(email.id));
      case 'unanalyzed':
        return emailsToFilter.filter(email => !databaseEmails.includes(email.id));
      case 'all':
      default:
        return emailsToFilter;
    }
  },
  
  /* -------------------- Utilitaires ------------------------------ */
  formatDate,
  getSenderInitials,
  
  /* -------------------- Gestion du cache ------------------------- */
  clearCache() {
    emailsCache = {
      data: [],
      lastFetched: null,
      loading: false,
      promise: null,
      pageCursors: [null],
      currentPage: 1,
      hasNextPage: true,
      databaseEmails: emailsCache.databaseEmails || []
    };
  },
  
  getCachedEmails() {
    return [...emailsCache.data];
  },
  
  isLoading() {
    return emailsCache.loading;
  }
};

export default emailStore;
