import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EmojiPicker from 'emoji-picker-react';
import {
  Box, Typography, TextField, Button, Avatar, Paper, Divider, IconButton,
  List, ListItem, ListItemText, AppBar, Toolbar, useMediaQuery,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
  InputAdornment, Popover, Chip, Tooltip, AvatarGroup, Drawer, Menu, MenuItem,
  CircularProgress,
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
  messageReceived,
} from '../store/slices/chatSlice';
import { fetchCurrentUser } from '../store/slices/authSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import InputUserAssignment from '../components/common/InputUserAssignment';
import signalRService from '../services/signalRService';
import { discussionApi } from '../services/api';
import sendSound from '../assets/sounds/send.mp3';
import receiveSound from '../assets/sounds/receive.mp3';

// Utility to parse JWT token
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
};

// Styled Components
const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100vh', // Use full viewport height
  width: '100%',
  backgroundColor: '#e3f2fd',
  overflow: 'hidden',
  boxSizing: 'border-box',
  margin: 0, // Remove any default margins
  padding: 0, // Remove any default padding
  position: 'relative', // Ensure it stays within the viewport
  top: 0, // Explicitly start at the top
}));

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
  height: '100vh', // Ensure MainArea also uses full viewport height
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
  msOverflowStyle: 'none',
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

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    width: '600px',
    maxWidth: '90vw',
    borderRadius: '12px',
    padding: theme.spacing(2),
    backgroundColor: '#f0f7ff',
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

// Audio Playback Utility
const playAudio = (audio, type) => {
  if (document.visibilityState === 'visible') {
    audio.currentTime = 0; // Reset to start for rapid consecutive plays
    audio.play().catch((error) => {
      console.error(`Failed to play ${type} sound:`, error);
    });
  } else {
    console.log(`Sound (${type}) not played: Tab is not visible`);
  }
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
    <StyledDialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e3a8a' }}>
        Créer un nouveau canal
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ backgroundColor: 'rgba(30, 58, 138, 0.15)', mb: 2 }} />
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#1e3a8a' }}>
          Nom du canal
        </Typography>
        <TextField
          autoFocus
          fullWidth
          variant="outlined"
          label="Nom du canal"
          placeholder="Entrez le nom du canal"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: '#ffffff',
            },
          }}
          error={channelName.trim() === ''}
          helperText={channelName.trim() === '' ? 'Le nom du canal est requis' : ''}
          aria-label="Nom du canal"
          inputProps={{ 'aria-required': true }}
        />
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#1e3a8a' }}>
          Ajouter des membres
        </Typography>
        <InputUserAssignment
          options={users.filter((user) => user.id !== currentUser?.id)}
          value={selectedUsers}
          onChange={(event, newValue) => setSelectedUsers(newValue)}
          label="Ajouter des membres (optionnel)"
          placeholder="Rechercher des utilisateurs..."
          getAvatarColor={getAvatarColor}
          generateInitials={getInitials}
          multiple
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ color: '#1e3a8a', borderRadius: '10px' }}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!channelName.trim()}
          sx={{
            background: 'linear-gradient(135deg, #90caf9 0%, #42a5f5 100%)',
            borderRadius: '10px',
            '&:hover': {
              background: 'linear-gradient(135deg, #bbdefb 0%, #64b5f6 100%)',
            },
          }}
        >
          Créer
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

