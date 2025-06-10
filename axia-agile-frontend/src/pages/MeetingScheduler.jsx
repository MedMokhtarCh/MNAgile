import React, { useEffect } from 'react';
import {
  Button,
  Container,
  Box,
  Alert,
  Snackbar,
  Stack,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Logout as LogoutIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import {
  setIsSignedIn,
  setTokenStored,
  setOrganizerEmail,
  showNotification,
  closeNotification,
  fetchEvents,
} from '../store/slices/meetingSlice';

import PageTitle from '../components/common/PageTitle';
import MeetingCard from '../components/meeting/MeetingCard';
import MeetingForm from '../components/meeting/MeetingForm';
import theme from '../components/meeting/theme';

export default function MeetingScheduler() {
  const dispatch = useDispatch();
  const { isSignedIn, loading, notification, createdEvents, tokenStored, organizerEmail, isEditing, event } =
    useSelector((state) => state.meeting);

  const apiClientId = import.meta.env.VITE_CLIENT_ID || '';
  const API_KEY = import.meta.env.VITE_API_KEY || '';
  const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email';
  let tokenClient;

  useEffect(() => {
    if (!apiClientId) {
      dispatch(showNotification({ message: 'Client ID manquant. Veuillez configurer VITE_CLIENT_ID.', severity: 'error' }));
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
              dispatch(setIsSignedIn(true));
              window.gapi.client.setToken({ access_token: tokenResponse.access_token });
              localStorage.setItem('googleCalendarToken', tokenResponse.access_token);
              dispatch(setTokenStored(true));
              try {
                const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const userInfo = await response.json();
                dispatch(setOrganizerEmail(userInfo.email || ''));
                dispatch(fetchEvents(tokenResponse.access_token));
              } catch (error) {
                console.error('Error fetching user info:', error);
                dispatch(
                  showNotification({ message: `Erreur lors de la récupération de l'email : ${error.message}`, severity: 'error' })
                );
              }
            } else {
              dispatch(showNotification({ message: "Échec de l'authentification", severity: 'error' }));
            }
          },
        });
      },
      (error) => dispatch(showNotification({ message: error, severity: 'error' }))
    );

    const gapiScript = loadScript(
      'https://apis.google.com/js/api.js',
      () => {
        window.gapi.load('client', () => {
          window.gapi.client
            .init({
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
              ...(API_KEY && { apiKey: API_KEY }),
            })
            .then(() => {
              const storedToken = localStorage.getItem('googleCalendarToken');
              if (storedToken) {
                window.gapi.client.setToken({ access_token: storedToken });
                window.gapi.client.calendar.calendarList
                  .list()
                  .then(() => {
                    console.log('Token valide, session restaurée');
                    dispatch(setIsSignedIn(true));
                    dispatch(setTokenStored(true));
                    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                      headers: { Authorization: `Bearer ${storedToken}` },
                    })
                      .then((response) => {
                        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                        return response.json();
                      })
                      .then((userInfo) => {
                        dispatch(setOrganizerEmail(userInfo.email || ''));
                        dispatch(fetchEvents(storedToken));
                      })
                      .catch((error) => {
                        console.error('Error fetching user info:', error);
                        dispatch(
                          showNotification({
                            message: `Erreur lors de la récupération de l'email : ${error.message}`,
                            severity: 'error',
                          })
                        );
                        localStorage.removeItem('googleCalendarToken');
                        dispatch(setIsSignedIn(false));
                        dispatch(setTokenStored(false));
                        window.gapi.client.setToken(null);
                      });
                  })
                  .catch((error) => {
                    console.error('Invalid token:', error);
                    localStorage.removeItem('googleCalendarToken');
                    dispatch(setIsSignedIn(false));
                    dispatch(setTokenStored(false));
                    window.gapi.client.setToken(null);
                  });
              }
            })
            .catch((error) => {
              console.error('Error initializing gapi client:', error);
              dispatch(showNotification({ message: `Erreur d'initialisation de l'API : ${error.message}`, severity: 'error' }));
            });
        });
      },
      (error) => dispatch(showNotification({ message: error, severity: 'error' }))
    );

    return () => {
      if (document.body.contains(gisScript)) document.body.removeChild(gisScript);
      if (document.body.contains(gapiScript)) document.body.removeChild(gapiScript);
    };
  }, [apiClientId, API_KEY, dispatch]);

  const handleAuthClick = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      dispatch(showNotification({ message: 'Client OAuth non initialisé', severity: 'error' }));
    }
  };

  const handleSignoutClick = () => {
    const token = window.gapi.client.getToken();
    if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {
        dispatch(setIsSignedIn(false));
        dispatch(setTokenStored(false));
        dispatch(setOrganizerEmail(''));
        window.gapi.client.setToken(null);
        localStorage.removeItem('googleCalendarToken');
        dispatch(showNotification({ message: 'Déconnexion réussie', severity: 'success' }));
      });
    } else {
      dispatch(setIsSignedIn(false));
      dispatch(setTokenStored(false));
      dispatch(setOrganizerEmail(''));
      window.gapi.client.setToken(null);
      localStorage.removeItem('googleCalendarToken');
      dispatch(showNotification({ message: 'Déconnexion réussie', severity: 'success' }));
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => dispatch(closeNotification())}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => dispatch(closeNotification())} severity={notification.severity} variant="filled">
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

        <MeetingForm
          handleAuthClick={handleAuthClick}
          isSignedIn={isSignedIn}
          loading={loading}
          event={event}
          organizerEmail={organizerEmail}
          isEditing={isEditing}
        />

        <MeetingCard events={createdEvents} />
      </Container>
    </ThemeProvider>
  );
}