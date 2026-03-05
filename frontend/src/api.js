import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const movieApi = {
  getAll: (page = 1, limit = 20, year = '') => 
    api.get(`/movies?page=${page}&limit=${limit}${year ? `&year=${year}` : ''}`),
  getById: (id) => api.get(`/movies/${id}`),
  search: (query) => api.get(`/movies/search?q=${query}`),
};

export const personApi = {
  getById: (id) => api.get(`/persons/${id}`),
  search: (query) => api.get(`/persons/search?q=${query}`),
};

export default api;
