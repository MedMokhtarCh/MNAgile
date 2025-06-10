import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Box, Typography, Button, List, ListItem, ListItemText, Divider, IconButton, Menu, MenuItem,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { setSelectedChannel } from '../../store/slices/chatSlice';

// Styled Components
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

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  background: 'linear-gradient(180deg, #90caf9 0%, #bbdefb 100%)', // Match SidebarContainer
  borderBottom: '1px solid rgba(30, 58, 138, 0.15)', // Adjusted to match Divider
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 48, // Compact height
}));

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

const ChatSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  channels,
  selectedChannel,
  hasCanCreateChannel,
  currentUser,
  setCreateChannelDialogOpen,
  setUpdateChannelDialogOpen,
  setDeleteChannelDialogOpen,
  setSelectedChannelForMenu,
  setMenuAnchorEl,
  menuAnchorEl,
  setErrorMessage,
  setErrorSnackbarOpen,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const handleSelectChannel = (channel) => {
    dispatch(setSelectedChannel(channel));
    setSidebarOpen(false);
  };

  const handleMenuOpen = (event, channel) => {
    event.stopPropagation();
    if (!hasCanCreateChannel) {
      console.log('Menu open blocked: Missing permission', { hasCanCreateChannel });
      setErrorMessage("Vous n'avez pas la permission de modifier ou supprimer un canal.");
      setErrorSnackbarOpen(true);
      return;
    }
    console.log('Opening menu for channel:', { channelId: channel.id, channelName: channel.name });
    setMenuAnchorEl(event.currentTarget);
    setSelectedChannelForMenu(channel);
  };

  const handleMenuClose = () => {
    console.log('Closing menu');
    setMenuAnchorEl(null);
  };

  const handleOpenDeleteDialog = () => {
    if (!hasCanCreateChannel) {
      setErrorMessage("Vous n'avez pas la permission de supprimer un canal.");
      setErrorSnackbarOpen(true);
      return;
    }
    setDeleteChannelDialogOpen(true);
    setMenuAnchorEl(null);
  };

  return (
    <SidebarContainer open={sidebarOpen}>
      <SidebarHeader>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
          AxiaAgile
        </Typography>
      </SidebarHeader>
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
                    <IconButton edge="end" size="small" onClick={(e) => handleMenuOpen(e, channel)}>
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
        <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => setUpdateChannelDialogOpen(true)}>
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
};

export default ChatSidebar;