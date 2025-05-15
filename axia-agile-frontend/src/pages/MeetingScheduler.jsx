// MeetingCreator.js
import React, { useState, useEffect } from 'react';

const MeetingScheduler = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    attendees: ''
  });
  const [meetingLink, setMeetingLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configuration Google API
  const API_KEY = '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';
  const CLIENT_ID = '638798047792-21apfeg7kp41ggitsdrab07kqj6rlj5p.apps.googleusercontent.com';
  const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
  const SCOPES = "https://www.googleapis.com/auth/calendar";

  useEffect(() => {
    // Charger le script Google API
    const script = document.createElement('script');
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      window.gapi.load('client:auth2', initClient);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initClient = () => {
    window.gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES
    }).then(() => {
      // Écouter les changements d'état de connexion
      window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      
      // Définir l'état de connexion initial
      updateSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
    }).catch(error => {
      setError(`Erreur lors de l'initialisation de l'API Google: ${error.details}`);
    });
  };

  const updateSigninStatus = (isSignedIn) => {
    setIsSignedIn(isSignedIn);
  };

  const handleSignIn = () => {
    window.gapi.auth2.getAuthInstance().signIn();
  };

  const handleSignOut = () => {
    window.gapi.auth2.getAuthInstance().signOut();
    setMeetingLink('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMeetingDetails(prev => ({ ...prev, [name]: value }));
  };

  const createMeeting = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Formater les données pour l'API Google Calendar
      const startDateTime = `${meetingDetails.date}T${meetingDetails.startTime}:00`;
      const endDateTime = `${meetingDetails.date}T${meetingDetails.endTime}:00`;
      
      const attendeesList = meetingDetails.attendees
        .split(',')
        .map(email => ({ email: email.trim() }));

      const event = {
        summary: meetingDetails.title,
        description: meetingDetails.description,
        start: {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: attendeesList,
        conferenceData: {
          createRequest: {
            requestId: `meeting-${Date.now()}`
          }
        }
      };

      // Créer l'événement dans Google Calendar avec les données de conférence
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1
      });

      // Récupérer le lien de la conférence
      const createdEvent = response.result;
      if (createdEvent.conferenceData && createdEvent.conferenceData.entryPoints) {
        const meetEntryPoint = createdEvent.conferenceData.entryPoints.find(
          ep => ep.entryPointType === 'video'
        );
        if (meetEntryPoint) {
          setMeetingLink(meetEntryPoint.uri);
        }
      }
      
      // Réinitialiser le formulaire
      setMeetingDetails({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        attendees: ''
      });
      
    } catch (error) {
      setError(`Erreur lors de la création de la réunion: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Créateur de Réunion Google Meet</h2>
      
      {!isSignedIn ? (
        <button 
          onClick={handleSignIn}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Se connecter avec Google
        </button>
      ) : (
        <>
          <button 
            onClick={handleSignOut}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 mb-6"
          >
            Se déconnecter
          </button>
          
          <form onSubmit={createMeeting}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Titre de la réunion</label>
              <input
                type="text"
                name="title"
                value={meetingDetails.title}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={meetingDetails.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows="3"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={meetingDetails.date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-gray-700 mb-2">Heure de début</label>
                <input
                  type="time"
                  name="startTime"
                  value={meetingDetails.startTime}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-gray-700 mb-2">Heure de fin</label>
                <input
                  type="time"
                  name="endTime"
                  value={meetingDetails.endTime}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Participants (emails séparés par des virgules)</label>
              <input
                type="text"
                name="attendees"
                value={meetingDetails.attendees}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="exemple@email.com, autre@email.com"
              />
            </div>
            
            <button
              type="submit"
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
              disabled={isLoading}
            >
              {isLoading ? 'Création en cours...' : 'Créer la réunion'}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {meetingLink && (
            <div className="mt-6 p-4 bg-green-100 rounded">
              <h3 className="font-bold text-green-800 mb-2">Réunion créée avec succès!</h3>
              <p className="mb-2">Lien Google Meet:</p>
              <a 
                href={meetingLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                {meetingLink}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MeetingScheduler;