import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7151/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const profileApi = axios.create({
  baseURL: 'https://localhost:7240/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


const addTokenInterceptor = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
  
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Applique l'intercepteur aux deux instances
addTokenInterceptor(api);
addTokenInterceptor(profileApi);

// Exporte les deux instances comme exports nommés
// Pas d'export par défaut pour éviter l'erreur "does not provide an export named 'default'"
export { api, profileApi };