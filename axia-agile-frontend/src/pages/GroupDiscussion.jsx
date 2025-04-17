import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { 
  Box, Typography, TextField, Button, Avatar, Paper, Divider, IconButton, 
  Badge, List, ListItem, ListItemText, ListItemAvatar, AppBar, Toolbar,
  Drawer, useMediaQuery, Menu, MenuItem, Tooltip, InputAdornment, Popover
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';

// Default channels
const DEFAULT_CHANNELS = [
  { id: 1, name: 'général', unread: 0 },
  { id: 2, name: 'sprint-planning', unread: 0 },
  { id: 3, name: 'backlog-grooming', unread: 0 },
  { id: 4, name: 'daily-standup', unread: 0 },
  { id: 5, name: 'retrospective', unread: 0 },
];

// Custom scrollbar styles
const ScrollbarStyle = {
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'transparent',
    borderRadius: '4px',
  },
  '&:hover::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 0, 0, 0.2)',
  },
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
};

// Styled components with fixed layout
const ChatContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: '#f7f9fc',
});

const SidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open'
})(({ theme, open }) => ({
  width: 280,
  backgroundColor: '#1A237E',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  [theme.breakpoints.down('md')]: {
    position: 'fixed',
    zIndex: 1200,
    left: open ? 0 : -280,
    top: 0,
    height: '100%',
    transition: 'left 0.3s ease-in-out',
  },
}));

const MainArea = styled(Box)({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  width: 'calc(100% - 280px)',
});

const ChannelItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'hasUnread'
})(({ theme, active, hasUnread }) => ({
  borderRadius: 8,
  margin: '4px 8px',
  cursor: 'pointer',
  backgroundColor: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  '& .MuiListItemText-primary': {
    fontWeight: hasUnread || active ? 600 : 400,
    fontSize: '0.95rem',
  },
}));

const MemberItem = styled(ListItem)({
  borderRadius: 8,
  margin: '2px 8px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

const MessageContainer = styled(Box)({
  flexGrow: 1,
  padding: '20px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#ffffff',
  marginLeft: 0,
  ...ScrollbarStyle
});

const SidebarScroll = styled(Box)({
  overflowY: 'auto',
  flexGrow: 1,
  height: '100%',
  ...ScrollbarStyle
});

const MessageItem = styled(Box)({
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'flex-start',
});

const MessageContent = styled(Box)({
  marginLeft: '12px',
  flexGrow: 1,
});

const InputArea = styled(Box)({
  padding: '12px 20px 16px',
  borderTop: '1px solid rgba(0, 0, 0, 0.08)',
  backgroundColor: '#ffffff',
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    backgroundColor: '#f5f7fa',
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#5B9BD5',
      }
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#1A237E',
      borderWidth: '2px',
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderWidth: '1.5px',
  },
  '& .MuiInputBase-input': {
    padding: '12px 14px',
  }
}));

const SendButton = styled(Button)({
  borderRadius: 8,
  padding: '8px 16px',
  marginLeft: '10px',
  boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease-in-out',
  background: 'linear-gradient(135deg, #5B9BD5 0%, #3F51B5 100%)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    background: 'linear-gradient(135deg, #6BA5DB 0%, #4A5AC6 100%)',
  }
});

const FileAttachment = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f2f6fc',
  borderRadius: 8,
  padding: '8px 12px',
  marginTop: '8px',
  marginRight: '8px',
  border: '1px solid #e0e7ef',
  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
  maxWidth: 'fit-content',
});

const StatusBadge = styled(Badge, {
  shouldForwardProp: (prop) => prop !== 'status'
})(({ theme, status }) => {
  let bgColor = '#ccc';
  if (status === 'online') bgColor = '#4caf50';
  else if (status === 'away') bgColor = '#ff9800';

  return {
    '& .MuiBadge-badge': {
      backgroundColor: bgColor,
      color: bgColor,
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        content: '""',
      }
    }
  };
});

const SectionTitle = styled(Typography)({
  fontSize: '0.9rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'rgba(255, 255, 255, 0.7)',
  padding: '16px 16px 8px',
});

