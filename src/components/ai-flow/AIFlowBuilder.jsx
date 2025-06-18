import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Typography, 
  CircularProgress,
  Alert,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Psychology as AIIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as TipIcon,
  AutoAwesome as MagicIcon
} from '@mui/icons-material';
import { generateFlow } from '../../services/aiFlowService';
import * as aiDiagramInteraction from '../../services/aiDiagramInteractionService';
import '../../styles/AIFlowBuilder.css';

/**
 * AIFlowBuilder component - Allows users to generate flows using AI
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when the dialog is closed
 * @param {Function} props.onFlowGenerated - Function to call when a flow is generated
 * @param {Array} props.nodes - Current nodes in the flow
 * @param {Array} props.edges - Current edges in the flow
 */
const AIFlowBuilder = ({ open, onClose, onFlowGenerated, nodes = [], edges = [] }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useFlowContext, setUseFlowContext] = useState(false);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Veuillez entrer une description du flux');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let flowData;
      
      if (useFlowContext && nodes.length > 0) {
        // If we're using flow context and there are nodes in the current flow,
        // provide the context to the AI
        const flowContext = aiDiagramInteraction.getFlowContext(nodes, edges);
        flowData = await generateFlow(prompt, flowContext);
      } else {
        // Otherwise, generate a flow without context
        flowData = await generateFlow(prompt);
      }
      
      onFlowGenerated(flowData);
      onClose();
    } catch (err) {
      console.error('Error generating flow:', err);
      setError(err.message || 'Une erreur est survenue lors de la génération du flux');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? null : onClose}
      maxWidth="md"
      fullWidth
      className="ai-flow-builder-dialog"
      PaperProps={{
        sx: {
          mx: 'auto',  // Center horizontally
          width: '100%',
          maxWidth: '800px',
          position: 'relative',
          left: '0',
          transform: 'none'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }} className="ai-flow-builder-title">
        <AIIcon color="primary" />
        Générer un flux avec l'IA
      </DialogTitle>
      
      <DialogContent className="ai-flow-builder-content">
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom className="ai-flow-builder-description">
            Décrivez le flux que vous souhaitez créer en langage naturel. Notre IA avancée (GPT-4) va analyser votre description
            et générer automatiquement un flux complet avec tous les nœuds et connexions nécessaires.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <MagicIcon color="primary" fontSize="small" />
            <Typography variant="body2" fontWeight="medium" color="primary">
              Propulsé par GPT-4
            </Typography>
          </Box>
          
          {nodes.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useFlowContext}
                    onChange={(e) => setUseFlowContext(e.target.checked)}
                    color="primary"
                  />
                }
                label="Utiliser le contexte du flux actuel"
              />
              <Typography variant="body2" color="text.secondary">
                {useFlowContext 
                  ? "L'IA prendra en compte les nœuds existants (peut mélanger avec les flux précédents)" 
                  : "L'IA créera un flux entièrement nouveau (recommandé)"}
              </Typography>
            </Box>
          )}
        </Box>

        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="examples-content"
            id="examples-header"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TipIcon color="primary" fontSize="small" />
              <Typography>Exemples et conseils pour de meilleurs résultats</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle2" gutterBottom>
              Exemples de prompts efficaces:
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Chip 
                label="Factures impayées" 
                color="primary" 
                variant="outlined" 
                size="small" 
                onClick={() => setPrompt("J'aimerais que pour les mails de factures impayées, on envoie un mail de rappel au client avec un lien de paiement. Si après 7 jours il n'a toujours pas payé, on envoie un second rappel plus ferme.")}
                sx={{ m: 0.5 }}
              />
              <Chip 
                label="Confirmation de rendez-vous" 
                color="primary" 
                variant="outlined" 
                size="small" 
                onClick={() => setPrompt("Quand je reçois un mail de demande de rendez-vous, je veux vérifier si le client a déjà un compte. S'il en a un, confirmer le rendez-vous, sinon lui demander de créer un compte d'abord.")}
                sx={{ m: 0.5 }}
              />
              <Chip 
                label="Traitement de commande" 
                color="primary" 
                variant="outlined" 
                size="small" 
                onClick={() => setPrompt("Pour les emails de commande, extraire les détails du produit, vérifier le stock via l'API, puis envoyer soit une confirmation de commande soit une notification de rupture de stock.")}
                sx={{ m: 0.5 }}
              />
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>
              Conseils pour obtenir de meilleurs résultats:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 0 }}>
              <li>
                <Typography variant="body2">
                  Soyez précis sur les conditions de déclenchement (ex: "quand je reçois un email contenant...")
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Mentionnez explicitement les API à utiliser si nécessaire
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Décrivez les branchements conditionnels (si/sinon) clairement
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Précisez le contenu des emails à envoyer
                </Typography>
              </li>
            </Box>
          </AccordionDetails>
        </Accordion>
        
        <TextField
          autoFocus
          label="Description du flux"
          multiline
          rows={5}
          fullWidth
          variant="outlined"
          value={prompt}
          onChange={handlePromptChange}
          disabled={loading}
          placeholder="Décrivez le flux que vous souhaitez créer en détail..."
          className="ai-flow-builder-input"
        />
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }} className="ai-flow-builder-actions">
        <Button 
          onClick={onClose} 
          disabled={loading}
          className="ai-flow-builder-cancel-button"
        >
          Annuler
        </Button>
        <Button 
          onClick={handleGenerate} 
          variant="contained" 
          color="primary"
          disabled={loading || !prompt.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          className={`ai-flow-builder-generate-button ${loading ? 'ai-flow-builder-loading' : ''}`}
        >
          {loading ? 'Génération en cours...' : 'Générer le flux'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIFlowBuilder;
