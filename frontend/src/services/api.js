// Purpose: Axios API client for backend endpoints.

import axios from "axios";

const runtimeHost = typeof window !== "undefined"
  ? (window.location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost")
  : "localhost";
const defaultApiBaseUrl = `http://${runtimeHost}:5000/api`;

const api = axios.create({ // tăng timeout từ 15 giây lên 60 giây để tránh lỗi khi blockchain chậm
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl,
  timeout: 60000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function loginWithPassword({ username, password }) {
  const res = await api.post("/auth/login", { username, password });
  return res.data;
}

export async function getCurrentUser() {
  const res = await api.get("/auth/me");
  return res.data;
}

export async function issueCertificate(payload) {
  const res = await api.post("/certificates", payload);
  return res.data;
}

export async function getCertificateDetail(id) {
  const res = await api.get(`/certificates/${id}`);
  return res.data;
}

export async function getCertificate(id) {
  return getCertificateDetail(id);
}

export async function updateCertificateTx(id, txHash) {
  const res = await api.post("/certificates/tx", { certificateId: id, txHash });
  return res.data;
}

export async function markCertificateFailed(id) {
  const res = await api.post("/certificates/fail", { certificateId: id });
  return res.data;
}

export async function verifyCertificate(hashOrId) {
  const value = String(hashOrId || "").trim();
  if (/^[0-9]+$/.test(value)) {
    const res = await api.get(`/verify/${value}`);
    return res.data;
  }

  const normalized = value.startsWith("0x") ? value : `0x${value}`;
  const res = await api.get(`/verify/hash/${normalized}`);
  return res.data;
}

export async function getCertificateStats() {
  const res = await api.get("/stats");
  return res.data;
}

export async function getCertificateOptions() {
  const res = await api.get("/certificate-options");
  return res.data;
}

export async function getHolders() {
  const res = await api.get("/holders");
  return res.data;
}

export async function getIssuers() {
  const res = await api.get("/issuers");
  return res.data;
}

export async function revokeCertificate(id, requesterWallet) {
  const payload = requesterWallet ? { requesterWallet } : {};
  const res = await api.put(`/certificates/${id}/revoke`, payload);
  return res.data;
}

export async function getIssuersAdmin() {
  const res = await api.get("/admin/issuers");
  return res.data;
}

export async function addIssuerAdmin(payload) {
  const res = await api.post("/admin/issuers", payload);
  return res.data;
}

export async function removeIssuerAdmin(walletAddress) {
  const encoded = encodeURIComponent(String(walletAddress || "").trim());
  const res = await api.delete(`/admin/issuers/${encoded}`);
  return res.data;
}

export async function getHoldersAdmin() {
  const res = await api.get("/admin/holders");
  return res.data;
}

export async function addHolderAdmin(payload) {
  const res = await api.post("/admin/holders", payload);
  return res.data;
}

export async function removeHolderAdmin(userId) {
  const res = await api.delete(`/admin/holders/${Number(userId)}`);
  return res.data;
}

export async function createCertificate(payload) {
  return issueCertificate(payload);
}

export default api;