// Utility functions
const formatTimestamp = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffHours < 48) {
    return 'Hier ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' +
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

const getFileIcon = (fileType) => {
  switch(fileType) {
    case 'pdf':
      return <PictureAsPdfIcon color="error" />;
    case 'image':
      return <ImageIcon color="primary" />;
    case 'doc':
    case 'docx':
      return <DescriptionIcon color="primary" />;
    default:
      return <InsertDriveFileIcon color="action" />;
  }
};

const GroupDiscussion = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [messages, setMessages] = useState(JSON.parse(localStorage.getItem('messages')) || []);
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(DEFAULT_CHANNELS[0]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Emoji picker state
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const emojiPickerOpen = Boolean(emojiAnchorEl);

  // Get users from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const teamMembers = JSON.parse(localStorage.getItem('users')) || [];

  // Check if discussion is possible
  const canCommunicate = currentUser && teamMembers.length > 0;

  // Generate random statuses for members
  const getRandomStatus = () => {
    const statuses = ['online', 'away', 'offline'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update unread messages and persist messages
  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
    if (messages.length > 0) {
      setSelectedChannel(prev => ({
        ...prev,
        unread: prev.unread + 1
      }));
    }
  }, [messages]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEmojiPickerOpen = (event) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiPickerClose = () => {
    setEmojiAnchorEl(null);
  };

  const handleEmojiClick = (emojiData) => {
    setMessageInput(prev => prev + emojiData.emoji);
  };

  const handleSendMessage = () => {
    if (!canCommunicate || (messageInput.trim() === '' && attachedFiles.length === 0)) return;
    
    const newMessage = {
      id: messages.length + 1,
      senderId: currentUser.id,
      content: messageInput,
      timestamp: new Date().toISOString(),
      attachments: attachedFiles,
      replyTo
    };
    
    setMessages([...messages, newMessage]);
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
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      };
    });
    
    setAttachedFiles([...attachedFiles, ...newAttachments]);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const removeAttachment = (id) => {
    setAttachedFiles(attachedFiles.filter(file => file.id !== id));
  };

  // Find message sender
  const getSender = (senderId) => {
    if (senderId === currentUser?.id) {
      return {
        ...currentUser,
        name: currentUser.prenom || currentUser.nom ? `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() : 'Vous'
      };
    }
    const member = teamMembers.find(m => m.id === senderId);
    return member ? {
      ...member,
      name: `${member.prenom || ''} ${member.nom || ''}`.trim() || 'Utilisateur inconnu'
    } : { 
      id: senderId, 
      name: 'Utilisateur inconnu', 
      prenom: 'Inconnu', 
      nom: 'Utilisateur' 
    };
  };

  return (
    <ChatContainer>
      {/* Sidebar for channels and team members */}
      <SidebarContainer open={sidebarOpen}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>AxiaAgile</Typography>
          {isMobile && (
            <IconButton size="small" onClick={() => setSidebarOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
        
        <SidebarScroll>
          {/* Channels section */}
          <SectionTitle>CANAUX</SectionTitle>
          <List component="nav" dense>
            {DEFAULT_CHANNELS.map(channel => (
              <ChannelItem 
                key={channel.id}
                active={channel.id === selectedChannel.id}
                hasUnread={channel.unread > 0}
                onClick={() => setSelectedChannel(channel)}
              >
                <ListItemText primary={`# ${channel.name}`} />
                {channel.unread > 0 && (
                  <Badge badgeContent={channel.unread} color="error" />
                )}
              </ChannelItem>
            ))}
          </List>
          
          {/* Team members section */}
          <SectionTitle>MEMBRES DE L'ÉQUIPE</SectionTitle>
          {teamMembers.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', px: 2 }}>
              Aucun membre disponible
            </Typography>
          ) : (
            <List dense>
              {teamMembers.map(member => (
                <MemberItem key={member.id}>
                  <ListItemAvatar>
                    <StatusBadge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      status={getRandomStatus()}
                    >
                      <Avatar>
                        {member.prenom?.[0] || member.nom?.[0] || '?'}
                      </Avatar>
                    </StatusBadge>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={`${member.prenom || ''} ${member.nom || ''}`.trim() || 'Utilisateur inconnu'} 
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      style: {
                        fontWeight: 500,
                        color: '#fff'
                      }
                    }}
                  />
                </MemberItem>
              ))}
            </List>
          )}
        </SidebarScroll>
      </SidebarContainer>
      
      {/* Main area */}
      <MainArea>
        {/* Channel header */}
        <AppBar position="static" color="default" elevation={0} sx={{ backgroundColor: '#fff', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Toolbar>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={() => setSidebarOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', fontWeight: 600, color: '#1A237E' }}>
              # {selectedChannel.name}
            </Typography>
            <Tooltip title="Informations du canal">
              <IconButton color="primary">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        
        {/* Message area */}
        <MessageContainer>
          {!canCommunicate ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              Veuillez configurer les utilisateurs pour commencer la discussion.
            </Typography>
          ) : messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              Aucun message dans ce canal. Commencez la discussion !
            </Typography>
          ) : (
            messages.map(message => {
              const sender = getSender(message.senderId);
              const replyToMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;
              const replyToSender = replyToMessage ? getSender(replyToMessage.senderId) : null;
              return (
                <MessageItem key={message.id}>
                  <Avatar sx={{ bgcolor: sender.id === currentUser?.id ? '#1A237E' : '#5B9BD5' }}>
                    {sender.prenom?.[0] || sender.nom?.[0] || '?'}
                  </Avatar>
                  <MessageContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 1 }}>
                        {sender.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(message.timestamp)}
                      </Typography>
                    </Box>
                    {replyToMessage && (
                      <Box sx={{ backgroundColor: '#f5f7fa', p: 1, borderRadius: 1, mb: 1, borderLeft: '3px solid #ccc' }}>
                        <Typography variant="caption" color="text.secondary">
                          En réponse à {replyToSender?.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                          {replyToMessage.content.slice(0, 50)}{replyToMessage.content.length > 50 ? '...' : ''}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                    {message.attachments.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                        {message.attachments.map(file => (
                          <FileAttachment key={file.id}>
                            {getFileIcon(file.type)}
                            <Box sx={{ ml: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
        
        {/* Attached files waiting to be sent */}
        {attachedFiles.length > 0 && (
          <Box sx={{ backgroundColor: '#fff', padding: '8px 20px', display: 'flex', flexWrap: 'wrap' }}>
            {attachedFiles.map(file => (
              <Paper
                key={file.id}
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 2,
                  border: '1px solid #e0e7ef',
                  padding: '4px 8px',
                  marginRight: 1,
                  marginBottom: 1,
                  backgroundColor: '#f2f6fc',
                }}
              >
                {getFileIcon(file.type)}
                <Typography variant="body2" sx={{ mx: 1 }}>
                  {file.name}
                </Typography>
                <IconButton size="small" onClick={() => removeAttachment(file.id)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>
        )}
        
        {/* Input area */}
        <InputArea>
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <StyledTextField
              id="message-input"
              fullWidth
              multiline
              maxRows={4}
              placeholder={canCommunicate ? `Message pour #${selectedChannel.name}` : 'Discussion désactivée'}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              disabled={!canCommunicate}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Ajouter un emoji">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          disabled={!canCommunicate}
                          onClick={handleEmojiPickerOpen}
                        >
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
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={handleMenuOpen}
                          disabled={!canCommunicate}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
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
      
      {/* Emoji Picker Popover */}
      <Popover
        open={emojiPickerOpen}
        anchorEl={emojiAnchorEl}
        onClose={handleEmojiPickerClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <EmojiPicker onEmojiClick={handleEmojiClick} />
      </Popover>
      
      {/* Menu for additional options */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleMenuClose}>Créer un snippet de code</MenuItem>
        <MenuItem onClick={handleMenuClose}>Créer un sondage</MenuItem>
        <MenuItem onClick={handleMenuClose}>Partager un écran</MenuItem>
        <MenuItem onClick={handleMenuClose}>Plus d'options...</MenuItem>
      </Menu>
    </ChatContainer>
  );
};

export default GroupDiscussion;