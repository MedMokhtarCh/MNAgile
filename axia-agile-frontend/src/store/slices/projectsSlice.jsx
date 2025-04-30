import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../../services/api';

const normalizeProject = (project) => ({
    id: String(project.id || project.projectId || project.Id || ''),
    title: project.title || project.Title || project.name || '',
    description: project.description || project.Description || project.desc || '',
    method: project.methodology || project.Methodology || project.method || '',
    createdAt: project.createdAt || project.CreatedAt || new Date().toISOString(),
    startDate: project.startDate || project.StartDate || new Date().toISOString(),
    endDate: project.endDate || project.EndDate || new Date().toISOString(),
    createdBy: project.createdBy || project.CreatedBy || '',
    projectManagers: project.projectManager
      ? [project.projectManager]
      : project.ProjectManager
      ? [project.ProjectManager]
      : project.projectManagers || [],
    productOwners: project.productOwner
      ? [project.productOwner]
      : project.ProductOwner
      ? [project.ProductOwner]
      : project.productOwners || [],
    scrumMasters: project.scrumMaster
      ? [project.scrumMaster]
      : project.ScrumMaster
      ? [project.ScrumMaster]
      : project.scrumMasters || [],
    users: project.developers || project.Developers || project.users || [],
    testers: project.testers || project.Testers || [],
  });

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

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (project, { rejectWithValue }) => {
    try {
      const response = await projectApi.post('/Projects', project);
      return normalizeProject(response.data);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message) ||
        'Échec de la création du projet';
      return rejectWithValue({
        message: errorMessage.includes("n'existe pas")
          ? `Utilisateur non trouvé : ${errorMessage.split(' ').pop()}`
          : errorMessage,
        severity: 'error',
      });
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, project }, { rejectWithValue }) => {
    try {
      const response = await projectApi.put(`/Projects/${id}`, project);
      return normalizeProject(response.data);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message) ||
        'Échec de la mise à jour du projet';
      return rejectWithValue({
        message: errorMessage.includes("n'existe pas")
          ? `Utilisateur non trouvé : ${errorMessage.split(' ').pop()}`
          : errorMessage,
        severity: 'error',
      });
    }
  }
);

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
        const index = state.projects.findIndex((p) => p.id.toString() === action.payload.id.toString());
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
        state.projects = state.projects.filter((p) => p.id.toString() !== action.payload.toString());
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