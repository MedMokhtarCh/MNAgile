import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Button,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SettingsIcon from '@mui/icons-material/Settings';
import { styled } from '@mui/material/styles';
import { projectApi } from '../services/api';
import { useAvatar } from '../hooks/useAvatar';
import { useUsers } from '../hooks/useUsers';
import UserRoleSection from '../components/common/UserRoleSection';
import PageTitle from '../components/common/PageTitle';
import { normalizeProject } from '../store/slices/projectsSlice';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  height: '100%',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  position: 'relative',
  paddingBottom: theme.spacing(1),
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 3,
    backgroundColor: theme.palette.primary.main,
  },
}));

const CahierContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(3),
  border: '1px solid #ddd',
  borderRadius: 8,
  backgroundColor: '#fff',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  '& h1': {
    textAlign: 'center',
    color: '#1976d2',
    fontSize: '28px',
    marginBottom: theme.spacing(1),
  },
  '& h2': {
    fontSize: '20px',
    color: '#1976d2',
    borderBottom: '2px solid #1976d2',
    paddingBottom: theme.spacing(0.5),
    marginBottom: theme.spacing(1),
  },
  '& h3': {
    fontSize: '16px',
    color: '#1976d2',
    marginBottom: theme.spacing(0.5),
  },
  '& p': {
    marginBottom: theme.spacing(1),
  },
  '& ul': {
    paddingLeft: theme.spacing(3),
    marginBottom: theme.spacing(1),
  },
  '& .subtitle': {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#555',
    marginBottom: theme.spacing(2),
  },
  '& .footer': {
    textAlign: 'center',
    marginTop: theme.spacing(4),
    fontSize: '12px',
    color: '#777',
  },
}));