// Dialog for Updating a Channel
const UpdateChannelDialog = ({ open, handleClose, handleUpdate, users, currentUser, channel }) => {
  const [channelName, setChannelName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [membersToRemove, setMembersToRemove] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (channel) {
      setChannelName(channel.name || '');
      setSelectedUsers(users.filter((user) => channel?.memberIds?.includes(user.id)) || []);
      setMembersToRemove([]);
    }
  }, [channel, users]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await handleUpdate({
        name: channelName.trim(),
        MemberIdsToAdd: selectedUsers
          .filter((user) => !channel?.memberIds?.includes(user.id))
          .map((user) => user.id),
        MemberIdsToRemove: membersToRemove.map((user) => user.id),
      });
      setChannelName('');
      setSelectedUsers([]);
      setMembersToRemove([]);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableUsers = users.filter(
    (user) =>
      user.id !== currentUser?.id &&
      user.id !== channel?.creatorId &&
      !selectedUsers.some((selected) => selected.id === user.id)
  );

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e3a8a' }}>
        Modifier le canal #{channel?.name}
        <IconButton onClick={handleClose} disabled={isSubmitting}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ backgroundColor: 'rgba(30, 58, 138, 0.15)', mb: 2 }} />
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#1e3a8a' }}>
          Nom du canal
        </Typography>
        <TextField
          autoFocus
          fullWidth
          variant="outlined"
          label="Nom du canal"
          placeholder="Entrez le nom du canal"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: '#ffffff',
            },
          }}
          error={channelName.trim() === ''}
          helperText={channelName.trim() === '' ? 'Le nom du canal est requis' : ''}
          aria-label="Nom du canal"
          inputProps={{ 'aria-required': true }}
          disabled={isSubmitting}
        />
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#1e3a8a' }}>
          Membres actuels
        </Typography>
        <InputUserAssignment
          options={selectedUsers}
          value={selectedUsers}
          onChange={(event, newValue) => {
            const removedUsers = selectedUsers.filter((user) => !newValue.includes(user));
            const filteredRemovedUsers = removedUsers.filter((user) => user.id !== channel?.creatorId);
            setSelectedUsers(newValue);
            setMembersToRemove((prev) => [
              ...prev,
              ...filteredRemovedUsers.filter((user) => !prev.some((u) => u.id === user.id)),
            ]);
          }}
          label="Membres actuels"
          placeholder="Gérer les membres actuels..."
          getAvatarColor={getAvatarColor}
          generateInitials={getInitials}
          multiple
          readOnly={false}
          sx={{ mb: 3 }}
          disabled={isSubmitting}
        />
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#1e3a8a' }}>
          Ajouter de nouveaux membres
        </Typography>
        <InputUserAssignment
          options={availableUsers}
          value={[]}
          onChange={(event, newValue) => {
            setSelectedUsers((prev) => [
              ...prev,
              ...newValue.filter((user) => !prev.some((u) => u.id === user.id)),
            ]);
          }}
          label="Ajouter des membres (optionnel)"
          placeholder="Rechercher des utilisateurs à ajouter..."
          getAvatarColor={getAvatarColor}
          generateInitials={getInitials}
          multiple
          sx={{ mb: 3 }}
          disabled={isSubmitting}
        />
        {membersToRemove.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#1e3a8a' }}>
              Membres à supprimer
            </Typography>
            <InputUserAssignment
              options={membersToRemove}
              value={membersToRemove}
              onChange={(event, newValue) => setMembersToRemove(newValue)}
              label="Membres à supprimer"
              placeholder="Membres sélectionnés pour suppression..."
              getAvatarColor={getAvatarColor}
              generateInitials={getInitials}
              multiple
              readOnly={false}
              disabled={isSubmitting}
            />
          </Box>
        )}
        {(channelName !== channel?.name || selectedUsers.length !== channel?.memberIds?.length || membersToRemove.length > 0) && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: '10px' }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#1e3a8a' }}>
              Aperçu des modifications
            </Typography>
            {channelName !== channel?.name && (
              <Typography variant="body2">Nouveau nom : {channelName}</Typography>
            )}
            {selectedUsers.some((user) => !channel?.memberIds?.includes(user.id)) && (
              <Typography variant="body2">
                Membres à ajouter :{' '}
                {selectedUsers
                  .filter((user) => !channel?.memberIds?.includes(user.id))
                  .map((user) => `${user.firstName} ${user.lastName}`)
                  .join(', ')}
              </Typography>
            )}
            {membersToRemove.length > 0 && (
              <Typography variant="body2">
                Membres à supprimer :{' '}
                {membersToRemove.map((user) => `${user.firstName} ${user.lastName}`).join(', ')}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          sx={{ color: '#1e3a8a', borderRadius: '10px' }}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!channelName.trim() || isSubmitting}
          sx={{
            background: 'linear-gradient(135deg, #90caf9 0%, #42a5f5 100%)',
            borderRadius: '10px',
            '&:hover': {
              background: 'linear-gradient(135deg, #bbdefb 0%, #64b5f6 100%)',
            },
          }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Mettre à jour'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

// Dialog for Confirming Channel Deletion
const DeleteChannelDialog = ({ open, handleClose, handleConfirm, channelName }) => {
  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e3a8a' }}>
        Confirmer la suppression
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ backgroundColor: 'rgba(30, 58, 138, 0.15)', mb: 2 }} />
      <DialogContent>
        <Typography variant="body1">
          Voulez-vous vraiment supprimer le canal <strong>#{channelName}</strong> ? Cette action est irréversible.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ color: '#1e3a8a', borderRadius: '10px' }}>
          Annuler
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          sx={{ borderRadius: '10px' }}
        >
          Supprimer
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

// Member List Drawer
const MemberListDrawer = ({ open, onClose, members, currentUserId }) => {
  return (
    <MembersDrawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#1e3a8a' }}>Membres du canal</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2, backgroundColor: 'rgba(30, 58, 138, 0.15)' }} />
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
  const [errorMessage, setErrorMessage] = useState('');
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedChannelForMenu, setSelectedChannelForMenu] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const sendAudioRef = useRef(new Audio(sendSound));
  const receiveAudioRef = useRef(new Audio(receiveSound));

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

  // Check claims
  const hasCanCommunicate = Array.isArray(currentUser?.claims) && currentUser.claims.includes('CanCommunicate');
  const hasCanCreateChannel = Array.isArray(currentUser?.claims) && currentUser.claims.includes('CanCreateChannel');

  // Log JWT token and claims
  useEffect(() => {
    const token = document.cookie.replace(/(?:(?:^|.*;\s*)AuthToken\s*=\s*([^;]*).*$)|^.*$/, '$1');
    console.log('JWT Token:', token);
    if (token) {
      const decoded = parseJwt(token);
      console.log('JWT Decoded:', decoded);
      console.log('JWT User ID:', decoded?.sub || decoded?.nameidentifier);
      console.log('Current User ID:', currentUser?.id);
      console.log('Claims from JWT:', decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded?.roles);
    }
  }, [currentUser]);

  // Initialization
  useEffect(() => {
    dispatch(fetchChannels());
    dispatch(fetchCurrentUser());
    dispatch(fetchUsers({}));
    dispatch(initializeSignalR());
  }, [dispatch]);

  // Fetch Messages, Members, and Join Channel
  useEffect(() => {
    if (selectedChannel?.id) {
      dispatch(fetchChannelMessages(selectedChannel.id));
      dispatch(fetchChannelMembers(selectedChannel.id));
      if (signalRService.isConnected()) {
        signalRService.connection.invoke('JoinChannel', selectedChannel.id)
          .catch(err => console.error('Failed to join channel:', err));
      }
    }
  }, [dispatch, selectedChannel]);

  // Handle Errors
  useEffect(() => {
    if (chatError) {
      setErrorMessage(chatError);
      setErrorSnackbarOpen(true);
    }
  }, [chatError]);

  // Scroll to Bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Preload Audio Files
  useEffect(() => {
    const preloadAudio = async (audio, type) => {
      try {
        await audio.load();
        console.log(`${type} audio loaded successfully`);
      } catch (error) {
        console.error(`Failed to load ${type} audio:`, error);
      }
    };
    preloadAudio(sendAudioRef.current, 'send');
    preloadAudio(receiveAudioRef.current, 'receive');
  }, []);

  // Handle Received Messages for Sound
  useEffect(() => {
    const handleMessageReceived = (message) => {
      console.log('Received message:', message);
      console.log('Current user ID:', currentUser?.id, 'Message sender ID:', message.senderId);
      // Coerce IDs to strings for comparison to handle type mismatches
      if (String(message.senderId) !== String(currentUser?.id)) {
        playAudio(receiveAudioRef.current, 'receive');
      } else {
        console.log('Skipping receive sound: Message is from current user');
      }
    };

    let unsubscribe;
    if (signalRService.isConnected()) {
      console.log('Registering onMessageReceived callback');
      unsubscribe = signalRService.onMessageReceived(handleMessageReceived);
    } else {
      console.log('SignalR not connected, cannot register onMessageReceived');
    }

    return () => {
      if (unsubscribe) {
        console.log('Unregistering onMessageReceived callback');
        unsubscribe();
      }
    };
  }, [currentUser]);

  // Enhanced Debug Logging
  useEffect(() => {
    console.log('Current User (Raw):', currentUser);
    console.log('Current User (Parsed):', {
      id: currentUser?.id,
      idType: typeof currentUser?.id,
      claims: currentUser?.claims,
      hasCanCreateChannel
    });
    console.log('Selected Channel (Raw):', selectedChannel);
    console.log('Selected Channel (Parsed):', {
      id: selectedChannel?.id,
      creatorId: selectedChannel?.creatorId,
      creatorIdType: typeof selectedChannel?.creatorId,
      name: selectedChannel?.name
    });
  }, [currentUser, selectedChannel, hasCanCreateChannel]);

  // Handlers
  const handleSelectChannel = (channel) => {
    dispatch(setSelectedChannel(channel));
    setSidebarOpen(false);
  };

  const handleCreateChannel = async (channelData) => {
    if (!hasCanCreateChannel) {
      console.log('Create blocked: Missing permission', { hasCanCreateChannel });
      setErrorMessage('Vous n\'avez pas la permission de créer un canal.');
      setErrorSnackbarOpen(true);
      return;
    }
    try {
      await dispatch(createChannel(channelData)).unwrap();
      setCreateChannelDialogOpen(false);
    } catch (error) {
      setErrorMessage(error.message || 'Erreur lors de la création du canal.');
      setErrorSnackbarOpen(true);
    }
  };

  const handleUpdateChannel = async (channelData) => {
    if (!hasCanCreateChannel || !selectedChannelForMenu) {
      console.log('Update blocked: Missing permission or channel', { hasCanCreateChannel, selectedChannelForMenu });
      setErrorMessage('Vous n\'avez pas la permission de modifier ce canal.');
      setErrorSnackbarOpen(true);
      return;
    }
    const channelCreatorId = parseInt(selectedChannelForMenu.creatorId, 10);
    const userId = parseInt(currentUser?.id, 10);
    console.log('Updating channel:', {
      channelId: selectedChannelForMenu.id,
      channelCreatorId,
      userId,
      creatorIdRaw: selectedChannelForMenu.creatorId,
      userIdRaw: currentUser?.id,
      creatorIdType: typeof selectedChannelForMenu.creatorId,
      userIdType: typeof currentUser?.id,
      hasCanCreateChannel,
      channelData
    });
    if (isNaN(channelCreatorId) || isNaN(userId)) {
      console.error('Invalid IDs:', { channelCreatorId, userId });
      setErrorMessage('Erreur: Identifiants de créateur ou d\'utilisateur invalides.');
      setErrorSnackbarOpen(true);
      return;
    }
    if (channelCreatorId !== userId) {
      console.log('Creator mismatch:', { channelCreatorId, userId });
      setErrorMessage('Seul le créateur du canal peut le modifier.');
      setErrorSnackbarOpen(true);
      return;
    }
    try {
      console.log('Sending update request:', {
        url: `/api/discussion/channels/${selectedChannelForMenu.id}`,
        method: 'PUT',
        data: {
          name: channelData.name,
          MemberIdsToAdd: channelData.MemberIdsToAdd,
          MemberIdsToRemove: channelData.MemberIdsToRemove || [],
        },
        headers: {
          Authorization: `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)AuthToken\s*=\s*([^;]*).*$)|^.*$/, '$1')}`
        }
      });
      await dispatch(updateChannel({
        channelId: selectedChannelForMenu.id,
        channelData: {
          name: channelData.name,
          MemberIdsToAdd: channelData.MemberIdsToAdd,
          MemberIdsToRemove: channelData.MemberIdsToRemove || [],
        }
      })).unwrap();
      setUpdateChannelDialogOpen(false);
      setSelectedChannelForMenu(null);
      setMenuAnchorEl(null);
    } catch (error) {
      console.error('UpdateChannel error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: `/api/discussion/channels/${selectedChannelForMenu.id}`
      });
      const message = error.message?.includes('Seul le créateur')
        ? 'Seul le créateur du canal peut le modifier.'
        : error.message?.includes('Unauthorized')
        ? 'Erreur d\'authentification. Veuillez vous reconnecter.'
        : error.message?.includes('duplicate')
        ? 'Un canal avec ce nom existe déjà.'
        : error.message || 'Erreur lors de la mise à jour du canal.';
      setErrorMessage(message);
      setErrorSnackbarOpen(true);
    }
  };

  const handleDeleteChannel = async () => {
    if (!hasCanCreateChannel || !selectedChannelForMenu) {
      console.log('Delete blocked: Missing permission or channel', { hasCanCreateChannel, selectedChannelForMenu });
      setErrorMessage('Vous n\'avez pas la permission de supprimer ce canal.');
      setErrorSnackbarOpen(true);
      return;
    }
    const channelCreatorId = parseInt(selectedChannelForMenu.creatorId, 10);
    const userId = parseInt(currentUser?.id, 10);
    console.log('Deleting channel:', {
      channelId: selectedChannelForMenu.id,
      channelCreatorId,
      userId,
      creatorIdRaw: selectedChannelForMenu.creatorId,
      userIdRaw: currentUser?.id,
      creatorIdType: typeof selectedChannelForMenu.creatorId,
      userIdType: typeof currentUser?.id,
      hasCanCreateChannel
    });
    if (isNaN(channelCreatorId) || isNaN(userId)) {
      console.error('Invalid IDs:', { channelCreatorId, userId });
      setErrorMessage('Erreur: Identifiants de créateur ou d\'utilisateur invalides.');
      setErrorSnackbarOpen(true);
      return;
    }
    if (channelCreatorId !== userId) {
      console.log('Creator mismatch:', { channelCreatorId, userId });
      setErrorMessage('Seul le créateur du canal peut le supprimer.');
      setErrorSnackbarOpen(true);
      return;
    }
    try {
      await dispatch(deleteChannel(selectedChannelForMenu.id)).unwrap();
      setDeleteChannelDialogOpen(false);
      setMenuAnchorEl(null);
      setSelectedChannelForMenu(null);
    } catch (error) {
      console.error('DeleteChannel error:', error);
      const message = error.message?.includes('Seul le créateur')
        ? 'Seul le créateur du canal peut le supprimer.'
        : error.message || 'Erreur lors de la suppression du canal.';
      setErrorMessage(message);
      setErrorSnackbarOpen(true);
    }
  };

  const handleOpenDeleteDialog = () => {
    if (!hasCanCreateChannel) {
      setErrorMessage('Vous n\'avez pas la permission de supprimer un canal.');
      setErrorSnackbarOpen(true);
      return;
    }
    setDeleteChannelDialogOpen(true);
    setMenuAnchorEl(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteChannelDialogOpen(false);
    setSelectedChannelForMenu(null);
  };

  const handleSendMessage = async () => {
    if (!hasCanCommunicate) {
      setErrorMessage('Vous n\'avez pas la permission d\'envoyer des messages.');
      setErrorSnackbarOpen(true);
      return;
    }
    if (selectedChannel && (messageInput.trim() || attachedFiles.length > 0)) {
      try {
        await dispatch(
          sendMessage({
            channelId: selectedChannel.id,
            content: messageInput.trim(),
            files: attachedFiles,
          })
        ).unwrap();
        playAudio(sendAudioRef.current, 'send'); // Play send sound on success
        setMessageInput('');
        setAttachedFiles([]);
      } catch (error) {
        setErrorMessage(error.message || 'Erreur lors de l\'envoi du message.');
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
    if (!hasCanCommunicate) {
      setErrorMessage('Vous n\'avez pas la permission de joindre des fichiers.');
      setErrorSnackbarOpen(true);
      return;
    }
    setAttachedFiles(Array.from(event.target.files));
  };

  const handleEmojiClick = (emojiData) => {
    if (!hasCanCommunicate) {
      setErrorMessage('Vous n\'avez pas la permission d\'ajouter des emojis.');
      setErrorSnackbarOpen(true);
      return;
    }
    setMessageInput((prev) => prev + emojiData.emoji);
    setEmojiAnchorEl(null);
  };

  const toggleMembersDrawer = () => {
    setMembersDrawerOpen(!membersDrawerOpen);
  };

  const handleMenuOpen = (event, channel) => {
    event.stopPropagation();
    if (!hasCanCreateChannel) {
      console.log('Menu open blocked: Missing permission', { hasCanCreateChannel });
      setErrorMessage('Vous n\'avez pas la permission de modifier ou supprimer un canal.');
      setErrorSnackbarOpen(true);
      return;
    }
    console.log('Opening menu for channel:', { channelId: channel.id, channelName: channel.name });
    setMenuAnchorEl(event.currentTarget);
    setSelectedChannelForMenu(channel);
  };

  const handleMenuClose = () => {
    console.log('Closing menu, selectedChannelForMenu:', selectedChannelForMenu);
    setMenuAnchorEl(null);
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
          {hasCanCreateChannel && (
            <Button
              startIcon={<GroupAddIcon />}
              variant="outlined"
              fullWidth
              sx={{ mb: 2, color: '#1e3a8a', borderColor: '#1e3a8a' }}
              onClick={() => setCreateChannelDialogOpen(true)}
            >
              Créer un canal
            </Button>
          )}
          <List dense>
            {channels.map((channel) => (
              <ChannelItem
                key={channel.id}
                active={selectedChannel?.id === channel.id}
                onClick={() => handleSelectChannel(channel)}
                secondaryAction={
                  hasCanCreateChannel && parseInt(channel.creatorId, 10) === parseInt(currentUser?.id, 10) && (
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
      {hasCanCreateChannel && (
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            console.log('Edit menu item clicked, selectedChannelForMenu:', selectedChannelForMenu);
            setUpdateChannelDialogOpen(true);
          }}>
            <EditIcon sx={{ mr: 1 }} />
            Modifier
          </MenuItem>
          <MenuItem onClick={handleOpenDeleteDialog}>
            <DeleteIcon sx={{ mr: 1 }} />
            Supprimer
          </MenuItem>
        </Menu>
      )}
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
      const isCurrentUser = String(msg.senderId) === String(currentUser?.id);
      const sender = channelMembers.find((member) => String(member.id) === String(msg.senderId)) ||
                     users.find((user) => String(user.id) === String(msg.senderId)) ||
                     { firstName: '', lastName: '' };
      const firstName = sender.firstName ?? sender.FirstName ?? '';
      const lastName = sender.lastName ?? sender.LastName ?? '';
      const fullName = isCurrentUser 
        ? 'Vous' 
        : `${firstName} ${lastName}`.trim() || msg.senderName || 'Utilisateur inconnu';
      const avatarColor = getAvatarColor(fullName);

      return (
        <Box
          key={msg.id || index}
          sx={{
            mb: 2,
            display: 'flex',
            flexDirection: isCurrentUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            px: 1,
          }}
        >
          <Tooltip title={isCurrentUser ? 'Vous' : `${firstName} ${lastName}`.trim() || 'Utilisateur inconnu'}>
            <Avatar
              sx={{
                bgcolor: avatarColor,
                width: 40,
                height: 40,
                mt: 0.5,
                mr: isCurrentUser ? 1 : 0,
                ml: isCurrentUser ? 0 : 1,
              }}
            >
              {getInitials(isCurrentUser ? 'Vous' : `${firstName} ${lastName}`.trim() || 'Utilisateur')}
            </Avatar>
          </Tooltip>
          <Box sx={{ maxWidth: '70%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: isCurrentUser ? '#1e3a8a' : 'text.primary',
                  mr: 1,
                }}
              >
                {fullName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isCurrentUser ? '#1e3a8a' : 'text.secondary',
                }}
              >
                {formatTimestamp(msg.timestamp)}
              </Typography>
            </Box>
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                bgcolor: isCurrentUser ? '#bbdefb' : '#ffffff',
                borderRadius: '16px',
                borderTopLeftRadius: isCurrentUser ? '16px' : '4px',
                borderTopRightRadius: isCurrentUser ? '4px' : '16px',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: isCurrentUser ? '#1e3a8a' : 'text.primary',
                  wordBreak: 'break-word',
                }}
              >
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
            </Paper>
          </Box>
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
        {selectedChannel && hasCanCommunicate && (
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
      {hasCanCreateChannel && (
        <>
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
        </>
      )}
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
          {errorMessage || 'Une erreur est survenue'}
        </Alert>
      </Snackbar>
    </ChatContainer>
  );
};

export default GroupDiscussion;