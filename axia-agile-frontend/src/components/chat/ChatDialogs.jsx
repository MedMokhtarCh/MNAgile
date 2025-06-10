import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Divider, IconButton,
  Typography, Box, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StyledDialog, getInitials, getAvatarColor } from './theme';
import InputUserAssignment from '../common/InputUserAssignment';

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
    <StyledDialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
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
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#ffffff' } }}
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
            '&:hover': { background: 'linear-gradient(135deg, #bbdefb 0%, #64b5f6 100%)' },
          }}
        >
          Créer
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

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
    <StyledDialog open={open} onClose={handleClose} fullWidth maxWidth="md">
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
          sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#ffffff' } }}
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
        <Button onClick={handleClose} sx={{ color: '#1e3a8a', borderRadius: '10px' }} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!channelName.trim() || isSubmitting}
          sx={{
            background: 'linear-gradient(135deg, #90caf9 0%, #42a5f5 100%)',
            borderRadius: '10px',
            '&:hover': { background: 'linear-gradient(135deg, #bbdefb 0%, #64b5f6 100%)' },
          }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Mettre à jour'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

const DeleteChannelDialog = ({ open, handleClose, handleConfirm, channelName }) => {
  return (
    <StyledDialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
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
        <Button onClick={handleConfirm} color="error" variant="contained" sx={{ borderRadius: '10px' }}>
          Supprimer
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

const ChatDialogs = ({
  createChannelDialogOpen,
  setCreateChannelDialogOpen,
  updateChannelDialogOpen,
  setUpdateChannelDialogOpen,
  deleteChannelDialogOpen,
  setDeleteChannelDialogOpen,
  handleCreateChannel,
  handleUpdateChannel,
  handleDeleteChannel,
  users,
  currentUser,
  selectedChannelForMenu,
  hasCanCreateChannel,
}) => {
  return (
    <>
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
            handleClose={() => setDeleteChannelDialogOpen(false)}
            handleConfirm={handleDeleteChannel}
            channelName={selectedChannelForMenu?.name || ''}
          />
        </>
      )}
    </>
  );
};

export default ChatDialogs;