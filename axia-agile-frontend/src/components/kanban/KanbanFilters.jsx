import React from 'react';
import { Box, Autocomplete, TextField, FormControl, InputLabel, Select as MuiSelect, OutlinedInput, MenuItem, Typography, Avatar, Paper, Grid } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

function KanbanFilters({
  backlogs = [], // Default to empty array
  sprints = [], // Default to empty array
  projectUsers = [], // Default to empty array
  selectedUser,
  selectedPriority,
  backlogFilter,
  selectedBacklog,
  sprintFilter,
  selectedSprint,
  setBacklogFilter,
  setSelectedBacklog,
  setSprintFilter,
  setSelectedSprint,
  setSelectedPriority,
  handleUserFilterChange,
  getAvatarColor,
  generateInitials,
  setDialogMode,
  setFormValues,
  setDialogOpen,
}) {
  const { currentUser } = useAuth();

  // Determine available options based on permissions
  const hasBacklogViewPermission = currentUser?.claims?.includes('CanViewBacklogs');
  const hasSprintViewPermission = currentUser?.claims?.includes('CanViewSprints');

  const backlogOptions = [
    ...(hasBacklogViewPermission ? [{ id: 'all', name: 'Tous les backlogs' }] : []),
    { id: 'none', name: 'Aucun backlog' },
    ...(hasBacklogViewPermission ? backlogs : []),
  ];

  const sprintOptions = [
    ...(hasSprintViewPermission ? [{ id: 'all', name: 'Tous les sprints' }] : []),
    { id: 'none', name: 'Aucun sprint' },
    ...(hasSprintViewPermission ? sprints : []),
  ];

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Filtres
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <Autocomplete
            options={backlogOptions}
            getOptionLabel={(option) => option.name}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <li key={key} {...otherProps}>
                  <Typography variant="body2">{option.name}</Typography>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filtrer par backlog"
                variant="outlined"
                sx={{ bgcolor: 'white' }}
              />
            )}
            value={
              backlogFilter === 'all'
                ? { id: 'all', name: 'Tous les backlogs' }
                : backlogFilter === 'none'
                ? { id: 'none', name: 'Aucun backlog' }
                : backlogs.find((b) => b.id === backlogFilter) || { id: 'none', name: 'Aucun backlog' }
            }
            onChange={(event, value) => {
              if (value) {
                setBacklogFilter(value.id);
                setSelectedBacklog(value.id !== 'all' && value.id !== 'none' ? value : null);
              } else {
                setBacklogFilter('none');
                setSelectedBacklog(null);
              }
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={{ width: '100%' }}
            disabled={!hasBacklogViewPermission && backlogFilter === 'none'}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Autocomplete
            options={sprintOptions}
            getOptionLabel={(option) => option.name}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <li key={key} {...otherProps}>
                  <Typography variant="body2">{option.name}</Typography>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filtrer par sprint"
                variant="outlined"
                sx={{ bgcolor: 'white' }}
              />
            )}
            value={
              sprintFilter === 'all'
                ? { id: 'all', name: 'Tous les sprints' }
                : sprintFilter === 'none'
                ? { id: 'none', name: 'Aucun sprint' }
                : (sprints || []).find((s) => s.id === sprintFilter) || { id: 'none', name: 'Aucun sprint' }
            }
            onChange={(event, value) => {
              if (value) {
                setSprintFilter(value.id);
                setSelectedSprint(value.id !== 'all' && value.id !== 'none' ? value : null);
              } else {
                setSprintFilter('none');
                setSelectedSprint(null);
              }
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={{ width: '100%' }}
            disabled={!hasSprintViewPermission && sprintFilter === 'none'}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Autocomplete
            options={[{ email: '', name: 'Tous les utilisateurs' }, ...projectUsers]}
            getOptionLabel={(option) => (option.email ? `${option.firstName} ${option.lastName} (${option.email})` : option.name)}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <li key={key} {...otherProps}>
                  {option.email ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{ bgcolor: getAvatarColor(option.name), width: 24, height: 24, fontSize: '0.7rem' }}
                      >
                        {generateInitials(option.name)}
                      </Avatar>
                      <Typography variant="body2">{`${option.firstName} ${option.lastName} (${option.email})`}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2">{option.name}</Typography>
                  )}
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filtrer par utilisateur"
                variant="outlined"
                sx={{ bgcolor: 'white' }}
              />
            )}
            value={projectUsers.find((user) => user.email === selectedUser) || { email: '', name: 'Tous les utilisateurs' }}
            onChange={handleUserFilterChange}
            isOptionEqualToValue={(option, value) => option.email === value.email}
            sx={{ width: '100%' }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel id="filter-priority-label">Filtrer par priorité</InputLabel>
            <MuiSelect
              labelId="filter-priority-label"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              input={<OutlinedInput label="Filtrer par priorité" />}
              sx={{ borderRadius: 2, bgcolor: 'white' }}
            >
              <MenuItem value="">Toutes les priorités</MenuItem>
              <MenuItem value="High">Haute</MenuItem>
              <MenuItem value="Medium">Moyenne</MenuItem>
              <MenuItem value="Low">Basse</MenuItem>
            </MuiSelect>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default KanbanFilters;