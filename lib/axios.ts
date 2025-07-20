import axios from "axios";

// Configure axios defaults
const axiosInstance = axios.create({
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log("Axios request:", {
      url: config.url,
      method: config.method,
      withCredentials: config.withCredentials,
    });
    return config;
  },
  (error) => {
    console.error("Axios request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Axios response:", {
      status: response.status,
      url: response.config.url,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    console.error("Axios response error:", error);
    return Promise.reject(error);
  }
);

export default axiosInstance;
