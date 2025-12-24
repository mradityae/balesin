let BASE_URL = "http://localhost:5000"; // default local

// Try read from REACT_APP_API_URL (if exists)
if (typeof process !== "undefined" && process.env.REACT_APP_API_URL) {
  BASE_URL = process.env.REACT_APP_API_URL;
}

// Netlify environment injection (optional)
if (window?._env_?.REACT_APP_API_URL) {
  BASE_URL = window._env_.REACT_APP_API_URL;
}

export default {
  BASE_URL,
};
