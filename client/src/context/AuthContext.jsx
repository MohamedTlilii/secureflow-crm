// ════════════════════════════════════════════════════════════════════════════
// client/src/context/AuthContext.jsx
// Manages global auth state: current user, login, logout, and token validation.
// Consumed anywhere via: const { user, loading, login, logout } = useAuth();
// ════════════════════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// The context object — holds user, loading, login, logout
// null = no default value, will always be provided by AuthProvider
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);    // Logged-in user object, or null if logged out
  const [loading, setLoading] = useState(true);    // true while checking token on startup

  // ── On App Start — Check if a token already exists ───────────────────────
  // Runs once on mount. If a token is in localStorage, validate it with the server.
  // This keeps the user logged in across page refreshes.
  useEffect(() => {
    const token = localStorage.getItem('sf_token'); // Token key — must match login + api.js
    if (!token) { setLoading(false); return; }       // No token → skip validation, not logged in

    // Hit /api/auth/me to verify the token is still valid and get fresh user data
    // Change the URL here if the backend /me endpoint moves
    axios.get('https://secureflow-crm.onrender.com/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setUser(res.data.user))  // Token valid → store user in state
      .catch(() => {
        // Token expired or invalid → clean up so user sees login screen
        localStorage.removeItem('sf_token');
        setUser(null);
      })
      .finally(() => setLoading(false)); // Always stop the loading spinner when done
  }, []); // ← Empty array = run once on mount only

  // ── Login ─────────────────────────────────────────────────────────────────
  // Called from Login page. Sends credentials, stores token, sets user in state.
  // Change the URL here if the login endpoint changes.
  const login = async (email, password) => {
    const res = await axios.post('https://secureflow-crm.onrender.com/api/auth/login', { email, password });
    localStorage.setItem('sf_token', res.data.token); // Persist token for next page refresh
    setUser(res.data.user);                            // Update global user state immediately
    return res.data;                                   // Caller can use this to redirect or show errors
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  // Clears token from storage and resets user to null.
  // ProtectedLayout will then redirect to /login automatically.
  const logout = () => {
    localStorage.removeItem('sf_token'); // Remove token — key must match getItem calls above
    setUser(null);                        // Triggers re-render, ProtectedLayout redirects to /login
  };

  // Provide user, loading, login, logout to the entire app
  // Add new shared auth values here (e.g. permissions, role) if needed in the future
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Shorthand hook — use this in any component instead of importing useContext + AuthContext
// Usage: const { user, login, logout, loading } = useAuth();
export const useAuth = () => useContext(AuthContext);