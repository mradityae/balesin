let BASE_URL = "http://localhost:5000"; // Default jika berjalan di lokal

// 1. Cek apakah sedang berjalan di production (Netlify / domain publik)
if (typeof window !== "undefined") {
  const hostname = window.location.hostname;
  
  // Jika bukan localhost / IP lokal, arahkan ke domain VPS production Anda
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    BASE_URL = "http://103.139.192.202:5000"; // <-- Ganti dengan URL backend VPS Anda
  }
}

// 2. Timpa dengan environment variable jika disediakan (opsional/untuk fleksibilitas)
if (typeof process !== "undefined" && process.env.REACT_APP_API_URL) {
  BASE_URL = process.env.REACT_APP_API_URL;
}

if (window?._env_?.REACT_APP_API_URL) {
  BASE_URL = window._env_.REACT_APP_API_URL;
}

export default {
  BASE_URL,
};