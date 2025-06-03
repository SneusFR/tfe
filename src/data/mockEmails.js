// Mock email data for demonstrating the UI
export const mockEmails = [
  {
    id: "email-1",
    subject: "Project Update - API Diagram Tool",
    from: {
      name: "Jean Dupont",
      address: "jean.dupont@example.com"
    },
    date: new Date(2025, 3, 13, 9, 30).toISOString(),
    snippet: "Je vous envoie une mise à jour concernant le projet d'outil de diagramme API. Nous avons terminé la phase initiale et..."
  },
  {
    id: "email-2",
    subject: "Dossier Valentin",
    from: {
      name: "Valentin Vanrumbeke",
      address: "ValentinVanrumbeke@gmail.com"
    },
    date: new Date(2025, 3, 12, 15, 45).toISOString(),
    snippet: "Bonjour, j'aimerais bien savoir où en est mon dossier. Cdt"
  },
  {
    id: "email-3",
    subject: "Demandez de rendez-vous Valentin",
    from: {
      name: "Valentin Vanrumbeke",
      address: "ValentinVanrumbeke@gmail.com"
    },
    date: new Date(2025, 3, 11, 11, 20).toISOString(),
    snippet: "J'aimerais prendre rdv pour une analyse dans votre cabinet"
  },
  {
    id: "email-4",
    subject: "Demande de devis pour nouveaux services",
    from: {
      name: "Marie Dubois",
      address: "marie.dubois@example.com"
    },
    date: new Date(2025, 3, 10, 9, 15).toISOString(),
    snippet: "Suite à notre conversation téléphonique, je souhaiterais obtenir un devis pour l'implémentation des services discutés..."
  },
  {
    id: "email-5",
    subject: "Invitation: Présentation du produit",
    from: {
      name: "Pierre Lambert",
      address: "pierre.lambert@example.com"
    },
    date: new Date(2025, 3, 9, 16, 30).toISOString(),
    snippet: "Nous avons le plaisir de vous inviter à la présentation de notre nouveau produit qui aura lieu le 20 avril à 10h..."
  },
  {
    id: "email-6",
    subject: "Rapport mensuel - Mars 2025",
    from: {
      name: "Isabelle Moreau",
      address: "isabelle.moreau@example.com"
    },
    date: new Date(2025, 3, 8, 14, 0).toISOString(),
    snippet: "Veuillez trouver ci-joint le rapport mensuel pour mars 2025. Les points clés incluent une augmentation de 15% des ventes..."
  },
  {
    id: "email-7",
    subject: "Problème technique - Serveur de production",
    from: {
      name: "François Leroy",
      address: "francois.leroy@example.com"
    },
    date: new Date(2025, 3, 7, 8, 45).toISOString(),
    snippet: "Nous avons détecté un problème sur le serveur de production ce matin à 7h30. L'équipe technique travaille actuellement..."
  },
  {
    id: "email-8",
    subject: "Nouveau contrat de service",
    from: {
      name: "Caroline Petit",
      address: "caroline.petit@example.com"
    },
    date: new Date(2025, 3, 6, 11, 10).toISOString(),
    snippet: "Suite à notre dernière réunion, je vous envoie le nouveau contrat de service pour validation. Les termes ont été mis à jour..."
  },
  {
    id: "email-9",
    subject: "Maintenance planifiée - 15 avril",
    from: {
      name: "Michel Simon",
      address: "michel.simon@example.com"
    },
    date: new Date(2025, 3, 5, 10, 0).toISOString(),
    snippet: "Nous vous informons qu'une maintenance planifiée aura lieu le 15 avril de 22h à 2h du matin. Pendant cette période..."
  },
  {
    id: "email-10",
    subject: "Renouvellement de licence",
    from: {
      name: "Aurélie Rousseau",
      address: "aurelie.rousseau@example.com"
    },
    date: new Date(2025, 3, 4, 15, 30).toISOString(),
    snippet: "Votre licence expire le 30 avril 2025. Pour assurer la continuité de votre service, nous vous invitons à procéder au..."
  },
  {
    id: "email-11",
    subject: "Compte-rendu de la réunion du 3 avril",
    from: {
      name: "Laurent Girard",
      address: "laurent.girard@example.com"
    },
    date: new Date(2025, 3, 3, 17, 0).toISOString(),
    snippet: "Veuillez trouver ci-joint le compte-rendu de notre réunion d'équipe du 3 avril. Les actions à suivre ont été assignées..."
  },
  {
    id: "email-12",
    subject: "Offre d'emploi - Développeur Frontend",
    from: {
      name: "Claire Fontaine",
      address: "claire.fontaine@example.com"
    },
    date: new Date(2025, 3, 2, 9, 45).toISOString(),
    snippet: "Nous recherchons actuellement un développeur frontend pour rejoindre notre équipe. Le poste requiert une expérience en React..."
  },
  {
    id: "email-13",
    subject: "Mise à jour de sécurité critique",
    from: {
      name: "Nicolas Martin",
      address: "nicolas.martin@example.com"
    },
    date: new Date(2025, 3, 1, 13, 15).toISOString(),
    snippet: "Une mise à jour de sécurité critique est disponible pour notre application. Nous vous recommandons vivement de l'installer..."
  },
  {
    id: "email-14",
    subject: "Formation React avancé - Places disponibles",
    from: {
      name: "Sarah Legrand",
      address: "sarah.legrand@example.com"
    },
    date: new Date(2025, 2, 31, 11, 30).toISOString(),
    snippet: "Notre prochaine session de formation React avancé aura lieu du 20 au 24 avril. Il reste encore quelques places disponibles..."
  },
  {
    id: "email-15",
    subject: "Résultats du sondage client",
    from: {
      name: "Paul Mercier",
      address: "paul.mercier@example.com"
    },
    date: new Date(2025, 2, 30, 16, 0).toISOString(),
    snippet: "Les résultats du sondage client pour le premier trimestre 2025 sont maintenant disponibles. La satisfaction globale a augmenté..."
  },
  {
    id: "email-16",
    subject: "Nouvelle version de l'API - Documentation",
    from: {
      name: "Emma Roux",
      address: "emma.roux@example.com"
    },
    date: new Date(2025, 2, 29, 14, 30).toISOString(),
    snippet: "Nous avons le plaisir de vous annoncer la sortie de la version 3.0 de notre API. La documentation complète est disponible..."
  },
  {
    id: "email-17",
    subject: "Invitation: Webinaire sur les nouvelles technologies",
    from: {
      name: "Antoine Durand",
      address: "antoine.durand@example.com"
    },
    date: new Date(2025, 2, 28, 10, 45).toISOString(),
    snippet: "Nous vous invitons à participer à notre webinaire sur les technologies émergentes qui aura lieu le 16 avril à 14h. Les sujets abordés..."
  },
  {
    id: "email-18",
    subject: "Demande de congés - Validation",
    from: {
      name: "Julie Moreau",
      address: "julie.moreau@example.com"
    },
    date: new Date(2025, 2, 27, 9, 0).toISOString(),
    snippet: "Votre demande de congés pour la période du 10 au 20 mai a été approuvée. N'oubliez pas de mettre à jour votre statut dans..."
  }
];
