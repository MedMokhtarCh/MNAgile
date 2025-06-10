import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import signupReducer from './slices/signupSlice';
import rolesReducer from './slices/rolesSlice';
import claimsReducer from './slices/claimsSlice';
import usersReducer from './slices/usersSlice';
import profileReducer from './slices/profileSlice';
import projectsReducer from './slices/projectsSlice';
import taskReducer from './slices/taskSlice';
import chatReducer from './slices/chatSlice';
import meetingReducer from './slices/meetingSlice';
import notificationReducer from './slices/notificationSlice';
import cahierDesChargesReducer from './slices/cahierDesChargesSlice';
import backlogReducer from './slices/backlogSlice';
import sprintReducer from './slices/sprintSlice';
import kanbanColumnReducer from './slices/kanbanColumnSlice';
import abonementReducer from './slices/abonementSlice';




export const store = configureStore({
  reducer: {
    auth: authReducer,
    signup: signupReducer,
    users: usersReducer,
    roles: rolesReducer,
    claims: claimsReducer,
    profile: profileReducer,
    projects: projectsReducer,
    tasks: taskReducer,
     backlogs: backlogReducer,
    sprints: sprintReducer,
   kanbanColumns: kanbanColumnReducer,
    chat: chatReducer,
    meeting: meetingReducer,
    notifications: notificationReducer,
  cahierDesCharges: cahierDesChargesReducer,
  abonement: abonementReducer,
  },
});