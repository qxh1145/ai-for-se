import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, endpoints } from "../lib/api.js";
import {
  setTokens,
  clearAllTokens,
  getToken,
  isRemembered,
  getTokenInfo,
} from "../lib/tokenManager.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Đánh dấu đã hoàn tất onboarding (update cục bộ state)
  const markOnboarded = () => {
    setUser((u) =>
      u ? { ...u, onboardingCompletedAt: new Date().toISOString() } : u
    );
  };

  /**
   * Sau khi có token/user -> hỏi BE xem còn Onboarding không để điều hướng.
   * - Nếu còn: nhảy tới /onboarding/<nextStepKey>
   * - Nếu xong: vào "/dashboard" (không quay về landing)
   * Gọi hàm này từ màn Login/Register (truyền navigate)
   */
  const redirectAfterAuth = async (navigate) => {
    if (!navigate) return;
    
    // Nếu là admin -> vào thẳng trang admin
    if (user?.role === "ADMIN") {
      navigate("/admin", { replace: true });
      return;
    }

    try {
      const r = await api.get(endpoints.onboarding.session, {
        params: { t: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        withCredentials: true,
      });
      const d = r?.data?.data;
      if (d?.required && d?.nextStepKey) {
        navigate(`/onboarding/${d.nextStepKey}`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch {
      navigate("/dashboard", { replace: true });
    }
  };

  // OAuth (Google) – lấy user từ session cookie
  // Có thể truyền navigate để redirect luôn sau khi xác thực thành công
  const oauthLogin = async (remember = true, navigate) => {
    try {
      const r = await api.get(endpoints.oauth.me); // /auth/me
      const u = r.data?.user || r.data?.data || null;
      if (u) {
        setUser(u);
        // OAuth dùng cookie -> đã có session ⇒ điều hướng theo onboarding (nếu truyền navigate)
        if (navigate) {
          await redirectAfterAuth(navigate);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error("OAuth me error:", e);
      return false;
    }
  };

  // Làm tươi thông tin user (ưu tiên session OAuth, fallback JWT)
  const refreshUser = async () => {
    try {
      // Thử lấy từ OAuth session
      const r = await api.get(endpoints.oauth.me, {
        params: { t: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        withCredentials: true,
      });
      const u1 = r?.data?.user || r?.data?.data;
      if (u1) {
        setUser(u1);
        return true;
      }

      // Fallback JWT
      const r2 = await api.get(endpoints.auth.me, {
        params: { t: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        withCredentials: true,
      });
      const u2 = r2?.data?.data;
      if (r2?.data?.success && u2) {
        setUser(u2);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  /**
   * Bootstrap: load user khi mở app.
   * - Ưu tiên session OAuth (/auth/me)
   * - Nếu không có, thử JWT (/api/auth/me) nếu đang có token
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1) OAuth session
        try {
          const r = await api.get(endpoints.oauth.me, {
            params: { t: Date.now() },
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
            withCredentials: true,
          });
          const u = r?.data?.user || r?.data?.data;
          if (u) {
            setUser(u);
            return;
          }
        } catch {
          /* bỏ qua, thử JWT */
        }

        // 2) JWT
        const token = getToken();
        if (token) {
          try {
            const r2 = await api.get(endpoints.auth.me, {
              params: { t: Date.now() },
              headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
              withCredentials: true,
            });
            if (r2?.data?.success && r2?.data?.data) {
              setUser(r2.data.data);
              return;
            } else {
              clearAllTokens();
            }
          } catch {
            clearAllTokens();
          }
        }
      } catch (e) {
        console.error("Bootstrap: Authentication failed:", e);
        clearAllTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  /**
   * Đăng ký tài khoản:
   * - setTokens + setUser
   * - (khuyên dùng) truyền navigate để redirect theo trạng thái onboarding
   */
  const register = async (payload, navigate) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(endpoints.auth.register, payload);
      const { data } = response.data || {};
      if (data?.user && data?.token) {
        setUser(data.user);
        setTokens(data.token, data.refreshToken, !!payload?.rememberMe);
        // Làm tươi & điều hướng theo onboarding (nếu có navigate)
        await refreshUser();
        if (navigate) await redirectAfterAuth(navigate);
      }
      return response.data;
    } catch (err) {
      console.error("Register error:", err);
      if (err.response?.status === 400)
        setError({ message: "Dữ liệu không hợp lệ" });
      else if (err.response?.status === 422)
        setError({ message: "Thông tin đăng ký không đúng định dạng" });
      else setError(err?.response?.data || { message: err.message });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đăng nhập:
   * - setTokens + setUser
   * - (khuyên dùng) truyền navigate để redirect theo trạng thái onboarding
   */
  const login = async (payload, navigate, nextPath) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(endpoints.auth.login, payload);
      const { data } = response.data || {};
      if (data?.user && data?.token) {
        // Lưu token và user info
        setUser(data.user);
        setTokens(data.token, data.refreshToken, !!payload?.rememberMe);
        
        // Kiểm tra role và redirect
        if (navigate) {
          if (data.user.role === "ADMIN") {
            navigate("/admin", { replace: true });
          } else {
            // Nếu là user thường thì check onboarding
            await refreshUser();
            try {
              const r = await api.get(endpoints.onboarding.session, {
                params: { t: Date.now() },
                headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
                withCredentials: true,
              });
              const d = r?.data?.data;
              if (d?.required && d?.nextStepKey) {
                navigate(`/onboarding/${d.nextStepKey}`, { replace: true });
              } else if (nextPath) {
                navigate(nextPath, { replace: true });
              } else {
                navigate("/dashboard", { replace: true });
              }
            } catch {
              // lỗi hiếm: ưu tiên nextPath nếu có, fallback dashboard
              if (nextPath) navigate(nextPath, { replace: true });
              else navigate("/dashboard", { replace: true });
            }
          }
        }
      }
      return response.data;
    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.status === 400) setError({ message: "Dữ liệu không hợp lệ" });
      else if (err.response?.status === 401) setError({ message: "Sai tài khoản hoặc mật khẩu" });
      else if (err.response?.status === 403) setError({ message: "Tài khoản đã bị khóa" });
      else if (err.response?.status === 423) setError({ message: "Tài khoản đã bị khóa" });

      else setError(err?.response?.data || { message: err.message });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      setUser(null);
      clearAllTokens();
      // Optional: await api.post(endpoints.auth.logout);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Đã đăng nhập khi có user (hỗ trợ cả session & JWT)
  const isAuthenticated = () => !!user;

  const getAuthStatus = () => {
    const token = getToken();
    const tokenInfo = getTokenInfo();
    return {
      isAuthenticated: isAuthenticated(),
      isRemembered: isRemembered(),
      tokenInfo,
      user,
    };
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      // actions
      register,
      login,
      logout,
      oauthLogin,
      refreshUser,
      redirectAfterAuth,
      // helpers
      markOnboarded,
      isAuthenticated,
      getAuthStatus,
      clearError: () => setError(null),
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
