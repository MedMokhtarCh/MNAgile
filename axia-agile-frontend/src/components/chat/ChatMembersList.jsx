import React from 'react';
import { Drawer, Box, Typography, List, ListItem, ListItemText, Divider, IconButton, Avatar, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

const MembersDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    backgroundColor: '#e3f2fd',
  },
}));

const MemberItem = styled(ListItem)(({ theme }) => ({
  borderRadius: 6,
  margin: '4px 0',
  padding: '8px 12px',
  '&:hover': {
    backgroundColor: '#bbdefb',
  },
}));

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase();
};

const ChatMembersList = ({ open, onClose, members, currentUserId }) => {
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
                <Chip size="small" label="Vous" color="primary" sx={{ ml: 1 }} />
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

export default ChatMembersList;