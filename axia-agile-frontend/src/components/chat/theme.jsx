import { styled } from '@mui/material/styles';
import { Box, TextField, Button, ListItem, Dialog, Drawer } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Image from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

export const ChatContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  width: '100%',
  backgroundColor: '#e3f2fd',
  overflow: 'hidden',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
  position: 'relative',
  top: 0,
});

export const SidebarContainer = styled(Box, {
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

export const MembersDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    backgroundColor: '#e3f2fd',
  },
}));

export const MainArea = styled(Box)({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
});

export const ChannelItem = styled(ListItem, {
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

export const MessageContainer = styled(Box)({
  flexGrow: 1,
  padding: '16px 20px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f0f7ff',
  '&::-webkit-scrollbar': { display: 'none' },
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
});

export const InputArea = styled(Box)({
  padding: '12px 16px',
  borderTop: '1px solid #bbdefb',
  backgroundColor: '#ffffff',
});

export const StyledTextField = styled(TextField)(({ theme }) => ({
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

export const SendButton = styled(Button)(({ theme }) => ({
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

export const FileAttachment = styled(Box)({
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

export const MemberItem = styled(ListItem)(({ theme }) => ({
  borderRadius: 6,
  margin: '4px 0',
  padding: '8px 12px',
  '&:hover': {
    backgroundColor: '#bbdefb',
  },
}));

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    width: '600px',
    maxWidth: '90vw',
    borderRadius: '12px',
    padding: theme.spacing(2),
    backgroundColor: '#f0f7ff',
  },
}));

export const formatTimestamp = (isoString) => {
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

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase();
};

export const getFileIcon = (fileName) => {
  if (fileName.endsWith('.pdf')) return <PictureAsPdfIcon color="error" />;
  if (/\.(jpg|jpeg|png|gif)$/i.test(fileName)) return <Image color="primary" />;
  if (/\.(doc|docx)$/i.test(fileName)) return <DescriptionIcon color="primary" />;
  return <InsertDriveFileIcon color="action" />;
};

export const getAvatarColor = (name) => {
  const colors = ['#42a5f5', '#90caf9', '#64b5f6', '#bbdefb'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const playAudio = (audio, type) => {
  if (document.visibilityState === 'visible') {
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.error(`Failed to play ${type} sound:`, error);
    });
  } else {
    console.log(`Sound (${type}) not played: Tab is not visible`);
  }
};