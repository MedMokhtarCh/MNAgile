import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import profileReducer from './slices/profileSlice';
import projectsReducer from './slices/projectsSlice';
import tasksReducer from './slices/taskSlice';
import chatReducer from './slices/chatSlice'



export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    profile: profileReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
    chat: chatReducer,
  },
});