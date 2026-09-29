import axios from "axios";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

// NOTE: axiosClient has Interceptors
const axiosClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
})

// refreshClient only used to reach "/refresh", doesn't have Interceptors in Response
const refreshClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
})

// if multiple requests failed 401 at the same time, they must wait
let refreshPromise = null 
axiosClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    // _retry = True means we have already sent /auth/refresh and get an Error again
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }
    originalRequest._retry = true;
    
    try {
      // for the first Request with 401 Response only
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post("/refresh")
          .finally(() => {
            refreshPromise = null 
          })
      }
      // waiting for Promise to be "null" again or proper Object (null waiting in this case)
      await refreshPromise;
      // continue with original Request
      return axiosClient(originalRequest)
    } catch(refreshError) {
      return Promise.reject(refreshError)
    }
  }
)

export default axiosClient;