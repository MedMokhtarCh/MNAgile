import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import {
  Box, Typography, TextField, Button, Avatar, Paper, Divider, IconButton,
  Badge, List, ListItem, ListItemText, ListItemAvatar, AppBar, Toolbar,
  useMediaQuery, Menu, MenuItem, Tooltip, InputAdornment, Popover,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';

// Default channels
const DEFAULT_CHANNELS = [
  { id: 1, name: 'général', unread: 0, type: 'channel' },
  { id: 2, name: 'planification-sprint', unread: 0, type: 'channel' },
  { id: 3, name: 'grooming-backlog', unread: 0, type: 'channel' },
  { id: 4, name: 'standup-quotidien', unread: 0, type: 'channel' },
  { id: 5, name: 'rétrospective', unread: 0, type: 'channel' },
];

// Custom scrollbar styles
const ScrollbarStyle = {
  '&::-webkit-scrollbar': {
    width: '6px',
    height: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '3px',
  },
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent',
};

// Styled components
const ChatContainer = styled(Box)({
  display: 'flex',
  height: '100%',
  backgroundColor: '#f5f7fa',
  overflow: 'hidden',
});

const SidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: 260,
  background: 'linear-gradient(180deg, #2c3e50 0%, #34495e 100%)',
  color: '#fff',
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

const MainArea = styled(Box)({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const ChannelItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'hasUnread',
})(({ theme, active, hasUnread }) => ({
  borderRadius: 6,
  margin: '4px 8px',
  padding: '8px 12px',
  cursor: 'pointer',
  backgroundColor: active ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
  transition: theme.transitions.create(['background-color'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  '& .MuiListItemText-primary': {
    fontWeight: hasUnread || active ? 600 : 400,
    fontSize: '0.9rem',
    color: '#fff',
  },
}));

const MemberItem = styled(ListItem)({
  borderRadius: 6,
  margin: '2px 8px',
  padding: '6px 12px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

const MessageContainer = styled(Box)({
  flexGrow: 1,
  padding: '16px 20px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f5f7fa',
  ...ScrollbarStyle,
});

const SidebarScroll = styled(Box)({
  overflowY: 'auto',
  flexGrow: 1,
  ...ScrollbarStyle,
});

const MessageItem = styled(Box)({
  marginBottom: '12px',
  display: 'flex',
  alignItems: 'flex-start',
});

const MessageContent = styled(Box)({
  marginLeft: '10px',
  flexGrow: 1,
});

const InputArea = styled(Box)({
  padding: '12px 16px',
  borderTop: '1px solid #e8ecef',
  backgroundColor: '#fff',
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.light,
      },
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
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
  background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
  transition: theme.transitions.create(['transform', 'box-shadow', 'background']),
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[2],
    background: 'linear-gradient(135deg, #3395ff 0%, #1a73e8 100%)',
  },
}));

const FileAttachment = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f8fafc',
  borderRadius: 6,
  padding: '6px 10px',
  marginTop: '6px',
  marginRight: '6px',
  border: '1px solid #e8ecef',
  maxWidth: 'fit-content',
});

const StatusBadge = styled(Badge, {
  shouldForwardProp: (prop) => prop !== 'status',
})(({ theme, status }) => {
  const bgColor = status === 'online' ? '#28a745' : status === 'away' ? '#ffc107' : '#6c757d';
  return {
    '& .MuiBadge-badge': {
      backgroundColor: bgColor,
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      width: 10,
      height: 10,
      borderRadius: '50%',
    },
  };
});

const SectionTitle = styled(Typography)({
  fontSize: '0.85rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'rgba(255, 255, 255, 0.6)',
  padding: '12px 16px 6px',
});

