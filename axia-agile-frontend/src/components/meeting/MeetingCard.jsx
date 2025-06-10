import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  VideoCall as VideoCallIcon,
  ContentCopy as ContentCopyIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { editEvent, deleteEvent, showNotification } from '../../store/slices/meetingSlice';

export default function MeetingCard({ events }) {
  const dispatch = useDispatch();

  const copyMeetLink = (meetLink) => {
    navigator.clipboard
      .writeText(meetLink)
      .then(() =>
        dispatch(showNotification({ message: 'Lien de réunion copié dans le presse-papiers!', severity: 'success' }))
      )
      .catch(() => dispatch(showNotification({ message: 'Erreur lors de la copie du lien', severity: 'error' })));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString.dateTime);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Box sx={{ mt: 6, mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 500, mb: 1 }}>
          Réunions créées
        </Typography>
        {events.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {events.length} événement(s)
          </Typography>
        )}
      </Box>
      <Divider sx={{ mb: 3 }} />
      {events.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune réunion n'a encore été créée
        </Alert>
      ) : (
        <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
          {events.map((evt) => (
            <Box
              key={evt.id}
              sx={{
                mb: 4,
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                position: 'relative',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1 }}>
                <IconButton
                  aria-label="modifier"
                  onClick={() => dispatch(editEvent(evt))}
                  size="small"
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  aria-label="supprimer"
                  onClick={() => dispatch(deleteEvent(evt.id))}
                  size="small"
                  color="secondary"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Typography variant="h6" gutterBottom>
                {evt.summary}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <EventIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {formatDate(evt.start)}
              </Typography>
              {evt.description && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Description: {evt.description}
                </Typography>
              )}
              {evt.location && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Lieu: {evt.location}
                </Typography>
              )}
              {evt.attendees && evt.attendees.length > 0 && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Participants: {evt.attendees.map((a) => a.email).join(', ')}
                </Typography>
              )}
              <Alert severity="success" sx={{ mt: 2, mb: 2 }} icon={false}>
                <Typography variant="caption">
                  Les participants n'ont pas besoin de compte Google pour rejoindre
                </Typography>
              </Alert>
              <Stack spacing={1}>
                {evt.meetLink && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<VideoCallIcon />}
                      fullWidth
                      href={evt.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ py: 1 }}
                    >
                      Rejoindre la réunion (sans compte requis)
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<ContentCopyIcon />}
                      fullWidth
                      onClick={() => copyMeetLink(evt.meetLink)}
                      sx={{ py: 1 }}
                    >
                      Copier le lien de réunion
                    </Button>
                  </>
                )}
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<LinkIcon />}
                  fullWidth
                  href={evt.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ py: 1 }}
                >
                  Voir dans Google Calendar
                </Button>
              </Stack>
            </Box>
          ))}
        </Box>
      )}
    </>
  );
}