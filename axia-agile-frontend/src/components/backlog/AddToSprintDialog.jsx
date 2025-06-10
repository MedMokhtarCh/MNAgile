import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Fade,
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SprintIcon from '@mui/icons-material/Timeline';
import AddIcon from '@mui/icons-material/Add';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { FormDialogContent } from './theme';

// Palette de bleus cohérente avec le premier composant
const bluePalette = {
  primary: '#1976d2',
  primaryLight: '#42a5f5',
  primaryDark: '#1565c0',
  secondary: '#2196f3',
  secondaryLight: '#4fc3f7',
  secondaryDark: '#0d47a1',
  background: '#f5f9ff',
  paper: '#ffffff',
  border: '#e0e0e0',
  textPrimary: '#1a237e',
  textSecondary: '#5a8db8',
};

function AddToSprintDialog({ open, onClose, sprints, isSubmitting, error, handleAddToSprint }) {
  const [selectedSprintId, setSelectedSprintId] = useState('');

  const handleSprintChange = (event) => {
    setSelectedSprintId(event.target.value);
  };

  const handleSubmit = async () => {
    if (selectedSprintId) {
      try {
        await handleAddToSprint(selectedSprintId); // Assume handleAddToSprint returns a Promise
        onClose(); // Close dialog only after successful addition
      } catch (err) {
        // Error is handled via the `error` prop, no need to handle here
      }
    }
  };

  const selectedSprint = sprints.find(sprint => sprint.id === selectedSprintId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableBackdropClick
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          backgroundColor: bluePalette.background,
          border: `1px solid ${bluePalette.primaryLight}`,
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: `linear-gradient(135deg, ${bluePalette.primary} 0%, ${bluePalette.primaryDark} 100%)`,
          color: 'white',
          py: 3, // Increased padding for more spacing in header
          px: 3,
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PlaylistAddIcon sx={{ mr: 5, fontSize: 28, color: 'white' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'white' }}>
              Ajouter au sprint
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
              Sélectionnez le sprint de destination
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          disabled={isSubmitting}
          title="Fermer"
          sx={{ 
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.2)',
            '&:hover': { 
              backgroundColor: 'rgba(255,255,255,0.3)',
              transform: 'scale(1.1)',
            },
            '&:disabled': {
              color: 'rgba(255,255,255,0.5)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <CloseIcon />
        </IconButton>
        
        {isSubmitting && (
          <LinearProgress 
            sx={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white',
              }
            }} 
          />
        )}
      </DialogTitle>

      <FormDialogContent sx={{ p: 4, backgroundColor: bluePalette.background, minHeight: 250 }}> {/* Increased padding */}
        <Fade in={isSubmitting}>
          <Box sx={{ 
            display: isSubmitting ? 'flex' : 'none', 
            flexDirection: 'column',
            alignItems: 'center', 
            mb: 4, // Increased margin for spacing
            p: 2,
            backgroundColor: bluePalette.paper,
            borderRadius: 2,
            border: `1px solid ${bluePalette.primaryLight}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <CircularProgress 
              size={40} 
              sx={{ 
                color: bluePalette.primary,
                mb: 2,
              }} 
            />
            <Typography variant="body2" color={bluePalette.textPrimary} sx={{ fontWeight: 500 }}>
              Ajout en cours...
            </Typography>
          </Box>
        </Fade>

        {error && (
          <Fade in={!!error}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4, // Increased margin for spacing
                borderRadius: 2,
                backgroundColor: '#fef2f2',
                borderColor: '#f8d7da',
                color: '#991b1d',
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                  color: '#dc6c6e',
                }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {error}
              </Typography>
            </Alert>
          </Fade>
        )}

        <Card 
          sx={{ 
            mb: 3, // Increased margin for spacing
            borderRadius: 2,
            border: `1px solid ${bluePalette.primaryLight}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            backgroundColor: bluePalette.paper,
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
            transition: 'box-shadow 0.2s ease-in-out',
          }}
        >
          <CardContent sx={{ p: 4 }}> {/* Increased padding */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}> {/* Increased margin */}
              <SprintIcon sx={{ color: bluePalette.primary, mr: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: bluePalette.textPrimary }}>
                Sprint de destination
              </Typography>
            </Box>

            <FormControl 
              fullWidth 
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: bluePalette.paper,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: bluePalette.primary,
                    borderWidth: 2,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: bluePalette.primaryDark,
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: bluePalette.primaryDark,
                  fontWeight: 600,
                },
              }}
            >
              <InputLabel id="sprint-select-label" sx={{ fontWeight: 500, color: bluePalette.textSecondary }}>
                Sélectionner un sprint
              </InputLabel>
              <Select
                labelId="sprint-select-label"
                value={selectedSprintId}
                onChange={handleSprintChange}
                label="Sélectionner un sprint"
                disabled={isSubmitting}
                sx={{
                  '& .MuiSelect-select': {
                    py: 1.5,
                  }
                }}
              >
                {sprints.length === 0 ? (
                  <MenuItem value="" disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                      <Typography color={bluePalette.textSecondary} sx={{ fontStyle: 'italic' }}>
                        Aucun sprint disponible
                      </Typography>
                    </Box>
                  </MenuItem>
                ) : (
                  sprints.map((sprint) => (
                    <MenuItem 
                      key={sprint.id} 
                      value={sprint.id}
                      sx={{
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: '#f0f8ff',
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#e6f3ff',
                          '&:hover': {
                            backgroundColor: '#d6ecff',
                          },
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: bluePalette.primary,
                            mr: 2,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'white',
                          }}
                        >
                          {sprint.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: bluePalette.textPrimary }}>
                            {sprint.name}
                          </Typography>
                          {sprint.description && (
                            <Typography variant="caption" color={bluePalette.textSecondary}>
                              {sprint.description}
                            </Typography>
                          )}
                        </Box>
                        {sprint.status && (
                          <Chip
                            label={sprint.status}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: 24,
                              borderColor: bluePalette.primaryLight,
                              color: bluePalette.primaryDark,
                              backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {selectedSprint && (
          <Fade in={!!selectedSprint}>
            <Card 
              sx={{ 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${bluePalette.background} 0%, #e6f3ff 100%)`,
                border: `1px solid ${bluePalette.primaryLight}`,
                mt: 3, // Increased margin for spacing
              }}
            >
              <CardContent sx={{ p: 4 }}> {/* Increased padding */}
                <Typography variant="subtitle2" sx={{ 
                  color: bluePalette.primaryDark, 
                  fontWeight: 600, 
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <SprintIcon sx={{ mr: 1, fontSize: 18, color: bluePalette.primary }} />
                  Sprint sélectionné
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: bluePalette.textPrimary, mb: 1 }}>
                  {selectedSprint.name}
                </Typography>
                {selectedSprint.description && (
                  <Typography variant="body2" color={bluePalette.textSecondary}>
                    {selectedSprint.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Fade>
        )}
      </FormDialogContent>

      <DialogActions 
        sx={{ 
          p: 3, 
          backgroundColor: bluePalette.background,
          borderTop: `1px solid ${bluePalette.primaryLight}`,
          justifyContent: 'center', // Center the buttons
          gap: 2,
        }}
      >
        <Button 
          onClick={onClose} 
          disabled={isSubmitting}
          variant="outlined"
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 600,
            textTransform: 'none',
            borderColor: bluePalette.primaryLight,
            color: bluePalette.primaryDark,
            '&:hover': {
              borderColor: bluePalette.primary,
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
            '&:disabled': {
              opacity: 0.6,
            },
          }}
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedSprintId}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          sx={{
            background: !selectedSprintId 
              ? 'rgba(25, 118, 210, 0.1)' 
              : `linear-gradient(135deg, ${bluePalette.primary} 0%, ${bluePalette.primaryDark} 100%)`,
            borderRadius: 2,
            px: 4,
            py: 1,
            fontWeight: 600,
            textTransform: 'none',
            color: !selectedSprintId ? bluePalette.textSecondary : 'white',
            boxShadow: !selectedSprintId ? 'none' : '0 4px 12px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              background: !selectedSprintId 
                ? 'rgba(25, 118, 210, 0.1)' 
                : `linear-gradient(135deg, ${bluePalette.primaryDark} 0%, ${bluePalette.secondaryDark} 100%)`,
              transform: !selectedSprintId ? 'none' : 'translateY(-1px)',
              boxShadow: !selectedSprintId ? 'none' : '0 6px 20px rgba(25, 118, 210, 0.4)',
            },
            '&:disabled': {
              background: 'rgba(25, 118, 210, 0.1)',
              color: bluePalette.textSecondary,
              transform: 'none',
              boxShadow: 'none',
            },
            transition: 'all 0.2s ease-in-out',
            minWidth: 120,
          }}
        >
          {isSubmitting ? 'Ajout...' : 'Ajouter au sprint'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddToSprintDialog;