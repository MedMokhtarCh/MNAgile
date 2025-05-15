import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EmojiPicker from 'emoji-picker-react';
import {
  Box, Typography, TextField, Button, Avatar, Paper, Divider, IconButton,
  List, ListItem, ListItemText, AppBar, Toolbar, useMediaQuery,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
  InputAdornment, Popover, Chip, Autocomplete, Tooltip, AvatarGroup, Drawer,
  Menu, MenuItem,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  fetchChannels,
  fetchChannelMessages,
  fetchChannelMembers,
  sendMessage,
  createChannel,
  deleteChannel,
  updateChannel,
  initializeSignalR,
  setSelectedChannel,
  selectChannels,
  selectMessages,
  selectConnectionStatus,
  selectChatError,
  selectChannelMembers,
} from '../store/slices/chatSlice';
import { fetchCurrentUser } from '../store/slices/authSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import InputUserAssignment from '../components/common/InputUserAssignment';

// Styled Components
const ChatContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  backgroundColor: '#e3f2fd',
  overflow: 'hidden',
});

const SidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: 260,
  background: 'linear-gradient(180deg, #90caf9 0%, #bbdefb 100%)',
  color: '#1e3a8a',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  transition: theme.transitions.create(['left'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.standard,
  }),
  [theme.breakpoints.down('md')]: {
    position: 'fixed',
    zIndex: 1200,
    left: open ? 0 : -260,
    top: 0,
    height: '100%',
  },
}));

const MembersDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    backgroundColor: '#e3f2fd',
  },
}));

const MainArea = styled(Box)({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const ChannelItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ theme, active }) => ({
  borderRadius: 6,
  margin: '4px 8px',
  padding: '8px 12px',
  cursor: 'pointer',
  backgroundColor: active ? 'rgba(30, 58, 138, 0.2)' : 'transparent',
  transition: theme.transitions.create(['background-color'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    backgroundColor: 'rgba(30, 58, 138, 0.15)',
  },
  '& .MuiListItemText-primary': {
    fontWeight: active ? 600 : 400,
    fontSize: '0.9rem',
    color: '#1e3a8a',
  },
}));

const MessageContainer = styled(Box)({
  flexGrow: 1,
  padding: '16px 20px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f0f7ff',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  '-ms-overflow-style': 'none',
  scrollbarWidth: 'none',
});

const InputArea = styled(Box)({
  padding: '12px 16px',
  borderTop: '1px solid #bbdefb',
  backgroundColor: '#ffffff',
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 10,
    backgroundColor: '#f0f7ff',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.light,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#42a5f5',
      borderWidth: '2px',
    },
  },
  '& .MuiInputBase-input': {
    padding: '10px 12px',
    fontSize: '0.9rem',
  },
}));

const SendButton = styled(Button)(({ theme }) => ({
  borderRadius: 10,
  padding: '8px 20px',
  marginLeft: '12px',
  background: 'linear-gradient(135deg, #90caf9 0%, #42a5f5 100%)',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[2],
    background: 'linear-gradient(135deg, #bbdefb 0%, #64b5f6 100%)',
  },
}));

const FileAttachment = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f0f7ff',
  borderRadius: 6,
  padding: '6px 10px',
  marginTop: '6px',
  marginRight: '6px',
  border: '1px solid #bbdefb',
  maxWidth: 'fit-content',
});

const MemberItem = styled(ListItem)(({ theme }) => ({
  borderRadius: 6,
  margin: '4px 0',
  padding: '8px 12px',
  '&:hover': {
    backgroundColor: '#bbdefb',
  },
}));

// Utility Functions
const formatTimestamp = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffHours < 48) {
    return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase();
};

const getFileIcon = (fileName) => {
  if (fileName.endsWith('.pdf')) return <PictureAsPdfIcon color="error" />;
  if (/\.(jpg|jpeg|png|gif)$/i.test(fileName)) return <ImageIcon color="primary" />;
  if (/\.(doc|docx)$/i.test(fileName)) return <DescriptionIcon color="primary" />;
  return <InsertDriveFileIcon color="action" />;
};

const getAvatarColor = (name) => {
  const colors = ['#42a5f5', '#90caf9', '#64b5f6', '#bbdefb'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Dialog for Creating a Channel
const CreateChannelDialog = ({ open, handleClose, handleCreate, users, currentUser }) => {
  const [channelName, setChannelName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleSubmit = () => {
    handleCreate({
      name: channelName,
      type: 'channel',
      MemberIds: [...selectedUsers.map((user) => user.id), currentUser?.id].filter(Boolean),
    });
    setChannelName('');
    setSelectedUsers([]);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Créer un nouveau canal
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Nom du canal"
          fullWidth
          variant="outlined"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <InputUserAssignment
          options={users.filter((user) => user.id !== currentUser?.id)}
          value={selectedUsers}
          onChange={(event, newValue) => setSelectedUsers(newValue)}
          label="Ajouter des membres (optionnel)"
          placeholder="Rechercher des utilisateurs..."
          getAvatarColor={getAvatarColor}
          generateInitials={getInitials}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={!channelName.trim()}>
          Créer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Dialog for Updating a Channel
const UpdateChannelDialog = ({ open, handleClose, handleUpdate, users, currentUser, channel }) => {
  const [channelName, setChannelName] = useState(channel?.name || '');
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    if (channel) {
      setChannelName(channel.name);
      setSelectedUsers([]);
    }
  }, [channel]);

  const handleSubmit = () => {
    handleUpdate({
      name: channelName,
      MemberIdsToAdd: selectedUsers.map((user) => user.id),
    });
    setChannelName('');
    setSelectedUsers([]);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Modifier le canal</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Nom du canal"
          fullWidth
          variant="outlined"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
        />
        <InputUserAssignment
          options={users.filter((user) => 
            user.id !== currentUser?.id && 
            !channel?.memberIds?.includes(user.id)
          )}
          value={selectedUsers}
          onChange={(event, newValue) => setSelectedUsers(newValue)}
          label="Ajouter des membres (optionnel)"
          placeholder="Rechercher des utilisateurs..."
          getAvatarColor={getAvatarColor}
          generateInitials={getInitials}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={!channelName.trim()}>
          Mettre à jour
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Dialog for Confirming Channel Deletion
const DeleteChannelDialog = ({ open, handleClose, handleConfirm, channelName }) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Confirmer la suppression
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Voulez-vous vraiment supprimer le canal <strong>#{channelName}</strong> ? Cette action est irréversible.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Annuler</Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
        >
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Member List Drawer
const MemberListDrawer = ({ open, onClose, members, currentUserId }) => {
  return (
    <MembersDrawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Membres du canal</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List>
          {members.map((member) => (
            <MemberItem key={member.id}>
              <Avatar sx={{ bgcolor: member.id === currentUserId ? '#42a5f5' : '#90caf9', mr: 2 }}>
                {getInitials(`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Utilisateur')}
              </Avatar>
              <ListItemText
                primary={`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Utilisateur inconnu'}
                secondary={member.id === currentUserId ? 'Vous' : member.email || ''}
              />
              {member.id === currentUserId && (
                <Chip
                  size="small"
                  label="Vous"
                  color="primary"
                  sx={{ ml: 1 }}
                />
              )}
            </MemberItem>
          ))}
          {members.length === 0 && (
            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mt: 2 }}>
              Aucun membre trouvé
            </Typography>
          )}
        </List>
      </Box>
    </MembersDrawer>
  );
};

// Main Component
const GroupDiscussion = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();

  // State
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [messageInput, setMessageInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [createChannelDialogOpen, setCreateChannelDialogOpen] = useState(false);
  const [updateChannelDialogOpen, setUpdateChannelDialogOpen] = useState(false);
  const [deleteChannelDialogOpen, setDeleteChannelDialogOpen] = useState(false);
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedChannelForMenu, setSelectedChannelForMenu] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Redux Selectors
  const channels = useSelector(selectChannels);
  const selectedChannel = useSelector((state) => state.chat.selectedChannel);
  const messages = useSelector((state) =>
    selectedChannel ? selectMessages(state, selectedChannel.id) : []
  );
  const connectionStatus = useSelector(selectConnectionStatus);
  const chatError = useSelector(selectChatError);
  const currentUser = useSelector((state) => state.auth.currentUser);
  const users = useSelector((state) => state.users.users);
  const channelMembers = useSelector((state) =>
    selectedChannel ? selectChannelMembers(state, selectedChannel.id) : []
  );

  // Initialization
  useEffect(() => {
    dispatch(fetchChannels());
    dispatch(fetchCurrentUser());
    dispatch(fetchUsers({}));
    dispatch(initializeSignalR());
  }, [dispatch]);

  // Fetch Messages and Members
  useEffect(() => {
    if (selectedChannel?.id) {
      dispatch(fetchChannelMessages(selectedChannel.id));
      dispatch(fetchChannelMembers(selectedChannel.id));
    }
  }, [dispatch, selectedChannel]);

  // Handle Errors
  useEffect(() => {
    if (chatError) {
      setErrorSnackbarOpen(true);
    }
  }, [chatError]);

  // Scroll to Bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handlers
  const handleSelectChannel = (channel) => {
    dispatch(setSelectedChannel(channel));
    setSidebarOpen(false);
  };

  const handleCreateChannel = async (channelData) => {
    try {
      await dispatch(createChannel(channelData)).unwrap();
      setCreateChannelDialogOpen(false);
    } catch (error) {
      setErrorSnackbarOpen(true);
    }
  };

  const handleUpdateChannel = async (channelData) => {
    if (selectedChannelForMenu) {
      try {
        await dispatch(updateChannel({
          channelId: selectedChannelForMenu.id,
          channelData
        })).unwrap();
        setUpdateChannelDialogOpen(false);
        setSelectedChannelForMenu(null);
      } catch (error) {
        setErrorSnackbarOpen(true);
      }
    }
  };

  const handleDeleteChannel = async () => {
    if (selectedChannelForMenu) {
      try {
        await dispatch(deleteChannel(selectedChannelForMenu.id)).unwrap();
        setDeleteChannelDialogOpen(false);
        setMenuAnchorEl(null);
        setSelectedChannelForMenu(null);
      } catch (error) {
        setErrorSnackbarOpen(true);
      }
    }
  };

  const handleOpenDeleteDialog = () => {
    setDeleteChannelDialogOpen(true);
    setMenuAnchorEl(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteChannelDialogOpen(false);
    setSelectedChannelForMenu(null);
  };

  const handleSendMessage = async () => {
    if (selectedChannel && (messageInput.trim() || attachedFiles.length > 0)) {
      try {
        await dispatch(
          sendMessage({
            channelId: selectedChannel.id,
            content: messageInput.trim(),
            files: attachedFiles,
          })
        ).unwrap();
        setMessageInput('');
        setAttachedFiles([]);
      } catch (error) {
        setErrorSnackbarOpen(true);
      }
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelection = (event) => {
    setAttachedFiles(Array.from(event.target.files));
  };

  const handleEmojiClick = (emojiData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
    setEmojiAnchorEl(null);
  };

  const toggleMembersDrawer = () => {
    setMembersDrawerOpen(!membersDrawerOpen);
  };

  const handleMenuOpen = (event, channel) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedChannelForMenu(channel);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedChannelForMenu(null);
  };

  // Render Sidebar
  const renderSidebar = () => (
    <SidebarContainer open={sidebarOpen}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
          Discussion de groupe
        </Typography>
        {isMobile && (
          <IconButton size="small" onClick={() => setSidebarOpen(false)} sx={{ color: '#1e3a8a' }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(30, 58, 138, 0.15)' }} />
      <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
        <Box sx={{ p: 2 }}>
          <Button
            startIcon={<GroupAddIcon />}
            variant="outlined"
            fullWidth
            sx={{ mb: 2, color: '#1e3a8a', borderColor: '#1e3a8a' }}
            onClick={() => setCreateChannelDialogOpen(true)}
          >
            Créer un canal
          </Button>
          <List dense>
            {channels.map((channel) => (
              <ChannelItem
                key={channel.id}
                active={selectedChannel?.id === channel.id}
                onClick={() => handleSelectChannel(channel)}
                secondaryAction={
                  channel.creatorId === currentUser?.id && (
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleMenuOpen(e, channel)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )
                }
              >
                <ListItemText primary={`# ${channel.name}`} />
              </ChannelItem>
            ))}
            {channels.length === 0 && (
              <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'rgba(30, 58, 138, 0.7)' }}>
                Aucun canal disponible
              </Typography>
            )}
          </List>
        </Box>
      </Box>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          setUpdateChannelDialogOpen(true);
          handleMenuClose();
        }}>
          <EditIcon sx={{ mr: 1 }} />
          Modifier
        </MenuItem>
        <MenuItem onClick={handleOpenDeleteDialog}>
          <DeleteIcon sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>
    </SidebarContainer>
  );

  // Render Messages
  const renderMessages = () => {
    if (!selectedChannel) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant="h6" color="text.secondary">
            Sélectionnez un canal pour commencer à discuter
          </Typography>
        </Box>
      );
    }

    if (messages.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant="body1" color="text.secondary">
            Aucun message pour le moment. Commencez la conversation !
          </Typography>
        </Box>
      );
    }

    return messages.map((msg, index) => {
      const isCurrentUser = msg.senderId === currentUser?.id;
      return (
        <Box key={msg.id || index} sx={{ mb: 2, display: 'flex', flexDirection: isCurrentUser ? 'row-reverse' : 'row' }}>
          <Avatar sx={{ bgcolor: isCurrentUser ? '#42a5f5' : '#90caf9', width: 36, height: 36 }}>
            {getInitials(msg.senderName || 'Utilisateur')}
          </Avatar>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              maxWidth: '70%',
              bgcolor: isCurrentUser ? '#bbdefb' : '#ffffff',
              borderRadius: '16px',
              borderTopLeftRadius: isCurrentUser ? '16px' : '4px',
              borderTopRightRadius: isCurrentUser ? '4px' : '16px',
              ml: isCurrentUser ? 0 : 1,
              mr: isCurrentUser ? 1 : 0,
            }}
          >
            <Typography variant="subtitle2" color={isCurrentUser ? '#1e3a8a' : 'text.primary'}>
              {msg.senderName || 'Utilisateur inconnu'}
            </Typography>
            <Typography variant="body1" color={isCurrentUser ? '#1e3a8a' : 'text.primary'}>
              {msg.content}
            </Typography>
            {msg.attachments?.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {msg.attachments.map((attachment, i) => (
                  <FileAttachment key={i}>
                    {getFileIcon(attachment.fileName)}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {attachment.fileName}
                    </Typography>
                  </FileAttachment>
                ))}
              </Box>
            )}
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                textAlign: isCurrentUser ? 'right' : 'left',
                color: isCurrentUser ? '#1e3a8a' : 'text.secondary',
              }}
            >
              {formatTimestamp(msg.timestamp)}
            </Typography>
          </Paper>
        </Box>
      );
    });
  };

  return (
    <ChatContainer>
      {renderSidebar()}
      <MainArea>
        <AppBar
          position="static"
          color="transparent"
          elevation={0}
          sx={{ backgroundColor: '#ffffff', borderBottom: '1px solid #bbdefb' }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" color="inherit" onClick={() => setSidebarOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, color: '#1e3a8a' }}>
              {selectedChannel ? `# ${selectedChannel.name}` : 'Discussion de groupe'}
            </Typography>
            {selectedChannel && (
              <>
                <AvatarGroup
                  max={3}
                  sx={{ 
                    mr: 2,
                    '& .MuiAvatar-root': { width: 30, height: 30 }
                  }}
                >
                  {channelMembers.slice(0, 3).map((member) => (
                    <Tooltip 
                      key={member.id} 
                      title={`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Utilisateur inconnu'}
                    >
                      <Avatar sx={{ bgcolor: member.id === currentUser?.id ? '#42a5f5' : '#90caf9' }}>
                        {getInitials(`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Utilisateur')}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
                <Tooltip title="Voir les membres du canal">
                  <Button
                    startIcon={<PeopleIcon />}
                    onClick={toggleMembersDrawer}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 2, color: '#1e3a8a', borderColor: '#1e3a8a' }}
                  >
                    {channelMembers.length} {channelMembers.length === 1 ? 'Membre' : 'Membres'}
                  </Button>
                </Tooltip>
              </>
            )}
          </Toolbar>
        </AppBar>
        <MessageContainer>
          {renderMessages()}
          <div ref={messagesEndRef} />
        </MessageContainer>
        {selectedChannel && (
          <InputArea>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <input
                type="file"
                multiple
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileSelection}
              />
              <StyledTextField
                fullWidth
                multiline
                maxRows={4}
                placeholder={`Envoyer un message à #${selectedChannel.name}`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={(e) => setEmojiAnchorEl(e.currentTarget)}>
                        <EmojiEmotionsIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => fileInputRef.current.click()}>
                        <AttachFileIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <SendButton
                variant="contained"
                endIcon={<SendIcon />}
                onClick={handleSendMessage}
                disabled={!messageInput.trim() && attachedFiles.length === 0}
              >
                Envoyer
              </SendButton>
            </Box>
            {attachedFiles.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
                {attachedFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => {
                      const newFiles = [...attachedFiles];
                      newFiles.splice(index, 1);
                      setAttachedFiles(newFiles);
                    }}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            )}
          </InputArea>
        )}
      </MainArea>
      <CreateChannelDialog
        open={createChannelDialogOpen}
        handleClose={() => setCreateChannelDialogOpen(false)}
        handleCreate={handleCreateChannel}
        users={users}
        currentUser={currentUser}
      />
      <UpdateChannelDialog
        open={updateChannelDialogOpen}
        handleClose={() => setUpdateChannelDialogOpen(false)}
        handleUpdate={handleUpdateChannel}
        users={users}
        currentUser={currentUser}
        channel={selectedChannelForMenu}
      />
      <DeleteChannelDialog
        open={deleteChannelDialogOpen}
        handleClose={handleCloseDeleteDialog}
        handleConfirm={handleDeleteChannel}
        channelName={selectedChannelForMenu?.name || ''}
      />
      <MemberListDrawer
        open={membersDrawerOpen}
        onClose={() => setMembersDrawerOpen(false)}
        members={channelMembers}
        currentUserId={currentUser?.id}
      />
      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={() => setEmojiAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <EmojiPicker onEmojiClick={handleEmojiClick} />
      </Popover>
      <Snackbar
        open={errorSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setErrorSnackbarOpen(false)}
      >
        <Alert onClose={() => setErrorSnackbarOpen(false)} severity="error" sx={{ width: '100%' }}>
          {chatError || 'Une erreur est survenue'}
        </Alert>
      </Snackbar>
    </ChatContainer>
  );
};

export default GroupDiscussion;