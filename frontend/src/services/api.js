import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateMe: (data) => api.patch("/auth/me", data),
};

export const counsellorAPI = {
  list: (params) => api.get("/counsellors", { params }),
  get: (id) => api.get(`/counsellors/${id}`),
  getProfile: () => api.get("/counsellors/profile"),
  upsertProfile: (data, isUpdate = false) =>
    isUpdate ? api.put("/counsellors/profile", data) : api.post("/counsellors/profile", data),
  getAvailability: () => api.get("/counsellors/availability"),
  setAvailability: (data) => api.post("/counsellors/availability", data),
  deleteAvailability: (slotId) => api.delete(`/counsellors/availability/${slotId}`),
  getCounsellorAvailability: (id) => api.get(`/counsellors/${id}/availability`),
};

export const appointmentAPI = {
  list: (params) => api.get("/appointments", { params }),
  get: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post("/appointments", data),
  updateStatus: (id, data) => api.patch(`/appointments/${id}/status`, data),
};

export const chatAPI = {
  getMessages: (userId) => api.get(`/chat/messages/${userId}`),
  sendMessage: (data) => api.post("/chat/messages", data),
  getConversations: () => api.get("/chat/conversations"),
};

export const paymentAPI = {
  createIntent: (data) => api.post("/payments/create-intent", data),
  confirm: (data) => api.post("/payments/confirm", data),
  history: () => api.get("/payments/history"),
};

export const journalAPI = {
  list: (params) => api.get("/journal/entries", { params }),
  get: (id) => api.get(`/journal/entries/${id}`),
  create: (data) => api.post("/journal/entries", data),
  update: (id, data) => api.put(`/journal/entries/${id}`, data),
  delete: (id) => api.delete(`/journal/entries/${id}`),
  logMood: (data) => api.post("/journal/mood", data),
  getMoodLogs: (params) => api.get("/journal/mood", { params }),
};

export const adminAPI = {
  dashboard: () => api.get("/admin/dashboard"),
  listUsers: (params) => api.get("/admin/users", { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  listCounsellors: (params) => api.get("/admin/counsellors", { params }),
  verifyCounsellor: (id, isVerified) => api.patch(`/admin/counsellors/${id}/verify`, { is_verified: isVerified }),
  listAppointments: (params) => api.get("/admin/appointments", { params }),
};

export default api;
