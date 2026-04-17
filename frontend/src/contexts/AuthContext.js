import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// ✅ 1) BASE URL correcto (y fallback seguro)
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL?.trim() || "https://api.cotizaexpress.com";

const API = `${BACKEND_URL}/api`;

// ✅ 2) Axios global: SIEMPRE mandar cookies
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Al cargar la app: intenta recuperar sesión por cookie
  useEffect(() => {
    cargarUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarUsuario = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
      });

      // backend: { ok: true, user: { id, email } }
      const u = response.data?.user || null;
      setUser(u);
    } catch (error) {
      // 401 es normal si no hay sesión
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Registro (backend: /api/auth/register)
  const registro = async ({ email, password, promo_code }) => {
    try {
      const payload = { email, password };
      if (promo_code && promo_code.trim()) payload.promo_code = promo_code.trim();
      await axios.post(
        `${API}/auth/register`,
        payload,
        { withCredentials: true }
      );

      // tu backend register no loguea automáticamente;
      // si quieres auto-login, hacemos login aquí:
      await login(email, password);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Error al registrar usuario",
      };
    }
  };

  // ✅ Login (backend: /api/auth/login -> set-cookie session)
  const login = async (email, password) => {
    try {
      await axios.post(
        `${API}/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      // ✅ Ahora trae el usuario usando cookie
      await cargarUsuario();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Error al iniciar sesión",
      };
    }
  };

  // ✅ Logout (backend: /api/auth/logout)
  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (_) {
      // aunque falle, limpiamos estado local
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        registro,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