const ProjectOverview = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cahierContent, setCahierContent] = useState(null);
  const [generating, setGenerating] = useState(false);
  const { generateInitials, getAvatarColor } = useAvatar();
  const { users } = useUsers('users');

  // Configuration Axios pour Hugging Face Inference API
  const huggingFaceApi = axios.create({
    baseURL: 'https://api-inference.huggingface.co/models/mixtralai/Mixtral-8x7B-Instruct-v0.1',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer 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', // Remplacez par votre clé valide
    },
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await projectApi.get(`/Projects/${projectId}`);
        const normalizedProject = normalizeProject(response.data);
        setProject(normalizedProject);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login', { replace: true });
        } else if (err.response?.status === 404) {
          setError(`Le projet avec l'ID ${projectId} n'existe pas.`);
        } else {
          setError(
            err.response?.data?.message ||
              err.response?.data?.detail ||
              'Échec de la récupération des détails du projet.'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    } else {
      setError('ID du projet manquant.');
      setLoading(false);
    }
  }, [projectId, navigate]);

  const getUserDisplayName = (email) => {
    const user = users.find((u) => u.email === email);
    return user
      ? `${user.firstName || user.nom || ''} ${user.lastName || user.prenom || ''}`.trim() || user.email
      : email;
  };

  const getAvatarName = (email) => {
    const user = users.find((u) => u.email === email);
    return user && (user.firstName || user.nom) && (user.lastName || user.prenom)
      ? `${user.firstName || user.nom} ${user.lastName || user.prenom}`
      : email || 'Utilisateur';
  };

  // Fonction pour générer le contenu du cahier des charges avec Mixtral
  const generateCahierContent = async () => {
    if (!project) return null;
    try {
      // Construire la liste des membres de l'équipe dynamiquement
      const teamDetails = `
- Chefs de projet : ${
        project.projectManagers?.length
          ? project.projectManagers.map((email) => getUserDisplayName(email)).join(', ')
          : 'Non assigné (supervision et planification)'
      }
- Product Owners : ${
        project.productOwners?.length
          ? project.productOwners.map((email) => getUserDisplayName(email)).join(', ')
          : 'Non assigné (définition des besoins)'
      }
- Scrum Masters : ${
        project.scrumMasters?.length
          ? project.scrumMasters.map((email) => getUserDisplayName(email)).join(', ')
          : 'Non assigné (facilitation méthodologique)'
      }
- Développeurs : ${
        project.users?.length
          ? project.users.map((email) => getUserDisplayName(email)).join(', ')
          : 'Non assigné (développement)'
      }
- Testeurs : ${
        project.testers?.length
          ? project.testers.map((email) => getUserDisplayName(email)).join(', ')
          : 'Non assigné (tests)'
      }
- Observateurs : ${
        project.observers?.length
          ? project.observers.map((email) => getUserDisplayName(email)).join(', ')
          : 'Non assigné (suivi)'
      }
      `;

      const methodology = project.methodology
        ? project.methodology.charAt(0).toUpperCase() + project.methodology.slice(1)
        : 'Scrum';

      // Déduire le contexte métier et les fonctionnalités selon la description
      const isInventoryApp = project.description?.toLowerCase().includes('stock') || project.title?.toLowerCase().includes('stock');
      const businessContext = isInventoryApp
        ? "L'application répond aux besoins de l'industrie alimentaire, notamment la gestion des dates de péremption, la traçabilité des produits et la conformité aux normes sanitaires."
        : "L'application répond aux besoins de gestion de projets, en facilitant la coordination des tâches, la gestion des ressources et le suivi des progrès.";
      const functionalSpecs = isInventoryApp
        ? `
     - Gestion des stocks : ajout/retrait via barcode scanning, suivi multi-entrepôts, mises à jour en temps réel, gestion des dates de péremption.
     - Gestion des utilisateurs : rôles (admin, manager, employé), authentification MFA.
     - Rapports : tableaux de bord pour stocks, rotation et péremption, exports PDF/Excel.
     - Alertes : notifications email/SMS pour stocks bas ou péremption imminente, seuils personnalisables.
     - Intégrations : ERP (e.g., SAP, Odoo), API logistique (e.g., FedEx).
        `
        : `
     - Gestion des tâches : création, assignation et suivi des tâches avec statuts (à faire, en cours, terminé).
     - Gestion des utilisateurs : rôles (admin, chef de projet, membre), authentification MFA.
     - Rapports : tableaux de bord pour l'avancement des projets, exports PDF/Excel.
     - Alertes : notifications email/SMS pour les échéances ou retards.
     - Intégrations : outils de collaboration (e.g., Slack, Microsoft Teams).
        `;

      const prompt = `
Vous êtes un rédacteur professionnel spécialisé dans les cahiers des charges de projets informatiques. Générez un cahier des charges complet, détaillé et professionnel en français pour un projet spécifique, en utilisant les informations suivantes :

- **Titre** : ${project.title || 'Projet sans titre'}
- **Description** : ${project.description || 'Aucune description disponible.'}
- **Méthodologie** : ${methodology} (fournissez des détails adaptés à la méthodologie indiquée, ou Scrum si non spécifié).
- **Date de création** : ${project.createdAt ? new Date(project.createdAt).toLocaleDateString('fr-FR') : '13/05/2025'}
- **Date de début** : ${project.startDate ? new Date(project.startDate).toLocaleDateString('fr-FR') : '13/05/2025'}
- **Date de fin** : ${project.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : '13/05/2026'}
- **Équipe** :
  ${teamDetails}

Structurez le document avec les sections suivantes, en fournissant des informations détaillées et spécifiques, sans placeholders génériques :

1. **Introduction**
   - Présentation du projet, contexte, et objectifs principaux (adaptez selon la description, e.g., optimiser la gestion pour ${project.title}).
2. **Description du projet**
   - Informations générales (titre, description, dates, méthodologie).
   - Contexte métier : ${businessContext}
3. **Organisation de l'équipe**
   - Rôles et responsabilités détaillés pour chaque membre (utilisez les noms fournis, proposez des responsabilités réalistes pour les rôles non assignés).
4. **Méthodologie**
   - Détaillez l'approche ${methodology} : durée des sprints (e.g., 2 semaines pour Scrum), cérémonies (stand-ups, revues, rétrospectives), outils (e.g., Jira, Trello), et livrables attendus.
5. **Spécifications fonctionnelles**
   - Liste détaillée des fonctionnalités :
     ${functionalSpecs}
6. **Spécifications non fonctionnelles**
   - Performance : <1s pour les requêtes principales, support de 1,000 utilisateurs simultanés.
   - Sécurité : OAuth 2.0, chiffrement AES-256, conformité GDPR.
   - Évolutivité : support de 10,000+ entités (articles ou tâches), mise à l'échelle cloud.
   - Utilisabilité : responsive, multilingue (français, anglais), accessibilité WCAG 2.1.
   - Fiabilité : 99.9% uptime, sauvegardes automatiques.
7. **Contraintes et hypothèses**
   - Contraintes : budget limité, compatibilité navigateurs (Chrome, Firefox), délai de livraison.
   - Hypothèses : connexion internet stable, personnel formé, systèmes tiers disponibles.
8. **Gestion des risques**
   - Risques : failles de sécurité, indisponibilité API, faible adoption.
   - Mitigation : chiffrement, serveurs de secours, formations.
9. **Architecture technique**
   - Pile technologique : React, Node.js, PostgreSQL, hébergement cloud (e.g., AWS).
   - Intégrations : ${isInventoryApp ? 'scanners de codes-barres, ERP' : 'outils de collaboration'}.
10. **Calendrier et jalons**
    - Phases : collecte des besoins, développement, tests, déploiement.
    - Jalons : prototype (3 mois après le début), bêta (6 mois avant la fin), lancement final (${project.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : 'mai 2026'}).

Utilisez un ton formel, un style clair, et un vocabulaire technique adapté à un document officiel. Fournissez le contenu textuel structuré avec des titres de sections (e.g., "1. Introduction") sans balises HTML. Évitez les placeholders comme "[À préciser]". Proposez des hypothèses réalistes pour les informations manquantes.
`;

      const response = await huggingFaceApi.post('', {
        inputs: prompt,
        parameters: {
          max_length: 3000, // Augmenté pour contenu dynamique
          temperature: 0.7,
          top_p: 0.9,
        },
      });

      if (response.data && response.data[0]?.generated_text) {
        return response.data[0].generated_text.trim();
      }
      return null;
    } catch (err) {
      console.error('Erreur avec l\'API Hugging Face:', err);
      return null;
    }
  };

  // Fonction pour parser le contenu généré en HTML structuré
  const parseCahierContentToHTML = (content) => {
    if (!content || !project) {
      // Contenu de secours si l'API échoue
      const isInventoryApp = project?.description?.toLowerCase().includes('stock') || project?.title?.toLowerCase().includes('stock');
      const businessContext = isInventoryApp
        ? 'gestion des stocks alimentaires, traçabilité et conformité sanitaire'
        : 'gestion de projets, coordination et suivi';
      const functionalSpecs = isInventoryApp
        ? `
            <li><strong>Gestion des stocks</strong> : Ajout/retrait via barcode scanning, suivi multi-entrepôts, gestion des dates de péremption.</li>
            <li><strong>Gestion des utilisateurs</strong> : Rôles admin, manager, employé, authentification MFA.</li>
            <li><strong>Rapports</strong> : Tableaux de bord pour stocks et péremption, exports PDF/Excel.</li>
            <li><strong>Alertes</strong> : Notifications email/SMS pour stocks bas.</li>
            <li><strong>Intégrations</strong> : ERP (SAP, Odoo), API logistique (FedEx).</li>
          `
        : `
            <li><strong>Gestion des tâches</strong> : Création, assignation, suivi des tâches.</li>
            <li><strong>Gestion des utilisateurs</strong> : Rôles admin, chef de projet, membre, authentification MFA.</li>
            <li><strong>Rapports</strong> : Tableaux de bord pour l'avancement, exports PDF/Excel.</li>
            <li><strong>Alertes</strong> : Notifications pour échéances.</li>
            <li><strong>Intégrations</strong> : Slack, Microsoft Teams.</li>
          `;
      return `
        <h1>Cahier des Charges</h1>
        <div class="subtitle">Projet : ${project?.title || 'Projet sans titre'}</div>
        <div class="section">
          <h2 class="section-title">1. Introduction</h2>
          <p>Ce document constitue le cahier des charges du projet <strong>${project?.title || 'Projet sans titre'}</strong>. Il définit les objectifs, besoins, contraintes et organisation.</p>
          <h3>1.1 Objectifs du projet</h3>
          <p>Optimiser la ${businessContext} pour améliorer l'efficacité.</p>
          <h3>1.2 Portée du document</h3>
          <ul>
            <li>Informations générales.</li>
            <li>Rôles et responsabilités.</li>
            <li>Méthodologie.</li>
            <li>Spécifications fonctionnelles et non fonctionnelles.</li>
            <li>Contraintes, risques, architecture, calendrier.</li>
          </ul>
        </div>
        <div class="section">
          <h2 class="section-title">2. Description du projet</h2>
          <h3>2.1 Informations générales</h3>
          <p><strong>Titre :</strong> ${project?.title || 'Projet sans titre'}</p>
          <p><strong>Description :</strong> ${project?.description || 'Aucune description.'}</p>
          <p><strong>Méthodologie :</strong> ${project?.methodology || 'Scrum'}</p>
          <p><strong>Date de création :</strong> ${project?.createdAt ? new Date(project.createdAt).toLocaleDateString('fr-FR') : '13/05/2025'}</p>
          <p><strong>Date de début :</strong> ${project?.startDate ? new Date(project.startDate).toLocaleDateString('fr-FR') : '13/05/2025'}</p>
          <p><strong>Date de fin :</strong> ${project?.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : '13/05/2026'}</p>
          <h3>2.2 Contexte métier</h3>
          <p>L'application répond aux besoins de ${businessContext}.</p>
        </div>
        <div class="section">
          <h2 class="section-title">3. Organisation de l'équipe</h2>
          <h3>3.1 Rôles et responsabilités</h3>
          <ul>
            <li><strong>Chef de projet</strong> : ${project?.projectManagers?.length ? project.projectManagers.map((email) => getUserDisplayName(email)).join(', ') : 'Non assigné (supervision).'}</li>
            <li><strong>Product Owner</strong> : ${project?.productOwners?.length ? project.productOwners.map((email) => getUserDisplayName(email)).join(', ') : 'Non assigné (besoins).'}</li>
            <li><strong>Scrum Master</strong> : ${project?.scrumMasters?.length ? project.scrumMasters.map((email) => getUserDisplayName(email)).join(', ') : 'Non assigné (facilitation).'}</li>
            <li><strong>Développeur</strong> : ${project?.users?.length ? project.users.map((email) => getUserDisplayName(email)).join(', ') : 'Non assigné (développement).'}</li>
            <li><strong>Testeur</strong> : ${project?.testers?.length ? project.testers.map((email) => getUserDisplayName(email)).join(', ') : 'Non assigné (tests).'}</li>
            <li><strong>Observateur</strong> : ${project?.observers?.length ? project.observers.map((email) => getUserDisplayName(email)).join(', ') : 'Non assigné (suivi).'}</li>
          </ul>
        </div>
        <div class="section">
          <h2 class="section-title">4. Méthodologie</h2>
          <p>Le projet suit une méthodologie <strong>${project?.methodology || 'Scrum'}</strong> :</p>
          <ul>
            <li>Sprints de 2 semaines avec livrables.</li>
            <li>Stand-ups quotidiens.</li>
            <li>Backlog via Jira.</li>
            <li>Revues et rétrospectives.</li>
          </ul>
        </div>
        <div class="section">
          <h2 class="section-title">5. Spécifications fonctionnelles</h2>
          <ul>
            ${functionalSpecs}
          </ul>
        </div>
        <div class="section">
          <h2 class="section-title">6. Spécifications non fonctionnelles</h2>
          <ul>
            <li><strong>Performance</strong> : Réponse <1s, 1,000 utilisateurs.</li>
            <li><strong>Sécurité</strong> : MFA, AES-256, GDPR.</li>
            <li><strong>Évolutivité</strong> : 10,000+ entités, cloud.</li>
            <li><strong>Utilisabilité</strong> : Responsive, multilingue, WCAG 2.1.</li>
            <li><strong>Fiabilité</strong> : 99.9% uptime, sauvegardes.</li>
          </ul>
        </div>
        <div class="section">
          <h2 class="section-title">7. Contraintes et hypothèses</h2>
          <h3>7.1 Contraintes</h3>
          <ul>
            <li>Budget à définir.</li>
            <li>Compatibilité Chrome, Firefox.</li>
            <li>Délai avant ${project?.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : 'mai 2026'}.</li>
          </ul>
          <h3>7.2 Hypothèses</h3>
          <ul>
            <li>Connexion stable.</li>
            <li>Personnel formé.</li>
            <li>Systèmes tiers disponibles.</li>
          </ul>
        </div>
        <div class="section">
          <h2 class="section-title">8. Gestion des risques</h2>
          <ul>
            <li><strong>Risque</strong> : Sécurité. <strong>Mitigation</strong> : Chiffrement, audits.</li>
            <li><strong>Risque</strong> : API indisponible. <strong>Mitigation</strong> : Serveurs de secours.</li>
            <li><strong>Risque</strong> : Adoption. <strong>Mitigation</strong> : Formations.</li>
          </ul>
        </div>
        <div class="section">
          <h2 class="section-title">9. Architecture technique</h2>
          <ul>
            <li><strong>Pile</strong> : React, Node.js, PostgreSQL, AWS.</li>
            <li><strong>Intégrations</strong> : ${isInventoryApp ? 'Scanners, ERP' : 'Outils de collaboration'}.</li>
            <li><strong>Infrastructure</strong> : API REST, microservices.</li>
          </ul>
        </div>
        <div class="section">
          <h2 class="section-title">10. Calendrier et jalons</h2>
          <ul>
            <li><strong>Besoins</strong> : ${project?.startDate ? new Date(new Date(project.startDate).setMonth(new Date(project.startDate).getMonth() + 2)).toLocaleDateString('fr-FR') : 'Juin-Juillet 2025'}.</li>
            <li><strong>Prototype</strong> : ${project?.startDate ? new Date(new Date(project.startDate).setMonth(new Date(project.startDate).getMonth() + 4)).toLocaleDateString('fr-FR') : 'Septembre 2025'}.</li>
            <li><strong>Bêta</strong> : ${project?.endDate ? new Date(new Date(project.endDate).setMonth(new Date(project.endDate).getMonth() - 4)).toLocaleDateString('fr-FR') : 'Janvier 2026'}.</li>
            <li><strong>Lancement</strong> : ${project?.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : 'Mai 2026'}.</li>
          </ul>
        </div>
        <div class="footer">
          Généré le ${new Date().toLocaleDateString('fr-FR')} | Version 1.0
        </div>
      `;
    }

    // Parser le contenu généré par Mixtral
    const sections = content.split(/\n(?=\d+\.\s)/);
    let htmlContent = `
      <h1>Cahier des Charges</h1>
      <div class="subtitle">Projet : ${project.title || 'Projet sans titre'}</div>
    `;

    sections.forEach((section) => {
      const lines = section.split('\n');
      const titleMatch = lines[0].match(/^(\d+\.\s.*)$/);
      if (titleMatch) {
        htmlContent += `<div class="section"><h2 class="section-title">${titleMatch[1]}</h2>`;
        lines.slice(1).forEach((line) => {
          if (line.match(/^\d+\.\d+\.\s/)) {
            htmlContent += `<h3>${line}</h3>`;
          } else if (line.match(/^- /)) {
            if (!htmlContent.includes('<ul>')) htmlContent += '<ul>';
            htmlContent += `<li>${line.replace(/^- /, '')}</li>`;
          } else if (line.match(/^\s*$/)) {
            if (htmlContent.includes('<ul>')) htmlContent += '</ul>';
          } else {
            if (htmlContent.includes('<ul>')) htmlContent += '</ul>';
            htmlContent += `<p>${line}</p>`;
          }
        });
        if (htmlContent.includes('<ul>')) htmlContent += '</ul>';
        htmlContent += '</div>';
      }
    });

    htmlContent += `
      <div class="footer">
        Généré le ${new Date().toLocaleDateString('fr-FR')} | Version 1.0
      </div>
    `;

    return htmlContent || content;
  };

  // Fonction pour générer et afficher le cahier des charges
  const handleGenerateCahierDesCharges = async () => {
    setGenerating(true);
    setError(null);
    try {
      const content = await generateCahierContent();
      const htmlContent = parseCahierContentToHTML(content);
      setCahierContent(htmlContent);
    } catch (err) {
      console.error('Erreur lors de la génération du cahier des charges:', err);
      setError('Échec de la génération du cahier des charges.');
      setCahierContent(parseCahierContentToHTML(null));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement des détails du projet...</Typography>
      </Box>
    );
  }

  if (error && !cahierContent) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Erreur : {error}</Typography>
        {error.includes("n'existe pas") && (
          <Typography>
            Le projet avec l'ID ${projectId} n'existe pas ou vous n'y avez pas accès.
          </Typography>
        )}
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Projet non trouvé.</Typography>
        <Typography>
          Le projet avec l'ID ${projectId} n'existe pas ou vous n'y avez pas accès.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageTitle>Aperçu du projet</PageTitle>

      {/* Bouton unique pour générer le cahier des charges */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateCahierDesCharges}
          disabled={generating}
        >
          Générer Cahier des Charges
        </Button>
      </Box>

      {/* Afficher le loader pendant la génération */}
      {generating && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Génération du cahier des charges...</Typography>
        </Box>
      )}

      {/* Afficher le contenu généré */}
      {cahierContent && !generating && (
        <CahierContainer>
          <div dangerouslySetInnerHTML={{ __html: cahierContent }} />
        </CahierContainer>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <SectionTitle variant="h6">
              <Box display="flex" alignItems="center">
                <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                Informations du projet
              </Box>
            </SectionTitle>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Titre
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {project.title}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Description
              </Typography>
              <Typography
                sx={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {project.description || 'Aucune description disponible.'}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                Méthode Agile
              </Typography>
              <Typography>
                {project.methodology
                  ? project.methodology.charAt(0).toUpperCase() +
                    project.methodology.slice(1)
                  : 'Non spécifié'}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                Créé le
              </Typography>
              <Typography>
                {new Date(project.createdAt).toLocaleDateString('fr-FR')}
              </Typography>
            </Box>
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={6}>
          <StyledPaper>
            <SectionTitle variant="h6">
              <Box display="flex" alignItems="center">
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                Équipe du projet
              </Box>
            </SectionTitle>

            <UserRoleSection
              title="Chefs de projet"
              users={project.projectManagers || []}
              getUserDisplayName={getUserDisplayName}
              getAvatarName={getAvatarName}
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
            />

            <Divider sx={{ my: 2 }} />

            <UserRoleSection
              title="Product Owners"
              users={project.productOwners || []}
              getUserDisplayName={getUserDisplayName}
              getAvatarName={getAvatarName}
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
            />

            <Divider sx={{ my: 2 }} />

            <UserRoleSection
              title="Scrum Masters"
              users={project.scrumMasters || []}
              getUserDisplayName={getUserDisplayName}
              getAvatarName={getAvatarName}
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
            />

            <Divider sx={{ my: 2 }} />

            <UserRoleSection
              title="Développeurs"
              users={project.users || []}
              getUserDisplayName={getUserDisplayName}
              getAvatarName={getAvatarName}
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
            />

            <Divider sx={{ my: 2 }} />

            <UserRoleSection
              title="Testeurs"
              users={project.testers || []}
              getUserDisplayName={getUserDisplayName}
              getAvatarName={getAvatarName}
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
            />

            <Divider sx={{ my: 2 }} />

            <UserRoleSection
              title="Observateurs"
              users={project.observers || []}
              getUserDisplayName={getUserDisplayName}
              getAvatarName={getAvatarName}
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
            />
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectOverview;