import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Checkbox,
  IconButton,
  Tab,
  Tabs,
  Divider,
  Avatar,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AvatarGroup,
  Tooltip,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Styles améliorés
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 8,
  marginBottom: theme.spacing(2),
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
}));

const TaskItem = styled(Box)(({ theme, isDragging }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  marginBottom: theme.spacing(1.5),
  backgroundColor: isDragging ? '#f0f7ff' : '#fff',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderColor: '#bbdefb',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: 8,
  padding: theme.spacing(1, 2),
  fontWeight: 500,
}));

const BacklogContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  overflow: 'hidden',
}));

const BacklogHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#f5f5f5',
  borderBottom: '1px solid #e0e0e0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const BacklogContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
}));

// Données simulées pour les membres d'équipe
const teamMembers = [
  { id: 1, name: 'Nermine', avatar: '/api/placeholder/40/40', initials: 'AM' },
  { id: 2, name: 'Mahdoui mahdoui', avatar: '/api/placeholder/40/40', initials: 'TD' },
  { id: 3, name: 'test test', avatar: '/api/placeholder/40/40', initials: 'SC' },
  { id: 4, name: 'dev nermine', avatar: '/api/placeholder/40/40', initials: 'ML' },
];

function BacklogPage() {
  // États principaux avec localStorage
  const [backlogs, setBacklogs] = useState(() => {
    const savedBacklogs = localStorage.getItem('backlogs');
    return savedBacklogs ? JSON.parse(savedBacklogs) : [
      {
        id: 1,
        name: "Fonctionnalités d'authentification",
        description: "Ensemble des fonctionnalités liées à l'authentification des utilisateurs",
        items: [
          { 
            id: 101, 
            title: 'Page de connexion', 
            description: 'Créer la page de connexion des utilisateurs',
            assignees: [1, 3]
          },
          { 
            id: 102, 
            title: 'Page d\'inscription', 
            description: 'Créer la page d\'inscription pour nouveaux utilisateurs',
            assignees: [3]
          },
          { 
            id: 103, 
            title: 'Récupération de mot de passe', 
            description: 'Fonctionnalité de récupération de mot de passe oublié',
            assignees: [2]
          }
        ]
      },
      {
        id: 2,
        name: "Tableau de bord utilisateur",
        description: "Fonctionnalités du tableau de bord principal de l'utilisateur",
        items: [
          { 
            id: 201, 
            title: 'Widget statistiques', 
            description: 'Créer le widget affichant les statistiques principales',
            assignees: [4]
          },
          { 
            id: 202, 
            title: 'Liste des activités récentes', 
            description: 'Affichage des dernières activités de l\'utilisateur',
            assignees: [1]
          }
        ]
      }
    ];
  });

  const [sprints, setSprints] = useState(() => {
    const savedSprints = localStorage.getItem('sprints');
    return savedSprints ? JSON.parse(savedSprints) : [
      {
        id: 1,
        name: "Sprint 1 - Authentication",
        startDate: "2025-03-01",
        endDate: "2025-03-14",
        isActive: false,
        items: [
          { 
            id: 101, 
            title: 'Page de connexion', 
            description: 'Créer la page de connexion des utilisateurs',
            status: 'in_progress',
            assignees: [1, 3]
          }
        ]
      },
      {
        id: 2,
        name: "Sprint 2 - Dashboard",
        startDate: "2025-03-15",
        endDate: "2025-03-28",
        isActive: false,
        items: []
      }
    ];
  });

  // Enregistrer dans localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('backlogs', JSON.stringify(backlogs));
  }, [backlogs]);

  useEffect(() => {
    localStorage.setItem('sprints', JSON.stringify(sprints));
  }, [sprints]);

  // États UI
  const [activeTab, setActiveTab] = useState('backlog');
  const [backlogDialogOpen, setBacklogDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [addToSprintDialogOpen, setAddToSprintDialogOpen] = useState(false);
  const [currentBacklog, setCurrentBacklog] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [selectedItemForSprint, setSelectedItemForSprint] = useState(null);
  const [selectedBacklogForSprint, setSelectedBacklogForSprint] = useState(null);

  // Handlers UI
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenBacklogDialog = (backlog = null) => {
    setCurrentBacklog(backlog);
    setBacklogDialogOpen(true);
  };

  const handleCloseBacklogDialog = () => {
    setBacklogDialogOpen(false);
    setCurrentBacklog(null);
  };

  const handleOpenItemDialog = (backlogId, item = null) => {
    setCurrentBacklog(backlogs.find(b => b.id === backlogId));
    setCurrentItem(item);
    setItemDialogOpen(true);
  };

  const handleCloseItemDialog = () => {
    setItemDialogOpen(false);
    setCurrentItem(null);
  };

  const handleOpenSprintDialog = () => {
    setSprintDialogOpen(true);
  };

  const handleCloseSprintDialog = () => {
    setSprintDialogOpen(false);
  };

  const handleOpenAddToSprintDialog = (backlogId, itemId) => {
    setSelectedBacklogForSprint(backlogId);
    setSelectedItemForSprint(itemId);
    setAddToSprintDialogOpen(true);
  };

  const handleCloseAddToSprintDialog = () => {
    setAddToSprintDialogOpen(false);
    setSelectedBacklogForSprint(null);
    setSelectedItemForSprint(null);
  };

  // Fonction pour modifier l'état actif d'un sprint
  const handleToggleSprintActive = (sprintId) => {
    setSprints(sprints.map(sprint => 
      sprint.id === sprintId 
        ? { ...sprint, isActive: !sprint.isActive } 
        : sprint
    ));
  };

  // Fonction pour ajouter un nouveau backlog
  const handleAddBacklog = (name, description) => {
    const newBacklog = {
      id: Math.max(0, ...backlogs.map(b => b.id)) + 1,
      name,
      description,
      items: []
    };
    
    setBacklogs([...backlogs, newBacklog]);
    handleCloseBacklogDialog();
  };

  // Fonction pour mettre à jour un backlog existant
  const handleUpdateBacklog = (id, name, description) => {
    setBacklogs(backlogs.map(backlog => 
      backlog.id === id ? { ...backlog, name, description } : backlog
    ));
    handleCloseBacklogDialog();
  };

  // Fonction pour ajouter un nouvel item au backlog
  const handleAddItem = (backlogId, title, description, assignees) => {
    const newItem = {
      id: Date.now(), // ID unique basé sur le timestamp
      title,
      description,
      assignees
    };
    
    setBacklogs(backlogs.map(backlog => 
      backlog.id === backlogId 
        ? { ...backlog, items: [...backlog.items, newItem] } 
        : backlog
    ));
    
    handleCloseItemDialog();
  };

  // Fonction pour mettre à jour un item existant
  const handleUpdateItem = (backlogId, itemId, title, description, assignees) => {
    setBacklogs(backlogs.map(backlog => 
      backlog.id === backlogId 
        ? { 
            ...backlog, 
            items: backlog.items.map(item => 
              item.id === itemId 
                ? { ...item, title, description, assignees } 
                : item
            ) 
          } 
        : backlog
    ));
    
    handleCloseItemDialog();
  };

  // Fonction pour supprimer un item du backlog
  const handleDeleteItem = (backlogId, itemId) => {
    setBacklogs(backlogs.map(backlog => 
      backlog.id === backlogId 
        ? { ...backlog, items: backlog.items.filter(item => item.id !== itemId) } 
        : backlog
    ));
  };

  // Fonction pour ajouter un item à un sprint
  const handleAddToSprint = (sprintId) => {
    // Trouver l'item dans le backlog
    const backlog = backlogs.find(b => b.id === selectedBacklogForSprint);
    if (!backlog) return;
    
    const item = backlog.items.find(i => i.id === selectedItemForSprint);
    if (!item) return;
    
    // Ajouter l'item au sprint avec statut initial
    const newItem = { ...item, status: 'to_do' };
    
    setSprints(sprints.map(sprint => 
      sprint.id === sprintId 
        ? { ...sprint, items: [...sprint.items, newItem] } 
        : sprint
    ));
    
    handleCloseAddToSprintDialog();
  };

  // Fonction pour créer un nouveau sprint
  const handleCreateSprint = (name, startDate, endDate) => {
    const newSprint = {
      id: Math.max(0, ...sprints.map(s => s.id)) + 1,
      name,
      startDate,
      endDate,
      isActive: false,
      items: []
    };
    
    setSprints([...sprints, newSprint]);
    handleCloseSprintDialog();
  };

  // Fonction pour mettre à jour le statut d'un item dans un sprint
  const handleUpdateSprintItemStatus = (sprintId, itemId, newStatus) => {
    setSprints(sprints.map(sprint => 
      sprint.id === sprintId 
        ? { 
            ...sprint, 
            items: sprint.items.map(item => 
              item.id === itemId 
                ? { ...item, status: newStatus } 
                : item
            ) 
          } 
        : sprint
    ));
  };

  // Rendu d'un item de backlog
  const renderBacklogItem = (backlogId, item) => (
    <TaskItem key={item.id}>
      <DragIndicatorIcon sx={{ color: '#bdbdbd', mr: 1 }} />
      
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1">{item.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {item.description}
        </Typography>
      </Box>
      
      <AvatarGroup max={3} sx={{ mr: 1 }}>
        {item.assignees.map(id => {
          const member = teamMembers.find(m => m.id === id);
          return member ? (
            <Tooltip key={id} title={member.name}>
              <Avatar alt={member.name} src={member.avatar}>
                {member.initials}
              </Avatar>
            </Tooltip>
          ) : null;
        })}
      </AvatarGroup>
      
      <Box sx={{ display: 'flex' }}>
        <IconButton 
          size="small" 
          onClick={() => handleOpenAddToSprintDialog(backlogId, item.id)}
          title="Ajouter au sprint"
        >
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => handleOpenItemDialog(backlogId, item)}
          title="Modifier"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => handleDeleteItem(backlogId, item.id)}
          title="Supprimer"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </TaskItem>
  );

  // Rendu d'un item de sprint
  const renderSprintItem = (sprintId, item) => (
    <TaskItem key={item.id}>
      <DragIndicatorIcon sx={{ color: '#bdbdbd', mr: 1 }} />
      
      <Checkbox
        checked={item.status === 'done'}
        onChange={() => handleUpdateSprintItemStatus(
          sprintId, 
          item.id, 
          item.status === 'done' ? 'in_progress' : 'done'
        )}
      />
      
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1">{item.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {item.description}
        </Typography>
      </Box>
      
      <Chip 
        label={item.status === 'to_do' ? 'À faire' : item.status === 'in_progress' ? 'En cours' : 'Terminé'}
        size="small"
        color={item.status === 'done' ? 'success' : item.status === 'in_progress' ? 'primary' : 'default'}
        sx={{ mr: 1 }}
      />
      
      <AvatarGroup max={3} sx={{ mr: 1 }}>
        {item.assignees.map(id => {
          const member = teamMembers.find(m => m.id === id);
          return member ? (
            <Tooltip key={id} title={member.name}>
              <Avatar alt={member.name} src={member.avatar}>
                {member.initials}
              </Avatar>
            </Tooltip>
          ) : null;
        })}
      </AvatarGroup>
      
      <IconButton 
        size="small" 
        title="Modifier"
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </TaskItem>
  );

  // Rendu du contenu de l'onglet Backlog
  const renderBacklogTab = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Backlogs du Produit</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenBacklogDialog()}
        >
          Nouveau Backlog
        </Button>
      </Box>

      {backlogs.map(backlog => (
        <BacklogContainer key={backlog.id}>
          <BacklogHeader>
            <Box>
              <Typography variant="h6">{backlog.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {backlog.description}
              </Typography>
            </Box>
            <Box>
              <IconButton 
                size="small" 
                onClick={() => handleOpenBacklogDialog(backlog)}
                title="Modifier le backlog"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenItemDialog(backlog.id)}
                size="small"
                sx={{ ml: 1 }}
              >
                Ajouter Item
              </Button>
            </Box>
          </BacklogHeader>
          
          <BacklogContent>
            {backlog.items.length > 0 ? (
              backlog.items.map(item => renderBacklogItem(backlog.id, item))
            ) : (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Aucun item dans ce backlog. Cliquez sur "Ajouter Item" pour commencer.
              </Typography>
            )}
          </BacklogContent>
        </BacklogContainer>
      ))}
    </Box>
  );

  // Rendu du contenu de l'onglet Sprints
  const renderSprintsTab = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Sprints</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenSprintDialog}
        >
          Nouveau Sprint
        </Button>
      </Box>

      {sprints.map(sprint => (
        <StyledPaper key={sprint.id}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6">{sprint.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {sprint.startDate} à {sprint.endDate}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ mr: 2 }}>
                {sprint.items.length} tâches • {sprint.items.filter(i => i.status === 'done').length} terminées
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={sprint.isActive}
                    onChange={() => handleToggleSprintActive(sprint.id)}
                    color="primary"
                  />
                }
                label="Activer"
              />
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {sprint.items.length > 0 ? (
            sprint.items.map(item => renderSprintItem(sprint.id, item))
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Aucune tâche dans ce sprint. Ajoutez des tâches depuis le backlog.
            </Typography>
          )}
        </StyledPaper>
      ))}
    </Box>
  );

  // Boîte de dialogue pour créer/modifier un backlog
  const renderBacklogDialog = () => (
    <Dialog open={backlogDialogOpen} onClose={handleCloseBacklogDialog} maxWidth="sm" fullWidth>
      <DialogTitle>
        {currentBacklog ? 'Modifier le backlog' : 'Créer un nouveau backlog'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="backlog-name"
          label="Nom du backlog"
          fullWidth
          variant="outlined"
          defaultValue={currentBacklog?.name || ''}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          id="backlog-description"
          label="Description"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          defaultValue={currentBacklog?.description || ''}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseBacklogDialog}>Annuler</Button>
        <Button 
          variant="contained" 
          onClick={() => {
            const nameEl = document.getElementById('backlog-name');
            const descEl = document.getElementById('backlog-description');
            
            if (currentBacklog) {
              handleUpdateBacklog(currentBacklog.id, nameEl.value, descEl.value);
            } else {
              handleAddBacklog(nameEl.value, descEl.value);
            }
          }}
        >
          {currentBacklog ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Boîte de dialogue pour créer/modifier un item de backlog
  const renderItemDialog = () => (
    <Dialog open={itemDialogOpen} onClose={handleCloseItemDialog} maxWidth="sm" fullWidth>
      <DialogTitle>
        {currentItem ? 'Modifier l\'item' : 'Ajouter un nouvel item'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="item-title"
          label="Titre"
          fullWidth
          variant="outlined"
          defaultValue={currentItem?.title || ''}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          id="item-description"
          label="Description"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          defaultValue={currentItem?.description || ''}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth>
          <InputLabel id="assignees-label">Membres assignés</InputLabel>
          <Select
            labelId="assignees-label"
            id="item-assignees"
            multiple
            label="Membres assignés"
            defaultValue={currentItem?.assignees || []}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const member = teamMembers.find(m => m.id === value);
                  return (
                    <Chip 
                      key={value} 
                      label={member?.name} 
                      size="small"
                    />
                  );
                })}
              </Box>
            )}
          >
            {teamMembers.map((member) => (
              <MenuItem key={member.id} value={member.id}>
                <Checkbox checked={(currentItem?.assignees || []).indexOf(member.id) > -1} />
                {member.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseItemDialog}>Annuler</Button>
        <Button 
          variant="contained" 
          onClick={() => {
            const titleEl = document.getElementById('item-title');
            const descEl = document.getElementById('item-description');
            const membersEl = document.getElementById('item-assignees');
            
            // Récupérer les membres sélectionnés
            const selectedOptions = Array.from(membersEl.querySelectorAll('input[type="checkbox"]:checked'));
            const selectedMembers = selectedOptions.map(option => 
              parseInt(option.closest('li').getAttribute('data-value'))
            );
            
            if (currentItem) {
              handleUpdateItem(
                currentBacklog.id, 
                currentItem.id, 
                titleEl.value, 
                descEl.value, 
                selectedMembers.length ? selectedMembers : currentItem.assignees || []
              );
            } else {
              handleAddItem(
                currentBacklog.id, 
                titleEl.value, 
                descEl.value, 
                selectedMembers
              );
            }
          }}
        >
          {currentItem ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Boîte de dialogue pour créer un nouveau sprint
  const renderSprintDialog = () => (
    <Dialog open={sprintDialogOpen} onClose={handleCloseSprintDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Créer un nouveau sprint</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="sprint-name"
          label="Nom du sprint"
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            id="sprint-start-date"
            label="Date de début"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            defaultValue={new Date().toISOString().split('T')[0]}
            sx={{ mb: 2 }}
          />
          <TextField
            id="sprint-end-date"
            label="Date de fin"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            defaultValue={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            sx={{ mb: 2 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseSprintDialog}>Annuler</Button>
        <Button 
          variant="contained" 
          onClick={() => {
            const nameEl = document.getElementById('sprint-name');
            const startDateEl = document.getElementById('sprint-start-date');
            const endDateEl = document.getElementById('sprint-end-date');
            
            handleCreateSprint(
              nameEl.value, 
              startDateEl.value, 
              endDateEl.value
            );
          }}
        >
          Créer
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Boîte de dialogue pour ajouter un item à un sprint
  const renderAddToSprintDialog = () => (
    <Dialog open={addToSprintDialogOpen} onClose={handleCloseAddToSprintDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Ajouter au sprint</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Sélectionnez le sprint auquel vous souhaitez ajouter cet item :
        </Typography>
        <List>
          {sprints.map(sprint => (
            <ListItem 
              key={sprint.id} 
              button 
              onClick={() => handleAddToSprint(sprint.id)}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
            >
              <ListItemIcon>
                <TimelineIcon />
              </ListItemIcon>
              <ListItemText 
                primary={sprint.name} 
                secondary={`${sprint.startDate} à ${sprint.endDate}`} 
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseAddToSprintDialog}>Annuler</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Tabs simplifiés - Appbar supprimée */}
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ 
          borderBottom: '1px solid #e0e0e0',
          '& .MuiTab-root': { textTransform: 'none', minWidth: 120 }
        }}
      >
        <Tab label="Backlog" icon={<ListAltIcon />} iconPosition="start" value="backlog" />
        <Tab label="Sprints" icon={<TimelineIcon />} iconPosition="start" value="sprints" />
      </Tabs>

      {/* Contenu principal */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f9fafb' }}>
        {activeTab === 'backlog' && renderBacklogTab()}
        {activeTab === 'sprints' && renderSprintsTab()}
      </Box>

      {/* Boîtes de dialogue */}
      {renderBacklogDialog()}
      {renderItemDialog()}
      {renderSprintDialog()}
      {renderAddToSprintDialog()}
    </Box>
  );
}

export default BacklogPage;