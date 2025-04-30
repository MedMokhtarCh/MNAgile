import axios from 'axios';

const userApi = axios.create({
  baseURL: 'https://localhost:7151/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const profileApi = axios.create({
  baseURL: 'https://localhost:7240/api',
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

export { userApi, profileApi, projectApi };