import axios from 'axios';

const userApi = axios.create({
  baseURL: 'https://localhost:7151/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const profileApi = axios.create({
  baseURL: 'http://localhost:5289/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const projectApi = axios.create({
  baseURL: 'http://localhost:5273/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const taskApi = axios.create({
  baseURL: 'http://localhost:5064/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const discussionApi = axios.create({
  baseURL: 'https://localhost:7270/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});
const notificationApi = axios.create({
  baseURL: 'https://localhost:7147/api', 
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});



export { userApi, profileApi, projectApi, taskApi,discussionApi,notificationApi };