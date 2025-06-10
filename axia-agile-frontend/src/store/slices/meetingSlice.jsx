
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Initial state for the meeting slice
const initialState = {
  event: {
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
  },
  isSignedIn: false,
  loading: false,
  notification: { open: false, message: '', severity: 'success' },
  createdEvents: [],
  tokenStored: false,
  organizerEmail: '',
};

// Async thunks for API interactions
export const fetchEvents = createAsyncThunk(
  'meeting/fetchEvents',
  async (accessToken, { rejectWithValue }) => {
    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return response.result.items.map((evt) => ({
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
    } catch (error) {
      return rejectWithValue(error.result?.error?.message || error.message);
    }
  }
);

export const createEvent = createAsyncThunk(
  'meeting/createEvent',
  async ({ event, organizerEmail }, { rejectWithValue }) => {
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

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent,
        conferenceDataVersion: event.withMeet ? 1 : 0,
        sendUpdates: 'all',
      });
      return response.result;
    } catch (error) {
      return rejectWithValue(error.result?.error?.message || error.message);
    }
  }
);

export const updateEvent = createAsyncThunk(
  'meeting/updateEvent',
  async ({ event, organizerEmail }, { rejectWithValue }) => {
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

      const response = await window.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: event.id,
        resource: calendarEvent,
        conferenceDataVersion: event.withMeet ? 1 : 0,
        sendUpdates: 'all',
      });
      return response.result;
    } catch (error) {
      return rejectWithValue(error.result?.error?.message || error.message);
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'meeting/deleteEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all',
      });
      return eventId;
    } catch (error) {
      return rejectWithValue(error.result?.error?.message || error.message);
    }
  }
);

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    setEvent(state, action) {
      state.event = { ...state.event, ...action.payload };
    },
    setIsSignedIn(state, action) {
      state.isSignedIn = action.payload;
    },
    setTokenStored(state, action) {
      state.tokenStored = action.payload;
    },
    setOrganizerEmail(state, action) {
      state.organizerEmail = action.payload;
    },
    setIsEditing(state, action) {
      state.isEditing = action.payload;
    },
    showNotification(state, action) {
      state.notification = { open: true, ...action.payload };
    },
    closeNotification(state) {
      state.notification.open = false;
    },
    resetForm(state) {
      state.event = initialState.event;
      state.isEditing = false;
    },
    editEvent(state, action) {
      const evt = action.payload;
      const attendeesWithoutOrganizer = evt.attendees
        ? evt.attendees
            .filter((a) => a.email !== state.organizerEmail)
            .map((a) => a.email)
            .join(', ')
        : '';
      state.event = {
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
      };
      state.isEditing = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.createdEvents = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.notification = {
          open: true,
          message: `Erreur lors de la récupération des événements : ${action.payload}`,
          severity: 'error',
        };
      })
      // Create Event
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(createEvent.fulfilled, (state) => {
        state.loading = false;
        state.notification = {
          open: true,
          message: 'Événement créé avec succès!',
          severity: 'success',
        };
        state.event = initialState.event;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.notification = {
          open: true,
          message: `Erreur lors de la création de l'événement : ${action.payload}`,
          severity: 'error',
        };
      })
      // Update Event
      .addCase(updateEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateEvent.fulfilled, (state) => {
        state.loading = false;
        state.notification = {
          open: true,
          message: 'Événement mis à jour avec succès!',
          severity: 'success',
        };
        state.event = initialState.event;
        state.isEditing = false;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false;
        state.notification = {
          open: true,
          message: `Erreur lors de la mise à jour de l'événement : ${action.payload}`,
          severity: 'error',
        };
      })
      // Delete Event
      .addCase(deleteEvent.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.createdEvents = state.createdEvents.filter((evt) => evt.id !== action.payload);
        state.notification = {
          open: true,
          message: 'Événement supprimé avec succès!',
          severity: 'success',
        };
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading = false;
        state.notification = {
          open: true,
          message: `Erreur lors de la suppression de l'événement : ${action.payload}`,
          severity: 'error',
        };
      });
  },
});

export const {
  setEvent,
  setIsSignedIn,
  setTokenStored,
  setOrganizerEmail,
  setIsEditing,
  showNotification,
  closeNotification,
  resetForm,
  editEvent,
} = meetingSlice.actions;

export default meetingSlice.reducer;