// ════════════════════════════════════════════════════════════════════════════
// client/src/context/AuthContext.jsx
// ════════════════════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Au démarrage — vérifie si un token existe déjà ───────────────────────
  useEffect(() => {
    const token = localStorage.getItem('sf_token');
    if (!token) { setLoading(false); return; }

    // Vérifie que le token est encore valide
axios.get('https://secureflow-crm.onrender.com/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setUser(res.data.user))
      .catch(() => {
        // Token invalide ou expiré → nettoie
        localStorage.removeItem('sf_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
const res = await axios.post('https://secureflow-crm.onrender.com/api/auth/login', { email, password });
    localStorage.setItem('sf_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('sf_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
