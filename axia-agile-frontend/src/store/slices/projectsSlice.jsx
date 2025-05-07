import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectApi } from '../../services/api';

// Normalize project data from backend to frontend format
const normalizeProject = (project) => ({
  id: String(project.id || project.Id || ''),
  title: project.title || project.Title || '',
  description: project.description || project.Description || '',
  method: project.methodology || project.Methodology || '',
  createdAt: project.createdAt || project.CreatedAt || new Date().toISOString(),
  startDate: project.startDate || project.StartDate || new Date().toISOString(),
  endDate: project.endDate || project.EndDate || new Date().toISOString(),
  createdBy: project.createdBy || project.CreatedBy || '',
  projectManagers: project.projectManagers || project.ProjectManagers || [],
  productOwners: project.productOwners || project.ProductOwners || [],
  scrumMasters: project.scrumMasters || project.ScrumMasters || [],
  users: project.developers || project.Developers || [],
  testers: project.testers || project.Testers || [],
  observers: project.observers || project.Observers || [],
  kanbanColumns: project.kanbanColumns || [], // Add kanbanColumns to normalized project
});

// Normalize Kanban column data
const normalizeKanbanColumn = (column) => ({
  id: String(column.id || column.Id || ''),
  name: column.name || column.Name || '',
  projectId: String(column.projectId || column.ProjectId || ''),
  displayOrder: column.displayOrder || column.DisplayOrder || 0,
});

// Validate user emails against usersSlice
const validateUsers = (users, allUsers, fieldName) => {
  if (!users || !Array.isArray(users)) return [];
  const invalidUsers = users.filter((email) => !allUsers.some((u) => u.email === email));
  if (invalidUsers.length > 0) {
    throw new Error(`Utilisateurs non valides dans ${fieldName}: ${invalidUsers.join(', ')}`);
  }
  return users;
};

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

// Fetch Kanban columns for a project
export const fetchKanbanColumns = createAsyncThunk(
  'projects/fetchKanbanColumns',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await projectApi.get(`/KanbanColumns?projectId=${projectId}`);
      return {
        projectId: String(projectId),
        columns: response.data.map(normalizeKanbanColumn),
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message) ||
        'Échec de la récupération des colonnes Kanban';
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
  async (project, { rejectWithValue, getState, dispatch }) => {
    try {
      const { users: allUsers } = getState().users;
      const payload = {
        title: project.title,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        methodology: project.methodology,
        createdBy: project.createdBy,
        projectManagers: validateUsers(
          project.projectManager ? [project.projectManager] : [],
          allUsers,
          'projectManagers'
        ),
        productOwners: validateUsers(
          project.productOwner ? [project.productOwner] : [],
          allUsers,
          'productOwners'
        ),
        scrumMasters: validateUsers(
          project.scrumMaster ? [project.scrumMaster] : [],
          allUsers,
          'scrumMasters'
        ),
        developers: validateUsers(project.developers || [], allUsers, 'developers'),
        testers: validateUsers(project.testers || [], allUsers, 'testers'),
        observers: validateUsers(project.observers || [], allUsers, 'observers'),
      };
      console.log('Create Project Payload:', payload);
      const response = await projectApi.post('/Projects', payload);
      const normalizedProject = normalizeProject(response.data);
      
      // Fetch Kanban columns for the new project
      await dispatch(fetchKanbanColumns(normalizedProject.id));
      
      return normalizedProject;
    } catch (error) {
      const errorMessage =
        error.message ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : 'Échec de la création du projet');
      console.error('Create Project Error:', errorMessage);
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
  async ({ id, project }, { rejectWithValue, getState }) => {
    try {
      const { users: allUsers } = getState().users;
      const projectId = parseInt(id);
      if (isNaN(projectId)) {
        throw new Error('ID de projet invalide');
      }
      const payload = { id: projectId };
      if (project.title) payload.title = project.title;
      if (project.description) payload.description = project.description;
      if (project.startDate) payload.startDate = project.startDate;
      if (project.endDate) payload.endDate = project.endDate;
      if (project.methodology) payload.methodology = project.methodology;
      if (project.projectManager)
        payload.projectManagers = validateUsers([project.projectManager], allUsers, 'projectManagers');
      if (project.productOwner)
        payload.productOwners = validateUsers([project.productOwner], allUsers, 'productOwners');
      if (project.scrumMaster)
        payload.scrumMasters = validateUsers([project.scrumMaster], allUsers, 'scrumMasters');
      if (project.developers)
        payload.developers = validateUsers(project.developers, allUsers, 'developers');
      if (project.testers) payload.testers = validateUsers(project.testers, allUsers, 'testers');
      if (project.observers) payload.observers = validateUsers(project.observers, allUsers, 'observers');
      console.log('Update Project Payload:', payload);
      const response = await projectApi.put(`/Projects/${projectId}`, payload);
      return normalizeProject(response.data);
    } catch (error) {
      const errorMessage =
        error.message ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : 'Échec de la mise à jour du projet');
      console.error('Update Project Error:', errorMessage);
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
      const projectId = parseInt(id);
      if (isNaN(projectId)) {
        throw new Error('ID de projet invalide');
      }
      await projectApi.delete(`/Projects/${projectId}`);
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
      .addCase(fetchKanbanColumns.fulfilled, (state, action) => {
        const { projectId, columns } = action.payload;
        const project = state.projects.find((p) => p.id === projectId);
        if (project) {
          project.kanbanColumns = columns;
        }
      })
      .addCase(fetchKanbanColumns.rejected, (state, action) => {
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