// Utility functions
const formatTimestamp = (isoString) => {
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

const getFileIcon = (fileType) => {
  switch (fileType) {
    case 'pdf':
      return (
        <>
          <PictureAsPdfIcon color="error" /> 📑
        </>
      );
    case 'image':
      return (
        <>
          <ImageIcon color="primary" /> 🖼️
        </>
      );
    case 'doc':
    case 'docx':
      return (
        <>
          <DescriptionIcon color="primary" /> 📄
        </>
      );
    default:
      return (
        <>
          <InsertDriveFileIcon color="action" /> 📎
        </>
      );
  }
};

const GroupDiscussion = ({ workspaceName = 'Espace de travail' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem(`messages_channel_${DEFAULT_CHANNELS[0].id}`)) || []
  );
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(DEFAULT_CHANNELS[0]);
  const [directMessages, setDirectMessages] = useState(
    JSON.parse(localStorage.getItem('direct_messages')) || []
  );
  const [openNewDmDialog, setOpenNewDmDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const emojiPickerOpen = Boolean(emojiAnchorEl);

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const teamMembers = (JSON.parse(localStorage.getItem('users')) || []).filter(
    (member) => member.id !== currentUser?.id
  );
  const canCommunicate = currentUser && teamMembers.length > 0;

  const getRandomStatus = () => {
    const statuses = ['online', 'away', 'offline'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  useEffect(() => {
    const storageKey = selectedChannel.type === 'dm' ? `messages_${selectedChannel.id}` : `messages_channel_${selectedChannel.id}`;
    const channelMessages = JSON.parse(localStorage.getItem(storageKey)) || [];
    setMessages(channelMessages);
  }, [selectedChannel]);

  useEffect(() => {
    const storageKey = selectedChannel.type === 'dm' ? `messages_${selectedChannel.id}` : `messages_channel_${selectedChannel.id}`;
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, selectedChannel]);

  useEffect(() => {
    localStorage.setItem('direct_messages', JSON.stringify(directMessages));
  }, [directMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEmojiPickerOpen = (event) => setEmojiAnchorEl(event.currentTarget);
  const handleEmojiPickerClose = () => setEmojiAnchorEl(null);
  const handleEmojiClick = (emojiData) => setMessageInput((prev) => prev + emojiData.emoji);

  const startDirectMessage = (member) => {
    if (member.id === currentUser?.id) return;
    const dmId = `dm_${Math.min(currentUser.id, member.id)}_${Math.max(currentUser.id, member.id)}`;
    const dmChannel = {
      id: dmId,
      name: `${member.prenom || ''} ${member.nom || ''}`.trim() || 'Utilisateur inconnu',
      type: 'dm',
      recipientId: member.id,
      unread: 0,
    };
    if (!directMessages.find((dm) => dm.id === dmId)) {
      setDirectMessages([...directMessages, dmChannel]);
    }
    setSelectedChannel(dmChannel);
    setOpenNewDmDialog(false);
    setSidebarOpen(false);
  };

  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel);
    if (channel.type === 'dm') {
      setDirectMessages((prev) =>
        prev.map((dm) =>
          dm.id === channel.id ? { ...dm, unread: 0 } : dm
        )
      );
    }
    setSidebarOpen(false);
  };

  const handleSendMessage = () => {
    if (!canCommunicate || (messageInput.trim() === '' && attachedFiles.length === 0)) return;

    const newMessage = {
      id: messages.length + 1,
      senderId: currentUser.id,
      content: messageInput,
      timestamp: new Date().toISOString(),
      attachments: attachedFiles,
      replyTo,
      recipientId: selectedChannel.type === 'dm' ? selectedChannel.recipientId : null,
    };

    setMessages([...messages, newMessage]);

    // Increment unread count for DM if not currently selected
    if (selectedChannel.type === 'dm') {
      const dmId = selectedChannel.id;
      setDirectMessages((prev) =>
        prev.map((dm) =>
          dm.id === dmId ? { ...dm, unread: (dm.unread || 0) + 1 } : dm
        )
      );
    }

    setMessageInput('');
    setAttachedFiles([]);
    setReplyTo(null);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map((file, index) => {
      let fileType = 'file';
      if (file.type.includes('image')) fileType = 'image';
      else if (file.type.includes('pdf')) fileType = 'pdf';
      else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) fileType = 'doc';

      return {
        id: attachedFiles.length + index + 1,
        name: file.name,
        type: fileType,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' Mo',
      };
    });

    setAttachedFiles([...attachedFiles, ...newAttachments]);
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const removeAttachment = (id) => {
    setAttachedFiles(attachedFiles.filter((file) => file.id !== id));
  };

  const getSender = (senderId) => {
    if (senderId === currentUser?.id) {
      return {
        ...currentUser,
        name: currentUser.prenom || currentUser.nom ? `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() : 'Vous',
      };
    }
    const member = teamMembers.find((m) => m.id === senderId);
    return member
      ? {
          ...member,
          name: `${member.prenom || ''} ${member.nom || ''}`.trim() || 'Utilisateur inconnu',
        }
      : { id: senderId, name: 'Utilisateur inconnu', prenom: 'Inconnu', nom: 'Utilisateur' };
  };

  return (
    <ChatContainer>
      {/* Sidebar */}
      <SidebarContainer open={sidebarOpen}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff' }}>
            {workspaceName}
          </Typography>
          {isMobile && (
            <IconButton size="small" onClick={() => setSidebarOpen(false)} sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
        <SidebarScroll>
          <SectionTitle>Canaux</SectionTitle>
          <List component="nav" dense>
            {DEFAULT_CHANNELS.map((channel) => (
              <ChannelItem
                key={channel.id}
                active={channel.id === selectedChannel.id}
                hasUnread={channel.unread > 0}
                onClick={() => handleSelectChannel(channel)}
              >
                <ListItemText primary={`# ${channel.name}`} />
                {channel.unread > 0 && <Badge badgeContent={channel.unread} color="error" />}
              </ChannelItem>
            ))}
          </List>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
            <SectionTitle>Messages privés</SectionTitle>
            <Tooltip title="Nouveau message">
              <IconButton size="small" color="inherit" onClick={() => setOpenNewDmDialog(true)}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <List dense>
            {directMessages.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', px: 2 }}>
                Aucun message privé
              </Typography>
            ) : (
              directMessages
                .filter((dm) => dm.recipientId !== currentUser?.id)
                .map((dm) => (
                  <ChannelItem
                    key={dm.id}
                    active={dm.id === selectedChannel.id}
                    hasUnread={dm.unread > 0}
                    onClick={() => handleSelectChannel(dm)}
                  >
                    <ListItemText primary={dm.name} />
                    {dm.unread > 0 && (
                      <Badge badgeContent={dm.unread} color="error" aria-label={`${dm.unread} messages non lus`} />
                    )}
                  </ChannelItem>
                ))
            )}
          </List>
          <SectionTitle>Membres de l'équipe</SectionTitle>
          {teamMembers.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', px: 2 }}>
              Aucun membre disponible
            </Typography>
          ) : (
            <List dense>
              {teamMembers.map((member) => (
                <MemberItem
                  key={member.id}
                  onClick={() => startDirectMessage(member)}
                >
                  <ListItemAvatar>
                    <StatusBadge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      status={getRandomStatus()}
                      aria-label={getRandomStatus() === 'online' ? 'En ligne' : getRandomStatus() === 'away' ? 'Absent' : 'Hors ligne'}
                    >
                      <Avatar sx={{ bgcolor: '#007bff', width: 36, height: 36, fontSize: '0.9rem' }}>
                        {member.prenom?.[0] || member.nom?.[0] || '?'}
                      </Avatar>
                    </StatusBadge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${member.prenom || ''} ${member.nom || ''}`.trim() || 'Utilisateur inconnu'}
                    primaryTypographyProps={{
                      variant: 'body2',
                      style: { fontWeight: 500, color: '#fff' },
                    }}
                  />
                </MemberItem>
              ))}
            </List>
          )}
        </SidebarScroll>
      </SidebarContainer>

      {/* Main Area */}
      <MainArea>
        <AppBar
          position="static"
          color="transparent"
          elevation={0}
          sx={{ backgroundColor: '#fff', borderBottom: '1px solid #e8ecef' }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="Ouvrir la barre latérale"
                onClick={() => setSidebarOpen(true)}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, color: '#2c3e50' }}>
              {selectedChannel.type === 'dm' ? selectedChannel.name : `# ${selectedChannel.name}`}
            </Typography>
            <Tooltip title="Informations sur le canal">
              <IconButton color="primary">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <MessageContainer>
          {!canCommunicate ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              Veuillez configurer des utilisateurs pour commencer la discussion.
            </Typography>
          ) : messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              Aucun message dans ce {selectedChannel.type === 'dm' ? 'message privé' : 'canal'}. Commencez la conversation !
            </Typography>
          ) : (
            messages
              .filter((message) =>
                selectedChannel.type === 'dm'
                  ? (message.senderId === currentUser.id && message.recipientId === selectedChannel.recipientId) ||
                    (message.senderId === selectedChannel.recipientId && message.recipientId === currentUser.id)
                  : true
              )
              .map((message) => {
                const sender = getSender(message.senderId);
                const replyToMessage = message.replyTo ? messages.find((m) => m.id === message.replyTo) : null;
                const replyToSender = replyToMessage ? getSender(replyToMessage.senderId) : null;
                return (
                  <MessageItem key={message.id}>
                    <Avatar sx={{ bgcolor: sender.id === currentUser?.id ? '#007bff' : '#6c757d', width: 36, height: 36 }}>
                      {sender.prenom?.[0] || sender.nom?.[0] || '?'}
                    </Avatar>
                    <MessageContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 1, color: '#2c3e50' }}>
                          {sender.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(message.timestamp)}
                        </Typography>
                      </Box>
                      {replyToMessage && (
                        <Box sx={{ backgroundColor: '#f8fafc', p: 1, borderRadius: 1, mb: 1, borderLeft: '3px solid #e8ecef' }}>
                          <Typography variant="caption" color="text.secondary">
                            Réponse à {replyToSender?.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                            {replyToMessage.content.slice(0, 50)}
                            {replyToMessage.content.length > 50 ? '...' : ''}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap', color: '#34495e' }}>
                        {message.content}
                      </Typography>
                      {message.attachments.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                          {message.attachments.map((file) => (
                            <FileAttachment key={file.id}>
                              {getFileIcon(file.type)}
                              <Box sx={{ ml: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#2c3e50' }}>
                                  {file.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {file.size}
                                </Typography>
                              </Box>
                            </FileAttachment>
                          ))}
                        </Box>
                      )}
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => {
                          setMessageInput(`@${sender.name} `);
                          setReplyTo(message.id);
                          document.querySelector('#message-input')?.focus();
                        }}
                      >
                        Répondre
                      </Button>
                    </MessageContent>
                  </MessageItem>
                );
              })
          )}
          <div ref={messagesEndRef} />
        </MessageContainer>

        {attachedFiles.length > 0 && (
          <Box sx={{ backgroundColor: '#fff', padding: '8px 16px', display: 'flex', flexWrap: 'wrap' }}>
            {attachedFiles.map((file) => (
              <Paper
                key={file.id}
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 2,
                  border: '1px solid #e8ecef',
                  padding: '4px 8px',
                  marginRight: 1,
                  marginBottom: 1,
                  backgroundColor: '#f8fafc',
                }}
              >
                {getFileIcon(file.type)}
                <Typography variant="body2" sx={{ mx: 1, color: '#2c3e50' }}>
                  {file.name}
                </Typography>
                <IconButton size="small" onClick={() => removeAttachment(file.id)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>
        )}

        <InputArea>
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <StyledTextField
              id="message-input"
              fullWidth
              multiline
              maxRows={4}
              placeholder={canCommunicate ? `Envoyer un message à ${selectedChannel.type === 'dm' ? selectedChannel.name : '#' + selectedChannel.name}` : 'Discussion désactivée'}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              disabled={!canCommunicate}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Ajouter un emoji">
                      <IconButton size="small" color="primary" disabled={!canCommunicate} onClick={handleEmojiPickerOpen}>
                        <EmojiEmotionsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Joindre un fichier">
                      <IconButton size="small" color="primary" onClick={triggerFileInput} disabled={!canCommunicate}>
                        <AttachFileIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelection}
                      style={{ display: 'none' }}
                      disabled={!canCommunicate}
                    />
                    <Tooltip title="Plus d'options">
                      <IconButton size="small" color="primary" onClick={handleMenuOpen} disabled={!canCommunicate}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            <SendButton
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={!canCommunicate || (messageInput.trim() === '' && attachedFiles.length === 0)}
            >
              Envoyer
            </SendButton>
          </Box>
        </InputArea>
      </MainArea>

      <Dialog open={openNewDmDialog} onClose={() => setOpenNewDmDialog(false)}>
        <DialogTitle>Nouveau message</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={teamMembers}
            getOptionLabel={(option) =>
              `${option.prenom || ''} ${option.nom || ''}`.trim() || 'Utilisateur inconnu'
            }
            onChange={(event, value) => {
              if (value) {
                startDirectMessage(value);
                setOpenNewDmDialog(false);
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Rechercher un membre" variant="outlined" autoFocus />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewDmDialog(false)}>Annuler</Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={emojiPickerOpen}
        anchorEl={emojiAnchorEl}
        onClose={handleEmojiPickerClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          categories={['smileys_people', 'objects', 'symbols']}
        />
      </Popover>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MenuItem onClick={handleMenuClose}>Créer un extrait de code</MenuItem>
        <MenuItem onClick={handleMenuClose}>Créer un sondage</MenuItem>
        <MenuItem onClick={handleMenuClose}>Partager l'écran</MenuItem>
        <MenuItem onClick={handleMenuClose}>Autres options...</MenuItem>
      </Menu>
    </ChatContainer>
  );
};

export default GroupDiscussion;