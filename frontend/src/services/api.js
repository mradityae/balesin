import axios from "axios";

const getBaseURL = () => {
  const saved = localStorage.getItem("API_BASE_URL");

  if (saved && saved.trim() !== "") {
    // pastikan ada /api di belakang
    return saved.endsWith("/api") ? saved : `${saved}/api`;
  }

  // fallback default
  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
