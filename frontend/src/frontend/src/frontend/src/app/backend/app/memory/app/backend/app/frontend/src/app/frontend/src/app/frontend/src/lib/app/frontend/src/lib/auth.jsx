"import React, { createContext, useContext, useEffect, useState } from \"react\";
import { api } from \"./api\";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=checking, false=guest, obj=user
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(\"/auth/me\");
        setUser(data);
      } catch {
        setUser(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post(\"/auth/login\", { email, password });
    if (data?.access_token) localStorage.setItem(\"mh_token\", data.access_token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await api.post(\"/auth/logout\"); } catch {}
    localStorage.removeItem(\"mh_token\");
    setUser(false);
  };

  return <AuthCtx.Provider value={{ user, login, logout, setUser }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
"
