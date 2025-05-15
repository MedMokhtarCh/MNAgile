import React from 'react';
import { Box, Autocomplete, TextField, FormControl, InputLabel, Select as MuiSelect, OutlinedInput, MenuItem, Typography, Avatar, Paper, Grid } from '@mui/material';

function KanbanFilters({
  backlogs,
  projectUsers,
  selectedUser,
  selectedPriority,
  backlogFilter,
  selectedBacklog,
  setBacklogFilter,
  setSelectedBacklog,
  setSelectedPriority,
  handleUserFilterChange,
  getAvatarColor,
  generateInitials,
  setDialogMode,
  setFormValues,
  setDialogOpen,
}) {
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
        <Grid item xs={12} sm={4}>
          <Autocomplete
            options={[{ id: 'all', name: 'Tous les backlogs' }, { id: 'none', name: 'Aucun backlog' }, ...backlogs]}
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
                : backlogs.find((b) => b.id === backlogFilter) || { id: 'all', name: 'Tous les backlogs' }
            }
            onChange={(event, value) => {
              if (value) {
                setBacklogFilter(value.id);
                setSelectedBacklog(value.id !== 'all' && value.id !== 'none' ? value : null);
              } else {
                setBacklogFilter('all');
                setSelectedBacklog(null);
              }
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={{ width: '100%' }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
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
        <Grid item xs={12} sm={4}>
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