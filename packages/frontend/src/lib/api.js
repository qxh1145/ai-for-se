// packages/frontend/src/lib/api.js
import axios from "axios";
import {
  getToken,
  getRefreshToken,
  clearAllTokens,
  setTokens,
  isTokenExpired,
} from "./tokenManager.js";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// Quan trọng: withCredentials để FE nhận cookie (Google OAuth)
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const endpoints = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    me: "/api/auth/me",
    refresh: "/api/auth/refresh",
    checkUsername: "/api/auth/check-username",
    checkEmail: "/api/auth/check-email",
    checkPhone: "/api/auth/check-phone",
    forgot: "/api/auth/forgot-password",
  },

  // Plans
  plans: {
    base: "/api/plans",
    byId: (id) => `/api/plans/${id}`,
    items: (id) => `/api/plans/${id}/exercises`,
  },

  // OAuth session-based (Passport)
  oauth: {
    me: "/auth/me",
    google: "/auth/google",
  },

  // Onboarding endpoints
  onboarding: {
    session: "/api/onboarding/session",
    step: (key) => `/api/onboarding/steps/${key}`,
    answer: (key) => `/api/onboarding/steps/${key}/answer`,
  },

  // Nutrition endpoints
  nutrition: {
    plan: "/api/nutrition/plan",
  },

  admin: {
    users: "/api/admin/users",
    userRole: (id) => `/api/admin/users/${id}/role`,
    userPlan: (id) => `/api/admin/users/${id}/plan`,
    userLock: (id) => `/api/admin/users/${id}/lock`,
    userUnlock: (id) => `/api/admin/users/${id}/unlock`,

    // ⬇️ NEW: sub-admin endpoints
    listSubAdmins: "/api/admin/subadmins",
    createSubAdmin: "/api/admin/subadmins",
  },
};

// Những endpoint đi “thẳng” (không ép refresh/redirect)
// ✅ Bổ sung đầy đủ /api/auth/* để tránh redirect khi đang ở màn login / refresh fail
const PASS_THROUGH = [
  // API auth
  endpoints.auth.me,
  endpoints.auth.login,
  endpoints.auth.register,
  endpoints.auth.refresh,
  endpoints.auth.checkUsername,
  endpoints.auth.checkEmail,
  endpoints.auth.checkPhone,
  endpoints.auth.forgot,

  // OAuth session endpoints
  endpoints.oauth.me,
  endpoints.oauth.google,

  // Passport callback (nếu dùng)
  "/auth/google/callback",
  "/api/nutrition/plan",
];

