import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../../services/api';

// Normalize project data from backend to frontend format
const normalizeProject = (project) => ({
  id: String(project.id || project.Id || ''), // Ensure ID is a string
  title: project.title || project.Title || '',
  description: project.description || project.Description || '',
  method: project.methodology || project.Methodology || '', // Map backend methodology to frontend method
  createdAt: project.createdAt || project.CreatedAt || new Date().toISOString(),
  startDate: project.startDate || project.StartDate || new Date().toISOString(),
  endDate: project.endDate || project.EndDate || new Date().toISOString(),
  createdBy: project.createdBy || project.CreatedBy || '',
  projectManagers: project.projectManagers || project.ProjectManagers || [],
  productOwners: project.productOwners || project.ProductOwners || [],
  scrumMasters: project.scrumMasters || project.ScrumMasters || [],
  users: project.developers || project.Developers || [], // Map developers to users
  testers: project.testers || project.Testers || [],
  observers: project.observers || project.Observers || [], // Add observers
});

// Fetch all projects
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectApi.get('/Projects');
      return response.data.map(normalizeProject);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message) ||
        'Échec de la récupération des projets';
      return rejectWithValue({
        message: errorMessage,
        severity: 'error',
      });
    }
  }
);

// Create a new project
export const createProject = createAsyncThunk(
  'projects/createProject',
  async (project, { rejectWithValue }) => {
    try {
      // Map frontend project to backend CreateProjectDto
      const payload = {
        title: project.title,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        methodology: project.methodology, // Corrected to use project.methodology
        createdBy: project.createdBy,
        projectManagers: project.projectManager ? [project.projectManager] : [], // Use projectManager
        productOwners: project.productOwner ? [project.productOwner] : [], // Use productOwner
        scrumMasters: project.scrumMaster ? [project.scrumMaster] : [], // Use scrumMaster
        developers: project.developers || [], // Map developers directly
        testers: project.testers || [],
        observers: project.observers || [], // Include observers
      };
      console.log('Create Project Payload:', payload); // Debug log
      const response = await projectApi.post('/Projects', payload);
      return normalizeProject(response.data);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message) ||
        'Échec de la création du projet';
      console.error('Create Project Error:', errorMessage); // Debug log
      return rejectWithValue({
        message: errorMessage.includes("n'existe pas")
          ? `Utilisateur non trouvé : ${errorMessage.split(' ').pop()}`
          : errorMessage,
        severity: 'error',
      });
    }
  }
);

// Update an existing project (partial updates)
export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, project }, { rejectWithValue }) => {
    try {
      // Only include fields that are provided (partial update)
      const payload = { id: parseInt(id) }; // Ensure ID is a number
      if (project.title) payload.title = project.title;
      if (project.description) payload.description = project.description;
      if (project.startDate) payload.startDate = project.startDate;
      if (project.endDate) payload.endDate = project.endDate;
      if (project.methodology) payload.methodology = project.methodology; // Corrected to use project.methodology
      if (project.projectManager) payload.projectManagers = [project.projectManager]; // Use projectManager
      if (project.productOwner) payload.productOwners = [project.productOwner]; // Use productOwner
      if (project.scrumMaster) payload.scrumMasters = [project.scrumMaster]; // Use scrumMaster
      if (project.developers) payload.developers = project.developers; // Map developers directly
      if (project.testers) payload.testers = project.testers;
      if (project.observers) payload.observers = project.observers;
      console.log('Update Project Payload:', payload); // Debug log
      const response = await projectApi.put(`/Projects/${id}`, payload);
      return normalizeProject(response.data);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message) ||
        'Échec de la mise à jour du projet';
      console.error('Update Project Error:', errorMessage); // Debug log
      return rejectWithValue({
        message: errorMessage.includes("n'existe pas")
          ? `Utilisateur non trouvé : ${errorMessage.split(' ').pop()}`
          : errorMessage,
        severity: 'error',
      });
    }
  }
);

// Delete a project
export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (id, { rejectWithValue }) => {
    try {
      await projectApi.delete(`/Projects/${id}`);
      return id;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message) ||
        'Échec de la suppression du projet';
      return rejectWithValue({
        message: errorMessage,
        severity: 'error',
      });
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    status: 'idle',
    error: null,
    snackbar: { open: false, message: '', severity: 'success' },
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSnackbar: (state, action) => {
      state.snackbar = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.projects = action.payload;
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
        state.snackbar = {
          open: true,
          message: action.payload.message,
          severity: action.payload.severity,
        };
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.push(action.payload);
        state.error = null;
        state.snackbar = {
          open: true,
          message: 'Projet créé avec succès',
          severity: 'success',
        };
      })
      .addCase(createProject.rejected, (state, action) => {
        state.error = action.payload.message;
        state.snackbar = {
          open: true,
          message: action.payload.message,
          severity: action.payload.severity,
        };
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        state.error = null;
        state.snackbar = {
          open: true,
          message: 'Projet modifié avec succès',
          severity: 'success',
        };
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.error = action.payload.message;
        state.snackbar = {
          open: true,
          message: action.payload.message,
          severity: action.payload.severity,
        };
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p.id !== String(action.payload));
        state.error = null;
        state.snackbar = {
          open: true,
          message: 'Projet supprimé avec succès',
          severity: 'success',
        };
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.error = action.payload.message;
        state.snackbar = {
          open: true,
          message: action.payload.message,
          severity: action.payload.severity,
        };
      });
  },
});

export const { clearError, setSnackbar } = projectsSlice.actions;
export default projectsSlice.reducer;