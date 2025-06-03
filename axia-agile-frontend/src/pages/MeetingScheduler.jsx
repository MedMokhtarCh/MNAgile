import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  FormControlLabel,
  Typography,
  Container,
  Box,
  Alert,
  Snackbar,
  Divider,
  CircularProgress,
  IconButton,
  Switch,
  FormGroup,
  Stack,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Event as EventIcon,
  VideoCall as VideoCallIcon,
  Link as LinkIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  Google as GoogleIcon,
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PageTitle from '../components/common/PageTitle';

const theme = createTheme({
  palette: {
    primary: { main: '#1a73e8' }, // Google Blue
    secondary: { main: '#ea4335' }, // Google Red
    success: { main: '#34a853' }, // Google Green
    background: { default: '#f1f3f4' }, // Light grey background
  },
  typography: {
    fontFamily: ['Google Sans', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { borderRadius: 8, textTransform: 'none', fontWeight: 500 } },
    },
    MuiPaper: {
      styleOverrides: { root: { borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } },
    },
  },
});

export default function GoogleCalendarForm() {
  const [event, setEvent] = useState({
    id: null,
    summary: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    attendees: '',
    withMeet: true,
  });
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [createdEvents, setCreatedEvents] = useState([]);
  const [tokenStored, setTokenStored] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [organizerEmail, setOrganizerEmail] = useState('');

  const apiClientId = import.meta.env.VITE_CLIENT_ID || '';
  const API_KEY = import.meta.env.VITE_API_KEY || '';
  const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email';
  let tokenClient;

  useEffect(() => {
    if (!apiClientId) {
      showNotification('Client ID manquant. Veuillez configurer VITE_CLIENT_ID.', 'error');
      return;
    }

    const loadScript = (src, onLoad, onError) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = onLoad;
      script.onerror = () => onError(`Échec du chargement du script : ${src}`);
      document.body.appendChild(script);
      return script;
    };

    const gisScript = loadScript(
      'https://accounts.google.com/gsi/client',
      () => {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: apiClientId,
          scope: SCOPES,
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              setIsSignedIn(true);
              window.gapi.client.setToken({ access_token: tokenResponse.access_token });
              localStorage.setItem('googleCalendarToken', tokenResponse.access_token);
              setTokenStored(true);
              try {
                const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const userInfo = await response.json();
                setOrganizerEmail(userInfo.email || '');
                fetchEvents(tokenResponse.access_token);
              } catch (error) {
                console.error('Error fetching user info:', error);
                showNotification(`Erreur lors de la récupération de l'email : ${error.message}`, 'error');
              }
            } else {
              showNotification('Échec de l\'authentification', 'error');
            }
          },
        });
      },
      (error) => showNotification(error, 'error')
    );

    const gapiScript = loadScript(
      'https://apis.google.com/js/api.js',
      () => {
        window.gapi.load('client', () => {
          window.gapi.client
            .init({
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
              ...(API_KEY && { apiKey: API_KEY }), // Only include API_KEY if provided
            })
            .then(() => {
              const storedToken = localStorage.getItem('googleCalendarToken');
              if (storedToken) {
                window.gapi.client.setToken({ access_token: storedToken });
                window.gapi.client.calendar.calendarList
                  .list()
                  .then(() => {
                    console.log('Token valide, session restaurée');
                    setIsSignedIn(true);
                    setTokenStored(true);
                    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                      headers: { Authorization: `Bearer ${storedToken}` },
                    })
                      .then((response) => {
                        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                        return response.json();
                      })
                      .then((userInfo) => {
                        setOrganizerEmail(userInfo.email || '');
                        fetchEvents(storedToken);
                      })
                      .catch((error) => {
                        console.error('Error fetching user info:', error);
                        showNotification(`Erreur lors de la récupération de l'email : ${error.message}`, 'error');
                        localStorage.removeItem('googleCalendarToken');
                        setIsSignedIn(false);
                        setTokenStored(false);
                        window.gapi.client.setToken(null);
                      });
                  })
                  .catch((error) => {
                    console.error('Invalid token:', error);
                    localStorage.removeItem('googleCalendarToken');
                    setIsSignedIn(false);
                    setTokenStored(false);
                    window.gapi.client.setToken(null);
                  });
              }
            })
            .catch((error) => {
              console.error('Error initializing gapi client:', error);
              showNotification(`Erreur d'initialisation de l'API : ${error.message}`, 'error');
            });
        });
      },
      (error) => showNotification(error, 'error')
    );

    return () => {
      if (document.body.contains(gisScript)) document.body.removeChild(gisScript);
      if (document.body.contains(gapiScript)) document.body.removeChild(gapiScript);
    };
  }, [apiClientId, API_KEY]);

  const fetchEvents = async (accessToken) => {
    setLoading(true);
    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      });
      const events = response.result.items.map((evt) => ({
        id: evt.id,
        summary: evt.summary || '',
        description: evt.description || '',
        location: evt.location || '',
        start: evt.start,
        end: evt.end || evt.start,
        attendees: evt.attendees || [],
        meetLink: evt.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri || '',
        htmlLink: evt.htmlLink,
        conferenceData: evt.conferenceData,
      }));
      setCreatedEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      showNotification(`Erreur lors de la récupération des événements : ${error.result?.error?.message || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthClick = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      showNotification('Client OAuth non initialisé', 'error');
    }
  };

  const handleSignoutClick = () => {
    const token = window.gapi.client.getToken();
    if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {
        setIsSignedIn(false);
        setTokenStored(false);
        setOrganizerEmail('');
        window.gapi.client.setToken(null);
        localStorage.removeItem('googleCalendarToken');
        setCreatedEvents([]);
        showNotification('Déconnexion réussie', 'success');
      });
    } else {
      setIsSignedIn(false);
      setTokenStored(false);
      setOrganizerEmail('');
      window.gapi.client.setToken(null);
      localStorage.removeItem('googleCalendarToken');
      setCreatedEvents([]);
      showNotification('Déconnexion réussie', 'success');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    setEvent((prev) => ({ ...prev, withMeet: e.target.checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!event.summary || !event.startDate || !event.startTime || !event.endDate || !event.endTime) {
      showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    if (!isSignedIn) {
      handleAuthClick();
      return;
    }
    if (isEditing) {
      updateEvent();
    } else {
      createEvent();
    }
  };

  const createEvent = async () => {
    setLoading(true);
    try {
      const startDateTime = new Date(`${event.startDate}T${event.startTime}`);
      const endDateTime = new Date(`${event.endDate}T${event.endTime}`);
      if (isNaN(startDateTime) || isNaN(endDateTime)) {
        throw new Error('Dates invalides');
      }

      const attendeesList = event.attendees
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email)
        .map((email) => ({ email }));

      if (organizerEmail && !attendeesList.some((attendee) => attendee.email === organizerEmail)) {
        attendeesList.push({ email: organizerEmail });
      }

      const calendarEvent = {
        summary: event.summary,
        location: event.location,
        description: event.description,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: attendeesList,
        conferenceData: event.withMeet
          ? { createRequest: { requestId: `meet-${Date.now()}` } }
          : undefined,
      };

      await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent,
        conferenceDataVersion: event.withMeet ? 1 : 0,
        sendUpdates: 'all',
      });
      showNotification('Événement créé avec succès!', 'success');
      fetchEvents(window.gapi.client.getToken().access_token);
      resetForm();
    } catch (error) {
      console.error('Error creating event:', error);
      showNotification(`Erreur lors de la création de l'événement : ${error.result?.error?.message || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async () => {
    setLoading(true);
    try {
      const startDateTime = new Date(`${event.startDate}T${event.startTime}`);
      const endDateTime = new Date(`${event.endDate}T${event.endTime}`);
      if (isNaN(startDateTime) || isNaN(endDateTime)) {
        throw new Error('Dates invalides');
      }

      const attendeesList = event.attendees
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email)
        .map((email) => ({ email }));

      if (organizerEmail && !attendeesList.some((attendee) => attendee.email === organizerEmail)) {
        attendeesList.push({ email: organizerEmail });
      }

      const calendarEvent = {
        summary: event.summary,
        location: event.location,
        description: event.description,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: attendeesList,
        conferenceData: event.withMeet
          ? { createRequest: { requestId: `meet-${Date.now()}` } }
          : undefined,
      };

      await window.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: event.id,
        resource: calendarEvent,
        conferenceDataVersion: event.withMeet ? 1 : 0,
        sendUpdates: 'all',
      });
      showNotification('Événement mis à jour avec succès!', 'success');
      fetchEvents(window.gapi.client.getToken().access_token);
      resetForm();
    } catch (error) {
      console.error('Error updating event:', error);
      showNotification(`Erreur lors de la mise à jour de l'événement : ${error.result?.error?.message || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    if (!isSignedIn) {
      showNotification('Veuillez vous connecter pour supprimer un événement', 'error');
      return;
    }
    setLoading(true);
    try {
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all',
      });
      showNotification('Événement supprimé avec succès!', 'success');
      fetchEvents(window.gapi.client.getToken().access_token);
    } catch (error) {
      console.error('Error deleting event:', error);
      showNotification(`Erreur lors de la suppression de l'événement : ${error.result?.error?.message || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyMeetLink = (meetLink) => {
    navigator.clipboard
      .writeText(meetLink)
      .then(() => showNotification('Lien de réunion copié dans le presse-papiers!', 'success'))
      .catch(() => showNotification('Erreur lors de la copie du lien', 'error'));
  };

  const editEvent = (evt) => {
    setIsEditing(true);
    const attendeesWithoutOrganizer = evt.attendees
      ? evt.attendees.filter((a) => a.email !== organizerEmail).map((a) => a.email).join(', ')
      : '';
    setEvent({
      id: evt.id,
      summary: evt.summary || '',
      description: evt.description || '',
      location: evt.location || '',
      startDate: evt.start.dateTime ? evt.start.dateTime.split('T')[0] : '',
      startTime: evt.start.dateTime ? evt.start.dateTime.split('T')[1].slice(0, 5) : '',
      endDate: evt.end.dateTime ? evt.end.dateTime.split('T')[0] : evt.start.dateTime.split('T')[0],
      endTime: evt.end.dateTime ? evt.end.dateTime.split('T')[1].slice(0, 5) : '',
      attendees: attendeesWithoutOrganizer,
      withMeet: !!evt.conferenceData,
    });
  };

  const resetForm = () => {
    setEvent({
      id: null,
      summary: '',
      description: '',
      location: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      attendees: '',
      withMeet: true,
    });
    setIsEditing(false);
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  const closeNotification = () => {
    setNotification({ ...notification, open: false });
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
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={closeNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={closeNotification} severity={notification.severity} variant="filled">
            {notification.message}
          </Alert>
        </Snackbar>

        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <PageTitle>
            <EventIcon sx={{ mr: 1 }} />
            Gestionnaire d'événements Google Calendar
          </PageTitle>
          <Alert severity="info" sx={{ mt: 2, mx: 'auto', maxWidth: 600 }}>
            Seul l'organisateur doit se connecter à Google. Votre email (
            {organizerEmail || 'non connecté'}) sera automatiquement ajouté comme participant.
          </Alert>
          {!isSignedIn ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleAuthClick}
              disabled={loading || !apiClientId}
              startIcon={<GoogleIcon />}
              sx={{ mt: 3, py: 1.5, px: 4, fontSize: '1.1rem' }}
            >
              Connexion avec Google
            </Button>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mt: 3 }}>
              <Alert severity="success">
                Connecté en tant que {organizerEmail} {tokenStored && '(session sauvegardée)'}
              </Alert>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleSignoutClick}
                disabled={loading}
                startIcon={<LogoutIcon />}
                sx={{ py: 1, px: 3 }}
              >
                Déconnexion
              </Button>
            </Stack>
          )}
        </Box>

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
                ? 'Mettre à jour l\'événement'
                : isSignedIn
                ? 'Créer l\'événement'
                : 'Se connecter et créer'}
            </Button>
            {isEditing && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={resetForm}
                disabled={loading}
                sx={{ py: 1.5, px: 4, fontSize: '1.1rem' }}
              >
                Annuler la modification
              </Button>
            )}
          </Stack>
        </form>

        <Box sx={{ mt: 6, mb: 3 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 500, mb: 1 }}>
            Réunions créées
          </Typography>
          {createdEvents.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {createdEvents.length} événement(s)
            </Typography>
          )}
        </Box>
        <Divider sx={{ mb: 3 }} />
        {createdEvents.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Aucune réunion n'a encore été créée
          </Alert>
        ) : (
          <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
            {createdEvents.map((evt) => (
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
                  <IconButton aria-label="modifier" onClick={() => editEvent(evt)} size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="supprimer" onClick={() => deleteEvent(evt.id)} size="small" color="secondary">
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
      </Container>
    </ThemeProvider>
  );
}