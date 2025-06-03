import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Configuration de l'API OpenRouter
const openRouterApi = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_XAI_API_KEY}`,
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Project Management App',
  },
});

// Helper function to prepare team details
const prepareTeamDetails = (project, getUserDisplayName) => ({
  projectManagers: project.projectManagers?.length
    ? project.projectManagers.map(getUserDisplayName).join(', ')
    : 'Non assigné (supervision)',
  productOwners: project.productOwners?.length
    ? project.productOwners.map(getUserDisplayName).join(', ')
    : 'Non assigné (définition des besoins)',
  scrumMasters: project.scrumMasters?.length
    ? project.scrumMasters.map(getUserDisplayName).join(', ')
    : 'Non assigné (facilitation)',
  developers: project.users?.length
    ? project.users.map(getUserDisplayName).join(', ')
    : 'Non assigné (développement)',
  testers: project.testers?.length
    ? project.testers.map(getUserDisplayName).join(', ')
    : 'Non assigné (tests)',
  observers: project.observers?.length
    ? project.observers.map(getUserDisplayName).join(', ')
    : 'Non assigné (suivi)',
});

// Define section-specific prompts
const sectionPrompts = (project, teamDetails, methodology) => ({
  introduction: `
Générez l'**Introduction** d'un cahier des charges professionnel en français pour un projet informatique. Incluez :
- Contexte détaillé
- Objectifs SMART
- Portée du projet
- Public cible
- Bénéfices attendus
Ton : formel, précis, professionnel. Projet : ${project.title || 'Projet sans titre'}. Description : ${project.description || 'Aucune description disponible'}.
`,
  description: `
Générez la **Description du projet** d'un cahier des charges en français. Incluez :
- Titre : ${project.title || 'Projet sans titre'}
- Description : ${project.description || 'Aucune description disponible'}
- Vision globale
- Fonctionnalités principales détaillées
Ton : formel, structuré, exhaustif.
`,
  methodology: `
Générez la section **Méthodologie** d'un cahier des charges en français. Méthodologie : ${methodology}. Incluez :
- Principes de la méthodologie
- Rituels (ex : daily stand-ups, sprint planning)
- Livrables spécifiques
Ton : formel, technique, adapté au projet.
`,
  team: `
Générez la section **Équipe projet** d'un cahier des charges en français. Incluez :
- Chefs de projet : ${teamDetails.projectManagers} (rôles et responsabilités)
- Product Owners : ${teamDetails.productOwners} (rôles et responsabilités)
- Scrum Masters : ${teamDetails.scrumMasters} (rôles et responsabilités)
- Développeurs : ${teamDetails.developers} (rôles et responsabilités)
- Testeurs : ${teamDetails.testers} (rôles et responsabilités)
- Observateurs : ${teamDetails.observers} (rôles et responsabilités)
Ton : formel, détaillé.
`,
  planning: `
Générez la section **Planning** d'un cahier des charges en français. Incluez :
- Date de création : ${project.createdAt ? new Date(project.createdAt).toLocaleDateString('fr-FR') : '13/05/2025'}
- Date de début : ${project.startDate ? new Date(project.startDate).toLocaleDateString('fr-FR') : '13/05/2025'}
- Date de fin : ${project.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : '13/05/2026'}
- Phases clés, jalons, sprints (si Agile), estimation des durées
Ton : formel, structuré.
`,
  functionalRequirements: `
Générez la section **Exigences fonctionnelles** d'un cahier des charges en français. Incluez :
- Fonctionnalités détaillées par module (ex : gestion des véhicules, clients, locations, facturation, rapports)
- Pour chaque fonctionnalité : description, acteurs, pré/postconditions, scénarios d'utilisation
- Exemples : ajout/suppression de véhicules, suivi d'état, gestion des coûts, enregistrement des clients, processus de réservation, facturation automatique, rapports avec KPIs
Ton : exhaustif, structuré, précis.
`,
  technicalRequirements: `
Générez la section **Exigences techniques** d'un cahier des charges en français. Incluez :
- Choix technologiques (langages, frameworks, BDD, serveurs)
- Contraintes (performance, sécurité, scalabilité, intégrations API)
- Normes de développement
- Architecture (ex : microservices)
- Environnements (dev, test, prod)
- Outils CI/CD
Ton : technique, formel, axé sur robustesse et maintenabilité.
`,
  deliverables: `
Générez la section **Livrables attendus** d'un cahier des charges en français. Incluez :
- Liste des livrables (code source, documentations technique/utilisateur, environnements, rapports de tests, jeux de données, plan de formation)
- Format et objectif de chaque livrable
Ton : formel, précis.
`,
  constraintsRisks: `
Générez la section **Contraintes et risques** d'un cahier des charges en français. Incluez :
- Contraintes (budget, délai, ressources, réglementations, intégrations)
- Risques : nature, probabilité, impact, mesures d'atténuation
Ton : analytique, formel, exhaustif.
`,
  implementationPlan: `
Générez la section **Plan d'implémentation détaillé** d'un cahier des charges en français. Incluez :
- Feuille de route avec phases clés, jalons, durées estimées
- Étapes : conception, développement, tests, déploiement, maintenance
- Exemples de user stories pour les premiers sprints (si Agile)
Ton : formel, structuré, pratique.
`,
});

// Thunk to generate cahier des charges
export const generateCahierContent = createAsyncThunk(
  'cahierDesCharges/generate',
  async ({ project, users, getUserDisplayName }, { rejectWithValue, dispatch }) => {
    try {
      const teamDetails = prepareTeamDetails(project, getUserDisplayName);
      const methodology = project.methodology
        ? project.methodology.charAt(0).toUpperCase() + project.methodology.slice(1)
        : 'Scrum';

      const prompts = sectionPrompts(project, teamDetails, methodology);
      const sections = Object.keys(prompts);
      const results = await Promise.all(
        sections.map(async (sectionKey) => {
          let sectionContent = '';
          let isComplete = false;
          let retryCount = 0;
          const MAX_RETRIES = 3; // Reduced retries since sections are smaller

          while (!isComplete && retryCount < MAX_RETRIES) {
            const prompt = retryCount === 0
              ? prompts[sectionKey]
              : `Continuez la section **${sectionKey}** du cahier des charges à partir de ce contexte :\n---\n${sectionContent.slice(-1000)}\n---\nMaintenez un ton formel, structuré, et ne répétez pas le contenu existant.`;

            const response = await openRouterApi.post('/chat/completions', {
              model: 'meta-llama/llama-3.1-8b-instruct', // Faster model
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 4000, // Reduced for faster response
              temperature: 0.7,
              top_p: 0.9,
            });

            if (response.data?.choices?.[0]?.message?.content) {
              let content = response.data.choices[0].message.content.trim();
              if (content.startsWith('```') && content.endsWith('```')) {
                content = content.substring(3, content.length - 3).trim();
              }
              sectionContent += content;
              isComplete = response.data.choices[0].finish_reason !== 'length';
            } else {
              throw new Error(`No content for section ${sectionKey}`);
            }
            retryCount++;
          }

          return { section: sectionKey, content: sectionContent, isTruncated: !isComplete };
        })
      );

      // Combine sections in order
      const combinedContent = sections
        .map((key) => {
          const section = results.find((r) => r.section === key);
          return `## ${key.charAt(0).toUpperCase() + key.slice(1)}\n${section.content}`;
        })
        .join('\n\n');

      const isTruncated = results.some((r) => r.isTruncated);

      return { content: combinedContent, isTruncated };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Échec de la génération du cahier des charges.'
      );
    }
  }
);

// Slice Redux
const cahierDesChargesSlice = createSlice({
  name: 'cahierDesCharges',
  initialState: {
    content: null,
    isGenerating: false,
    error: null,
    isTruncated: false,
    sections: {}, // Store individual sections for partial updates
  },
  reducers: {
    resetCahier: (state) => {
      state.content = null;
      state.isGenerating = false;
      state.error = null;
      state.isTruncated = false;
      state.sections = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateCahierContent.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
        state.content = null;
        state.isTruncated = false;
        state.sections = {};
      })
      .addCase(generateCahierContent.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.content = action.payload.content;
        state.isTruncated = action.payload.isTruncated;
        // Store sections individually for potential UI updates
        action.payload.content.split('\n\n## ').forEach((section) => {
          const [title, ...content] = section.split('\n');
          if (title) {
            state.sections[title.toLowerCase().replace('## ', '')] = content.join('\n');
          }
        });
      })
      .addCase(generateCahierContent.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload || 'Échec de la génération du cahier des charges.';
      });
  },
});

export const { resetCahier } = cahierDesChargesSlice.actions;
export default cahierDesChargesSlice.reducer;