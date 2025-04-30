import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Chip,
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  AppBar,
  Toolbar,
  IconButton,
  Fade,
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupIcon from '@mui/icons-material/Group';
import InputUserAssignment from '../common/InputUserAssignment';


// Styled Components
const StepperContainer = styled(Box)(({ theme }) => ({
  margin: '24px 0',
  padding: '12px 16px',
  backgroundColor: theme.palette.background.paper,
  borderRadius: 12,
  boxShadow: theme.shadows[2],
}));

const FormSection = styled(Box)(({ theme }) => ({
  padding: '24px 16px',
  minHeight: '450px',
  width: '100%',
  maxWidth: 800,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
  backgroundColor: theme.palette.background.default,
  borderRadius: 12,
  boxShadow: theme.shadows[1],
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginBottom: 12,
  color: theme.palette.text.primary,
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -6,
    left: 0,
    width: 50,
    height: 4,
    backgroundColor: theme.palette.primary.main,
    borderRadius: 2,
  },
}));

const FormButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  padding: '10px 28px',
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 14,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'light'
        ? theme.palette.primary.dark
        : theme.palette.primary.light,
    transform: 'translateY(-1px)',
  },
  '&:active': {
    backgroundColor: theme.palette.primary.main,
    transform: 'translateY(0)',
  },
  '&:focus': {
    backgroundColor: theme.palette.primary.main,
    outline: `2px solid ${theme.palette.primary.light}`,
  },
  '&.MuiButton-contained': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));

// Transition pour l'animation du dialogue
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />;
});

const ProjectFormStepper = ({
  open,
  onClose,
  isEditing,
  projectForm,
  setProjectForm,
  activeStep,
  steps,
  handleBack,
  handleNext,
  handleSaveProject,
  registeredUsers,
  projectManagers,
  setProjectManagers,
  observers, // Added observers prop
  setObservers, // Corrected to setObservers
  productOwners,
  setProductOwners,
  scrumMasters,
  setScrumMasters,
  developers,
  setDevelopers,
  testers,
  setTesters,
  getAvatarColor,
  generateInitials,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Helper function to get user display name
  const getUserDisplayName = (user) => {
    // Prioritize nom and prenom, fallback to name, then email
    if (user.nom && user.prenom) {
      return `${user.nom} ${user.prenom}`;
    }
    return user.name || user.email || 'Utilisateur inconnu';
  };

  // Fonction pour rendre des chips d'utilisateurs à partir d'un tableau d'objets utilisateur
  const renderUserChips = (users) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {users && users.length > 0 ? (
        users.map((user) => (
          <Chip
            key={user.email || user.id}
            avatar={
              <Avatar sx={{ bgcolor: getAvatarColor(getUserDisplayName(user)) }}>
                {generateInitials(getUserDisplayName(user))}
              </Avatar>
            }
            label={getUserDisplayName(user)}
            size="small"
            sx={{ borderRadius: 16 }}
          />
        ))
      ) : (
        <Typography variant="body2" color="text.secondary">
          Aucun sélectionné
        </Typography>
      )}
    </Box>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <FormSection>
            <Box display="flex" alignItems="center" mb={2}>
              <DescriptionIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
              <SectionTitle variant="h6">Informations du Projet</SectionTitle>
            </Box>
            <TextField
              fullWidth
              label="Nom du Projet"
              placeholder="Entrer le nom du projet"
              variant="outlined"
              value={projectForm.title}
              onChange={(e) =>
                setProjectForm({ ...projectForm, title: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Description"
              placeholder="Entrer la description du projet"
              multiline
              rows={5}
              variant="outlined"
              value={projectForm.description}
              onChange={(e) =>
                setProjectForm({ ...projectForm, description: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Méthode Agile</InputLabel>
              <Select
                label="Méthode Agile"
                value={projectForm.method}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, method: e.target.value })
                }
                variant="outlined"
              >
                <MenuItem value="scrum">Scrum</MenuItem>
                <MenuItem value="scrumban">Scrumban</MenuItem>
                <MenuItem value="kanban">Kanban</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Date de Début"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={projectForm.startDate ? projectForm.startDate.split('T')[0] : ''}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  startDate: new Date(e.target.value).toISOString(),
                })
              }
            />
            <TextField
              fullWidth
              label="Date de Fin"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={projectForm.endDate ? projectForm.endDate.split('T')[0] : ''}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  endDate: new Date(e.target.value).toISOString(),
                })
              }
            />
          </FormSection>
        );
      case 1:
        return (
          <FormSection>
            <Box display="flex" alignItems="center" mb={2}>
              <GroupIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
              <SectionTitle variant="h6">Équipe du Projet</SectionTitle>
            </Box>
            <InputUserAssignment
              options={registeredUsers}
              value={projectManagers}
              onChange={(event, value) => setProjectManagers(value)}
              label="Chefs de Projet"
              placeholder="Sélectionner les chefs de projet"
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
              getOptionLabel={getUserDisplayName} // Added to ensure consistent name display
            />
            <InputUserAssignment
              options={registeredUsers}
              value={productOwners}
              onChange={(event, value) => setProductOwners(value)}
              label="Product Owners"
              placeholder="Sélectionner les product owners"
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
              getOptionLabel={getUserDisplayName}
            />
            <InputUserAssignment
              options={registeredUsers}
              value={scrumMasters}
              onChange={(event, value) => setScrumMasters(value)}
              label="Scrum Masters"
              placeholder="Sélectionner les scrum masters"
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
              getOptionLabel={getUserDisplayName}
            />
            <InputUserAssignment
              options={registeredUsers}
              value={developers}
              onChange={(event, value) => setDevelopers(value)}
              label="Développeurs"
              placeholder="Sélectionner les développeurs"
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
              getOptionLabel={getUserDisplayName}
            />
            <InputUserAssignment
              options={registeredUsers}
              value={testers}
              onChange={(event, value) => setTesters(value)}
              label="Testeurs"
              placeholder="Sélectionner les testeurs"
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
              getOptionLabel={getUserDisplayName}
            />
            <InputUserAssignment
              options={registeredUsers}
              value={observers}
              onChange={(event, value) => setObservers(value)} // Corrected to setObservers
              label="Observateurs"
              placeholder="Sélectionner les observateurs"
              getAvatarColor={getAvatarColor}
              generateInitials={generateInitials}
              getOptionLabel={getUserDisplayName}
            />
          </FormSection>
        );
      case 2:
        return (
          <FormSection>
            <Box display="flex" alignItems="center" mb={2}>
              <SaveIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
              <SectionTitle variant="h6">Récapitulatif du Projet</SectionTitle>
            </Box>
            <Paper
              elevation={4}
              sx={{ p: 3, borderRadius: 12, backgroundColor: theme.palette.background.paper }}
            >
              <Typography variant="h6" color="primary" gutterBottom>
                Détails du Projet
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="medium">
                  Nom: {projectForm.title || 'Non spécifié'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                  Description: {projectForm.description || 'Non spécifié'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Méthode Agile: {projectForm.method ? projectForm.method.charAt(0).toUpperCase() + projectForm.method.slice(1) : 'Non spécifié'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Date de Début: {projectForm.startDate ? new Date(projectForm.startDate).toLocaleDateString('fr-FR') : 'Non spécifié'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Date de Fin: {projectForm.endDate ? new Date(projectForm.endDate).toLocaleDateString('fr-FR') : 'Non spécifié'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" color="primary" gutterBottom>
                Équipe
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Chefs de Projet:
                </Typography>
                {renderUserChips(projectManagers)}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Product Owners:
                </Typography>
                {renderUserChips(productOwners)}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Scrum Masters:
                </Typography>
                {renderUserChips(scrumMasters)}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Développeurs:
                </Typography>
                {renderUserChips(developers)}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Testeurs:
                </Typography>
                {renderUserChips(testers)}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Observateurs:
                </Typography>
                {renderUserChips(observers)}
              </Box>
            </Paper>
          </FormSection>
        );
      default:
        return 'Étape inconnue';
    }
  };

  return (
    <Dialog
      fullScreen={isMobile}
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Transition}
    >
      <AppBar
        position="relative"
        color="transparent"
        elevation={0}
        sx={{ bgcolor: theme.palette.background.paper, boxShadow: theme.shadows[1] }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" fontWeight={600}>
            {isEditing ? 'Modifier Projet' : 'Créer Projet'}
          </Typography>
        </Toolbar>
      </AppBar>
      <DialogContent sx={{ p: { xs: 3, sm: 5 }, bgcolor: theme.palette.background.default }}>
        <StepperContainer>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontWeight: 500,
                      fontSize: { xs: 12, sm: 14 },
                      color:
                        activeStep >= steps.indexOf(label)
                          ? theme.palette.primary.main
                          : theme.palette.text.secondary,
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </StepperContainer>
        <Fade in={true}>
          <Box>{getStepContent(activeStep)}</Box>
        </Fade>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 3, sm: 5 }, pt: 0, bgcolor: theme.palette.background.default }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <FormButton
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ChevronLeftIcon />}
            variant="outlined"
            sx={{ minWidth: 130 }}
          >
            Précédent
          </FormButton>
          {activeStep === steps.length - 1 ? (
            <FormButton
              onClick={handleSaveProject}
              variant="contained"
              startIcon={<SaveIcon />}
              color="primary"
              sx={{ minWidth: 130, '&:hover': { backgroundColor: theme.palette.primary.dark } }}
            >
              {isEditing ? 'Enregistrer' : 'Créer'}
            </FormButton>
          ) : (
            <FormButton
              onClick={handleNext}
              variant="contained"
              endIcon={<ChevronRightIcon />}
              color="primary"
              sx={{ minWidth: 130, '&:hover': { backgroundColor: theme.palette.primary.dark } }}
            >
              Suivant
            </FormButton>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectFormStepper;