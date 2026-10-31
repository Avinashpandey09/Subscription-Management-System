import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

export default api;

// Money helpers: the API stores integer paise; UI shows rupees.
export const rs = (paise) => `Rs ${(Number(paise || 0) / 100).toFixed(2)}`;
export const toPaise = (rupees) => Math.round(Number(rupees || 0) * 100);
export const toRupees = (paise) => (Number(paise || 0) / 100).toFixed(2);
