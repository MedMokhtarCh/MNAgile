import React from 'react';
import {
  Button,
  TextField,
  FormControlLabel,
  FormGroup,
  Box,
  CircularProgress,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { Event as EventIcon, VideoCall as VideoCallIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  setEvent,
  createEvent,
  updateEvent,
  resetForm,
  showNotification,
} from '../../store/slices/meetingSlice';

export default function MeetingForm({ handleAuthClick, isSignedIn, loading, event, organizerEmail, isEditing }) {
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(setEvent({ [name]: value }));
  };

  const handleSwitchChange = (e) => {
    dispatch(setEvent({ withMeet: e.target.checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!event.summary || !event.startDate || !event.startTime || !event.endDate || !event.endTime) {
      dispatch(showNotification({ message: 'Veuillez remplir tous les champs obligatoires', severity: 'error' }));
      return;
    }
    if (!isSignedIn) {
      handleAuthClick();
      return;
    }
    if (isEditing) {
      dispatch(updateEvent({ event, organizerEmail }));
    } else {
      dispatch(createEvent({ event, organizerEmail }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        fullWidth
        label="Titre de la réunion *"
        name="summary"
        value={event.summary}
        onChange={handleChange}
        disabled={loading}
        required
        margin="normal"
        variant="outlined"
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
      />
      <TextField
        fullWidth
        label="Description"
        name="description"
        value={event.description}
        onChange={handleChange}
        disabled={loading}
        multiline
        rows={3}
        margin="normal"
        variant="outlined"
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
      />
      <TextField
        fullWidth
        label="Lieu (optionnel)"
        name="location"
        value={event.location}
        onChange={handleChange}
        disabled={loading}
        margin="normal"
        variant="outlined"
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
      />
      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Date de début *"
          type="date"
          name="startDate"
          value={event.startDate}
          onChange={handleChange}
          disabled={loading}
          required
          InputLabelProps={{ shrink: true }}
          margin="normal"
          variant="outlined"
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
        />
        <TextField
          label="Heure de début *"
          type="time"
          name="startTime"
          value={event.startTime}
          onChange={handleChange}
          disabled={loading}
          required
          InputLabelProps={{ shrink: true }}
          margin="normal"
          variant="outlined"
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Date de fin *"
          type="date"
          name="endDate"
          value={event.endDate}
          onChange={handleChange}
          disabled={loading}
          required
          InputLabelProps={{ shrink: true }}
          margin="normal"
          variant="outlined"
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
        />
        <TextField
          label="Heure de fin *"
          type="time"
          name="endTime"
          value={event.endTime}
          onChange={handleChange}
          disabled={loading}
          required
          InputLabelProps={{ shrink: true }}
          margin="normal"
          variant="outlined"
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
        />
      </Box>
      <TextField
        fullWidth
        label="Participants supplémentaires (emails séparés par des virgules)"
        name="attendees"
        value={event.attendees}
        onChange={handleChange}
        disabled={loading}
        margin="normal"
        variant="outlined"
        placeholder="exemple@email.com, autre@email.com"
        helperText={`Votre email (${organizerEmail || 'non connecté'}) est automatiquement ajouté. Ajoutez d'autres emails ici si nécessaire.`}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
      />
      <FormGroup sx={{ mt: 2, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={event.withMeet}
              onChange={handleSwitchChange}
              name="withMeet"
              color="primary"
              disabled={loading}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <VideoCallIcon sx={{ mr: 1 }} />
              <Typography>Ajouter une visioconférence Google Meet</Typography>
            </Box>
          }
        />
      </FormGroup>
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EventIcon />}
          sx={{ py: 1.5, px: 4, fontSize: '1.1rem' }}
        >
          {loading
            ? 'Traitement en cours...'
            : isEditing
            ? "Mettre à jour l'événement"
            : isSignedIn
            ? "Créer l'événement"
            : 'Se connecter et créer'}
        </Button>
        {isEditing && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => dispatch(resetForm())}
            disabled={loading}
            sx={{ py: 1.5, px: 4, fontSize: '1.1rem' }}
          >
            Annuler la modification
          </Button>
        )}
      </Stack>
    </form>
  );
}