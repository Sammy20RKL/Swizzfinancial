import authApiClient from "./authApiConfig";

export const login = (identifier, password) =>
  authApiClient.post("/auth/login", { identifier, password });

export const register = (payload) =>
  authApiClient.post("/auth/register", payload);

export const getUsers = (params = {}) =>
  authApiClient.get("/auth/GetUsers", { params });

export const updateUser = (id, payload) =>
  authApiClient.put(`/auth/UpdateUser/${id}`, payload);

export const deactivateUser = (id) =>
  authApiClient.put(`/auth/DeactivateUser/${id}`);

export const reactivateUser = (id) =>
  authApiClient.put(`/auth/ReactivateUser/${id}`);

export const deleteUser = (id) =>
  authApiClient.delete(`/auth/DeleteUser/${id}`);

export const changePassword = (currentPassword, newPassword) =>
  authApiClient.post("/auth/ChangePassword", { currentPassword, newPassword });

export const adminResetPassword = (userId, newPassword) =>
  authApiClient.post("/auth/AdminResetPassword", { userId, newPassword });

export const getRoles = () => authApiClient.get("/auth/roles");

export const createRole = (payload) =>
  authApiClient.post("/auth/CreateRole", payload);

export const updateRole = (id, payload) =>
  authApiClient.put(`/auth/UpdateRole/${id}`, payload);

export const deleteRole = (id) =>
  authApiClient.delete(`/auth/DeleteRole/${id}`);
