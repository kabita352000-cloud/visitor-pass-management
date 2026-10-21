import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function getSavedUser() {
  try {
    const user = JSON.parse(localStorage.getItem('vp_user'));
    return user && typeof user === 'object' ? user : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);

  function signIn(data) {
    if (!data?.token || !data?.user) {
      throw new Error('The server returned an invalid sign-in response');
    }
    localStorage.setItem('vp_token', data.token);
    localStorage.setItem('vp_user', JSON.stringify(data.user));
    setUser(data.user);
  }

  function signOut() {
    localStorage.removeItem('vp_token');
    localStorage.removeItem('vp_user');
    setUser(null);
  }

  const value = useMemo(() => ({ user, signIn, signOut }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