const isPassThroughUrl = (u = "") => PASS_THROUGH.some((p) => u.startsWith(p));

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ===== Request interceptor =====
api.interceptors.request.use(
  async (config) => {
    const url = config.url || "";
    const pass = isPassThroughUrl(url);
    let token = getToken();

    if (pass) {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      else delete config.headers.Authorization;
      return config;
    }

    if (token) {
      // token đã/sắp hết hạn
      if (isTokenExpired(token) && !isRefreshing) {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          isRefreshing = true;
          try {
            const response = await axios.post(
              `${BASE_URL}${endpoints.auth.refresh}`,
              { refreshToken },
              { headers: { "Content-Type": "application/json" }, withCredentials: true }
            );
            const { token: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

            setTokens(newAccessToken, newRefreshToken, true);
            config.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            return config;
          } catch (err) {
            processQueue(err, null);
            clearAllTokens();
            if (!window.location.pathname.startsWith("/login")) {
              window.location.replace("/login");
            }
            return Promise.reject(err);
          } finally {
            isRefreshing = false;
          }
        } else {
          clearAllTokens();
          if (!window.location.pathname.startsWith("/login")) {
            window.location.replace("/login");
          }
        }
      } else if (isRefreshing) {
        // chờ refresh xong
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((t) => {
            config.headers.Authorization = `Bearer ${t}`;
            return config;
          })
          .catch((err) => Promise.reject(err));
      }

      const currentToken = getToken();
      if (currentToken) config.headers.Authorization = `Bearer ${currentToken}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Response interceptor =====
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const url = originalRequest.url || "";
    const status = error?.response?.status;

    // Nếu là pass-through (đặc biệt /api/auth/login, /api/auth/refresh), đừng redirect — để UI tự xử lý
    if ((status === 401 || status === 423 || status === 403) && isPassThroughUrl(url)) {
      return Promise.reject(error);
    }

    // Nếu gặp 423 (tài khoản bị khóa) ở API khác => đăng xuất và đưa về /login
    if (status === 423) {
      clearAllTokens();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken && !url.includes(endpoints.auth.refresh)) {
        isRefreshing = true;
        try {
          const response = await axios.post(
            `${BASE_URL}${endpoints.auth.refresh}`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" }, withCredentials: true }
          );
          const { token: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

          setTokens(newAccessToken, newRefreshToken, true);
          processQueue(null, newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          clearAllTokens();
          if (!window.location.pathname.startsWith("/login")) {
            window.location.replace("/login");
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        clearAllTokens();
        if (!window.location.pathname.startsWith("/login")) {
          window.location.replace("/login");
        }
      }
    }

    return Promise.reject(error);
  }
);

// ===== Convenience APIs =====
export const checkUsernameAvailability = async (username) => {
  const response = await api.get(endpoints.auth.checkUsername, { params: { username } });
  return response.data;
};

export const checkEmailAvailability = async (email) => {
  const response = await api.get(endpoints.auth.checkEmail, { params: { email } });
  return response.data;
};

export const checkPhoneAvailability = async (phone) => {
  const response = await api.get(endpoints.auth.checkPhone, { params: { phone } });
  return response.data;
};

export const patchUserRole = async (userId, role) => {
  const res = await api.patch(endpoints.admin.userRole(userId), { role });
  return res.data;
};

export const patchUserPlan = async (userId, plan) => {
  const res = await api.patch(endpoints.admin.userPlan(userId), { plan });
  return res.data;
};

// ===== Admin Users =====
export const getAdminUsers = async ({
  limit = 50,
  offset = 0,
  search = "",
  plan,
  role,
} = {}) => {
  const params = { limit, offset };
  if (search) params.search = search;
  if (plan && plan !== "ALL") params.plan = String(plan).toUpperCase();
  if (role && role !== "ALL") params.role = String(role).toUpperCase();
  const res = await api.get(endpoints.admin.users, { params });
  return res.data;
};

// ===== Sub-admin APIs =====
export const getSubAdmins = async ({ limit = 50, offset = 0 } = {}) => {
  const res = await api.get(endpoints.admin.listSubAdmins, {
    params: { limit, offset },
  });
  return res.data;
};

export const createSubAdmin = async ({ email, username, password }) => {
  const res = await api.post(endpoints.admin.createSubAdmin, {
    email,
    username,
    password,
  });
  return res.data;
};

// ===== Plans convenience APIs =====
export const createPlanApi = async ({ name, description, difficulty_level, is_public }) => {
  const res = await api.post(endpoints.plans.base, {
    name,
    description,
    difficulty_level,
    is_public,
  });
  return res.data;
};

export const getPlanByIdApi = async (planId) => {
  const res = await api.get(endpoints.plans.byId(planId));
  return res.data;
};

export const addExerciseToPlanApi = async ({ planId, exercise_id, session_order, sets_recommended, reps_recommended, rest_period_seconds }) => {
  const res = await api.post(endpoints.plans.items(planId), {
    exercise_id,
    session_order,
    sets_recommended,
    reps_recommended,
    rest_period_seconds,
  });
  return res.data;
};

export const getMyPlansApi = async ({ limit = 50, offset = 0 } = {}) => {
  const res = await api.get(endpoints.plans.base, { params: { mine: 1, limit, offset } });
  return res.data; // expect { success, data: { items, total } } or similar
};

export default api;
