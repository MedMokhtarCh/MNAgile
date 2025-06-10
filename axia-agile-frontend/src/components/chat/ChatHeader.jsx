import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Button, AvatarGroup, Tooltip, Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import { getInitials } from './theme';

const ChatHeader = ({ isMobile, setSidebarOpen, selectedChannel, channelMembers, currentUser, toggleMembersDrawer }) => {
  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ backgroundColor: '#ffffff', borderBottom: '1px solid #bbdefb' }}>
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
            <AvatarGroup max={3} sx={{ mr: 2, '& .MuiAvatar-root': { width: 30, height: 30 } }}>
              {channelMembers.slice(0, 3).map((member) => (
                <Tooltip key={member.id} title={`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Utilisateur inconnu'}>
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
  );
};

export default ChatHeader;