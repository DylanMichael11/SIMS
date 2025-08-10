import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthProvider] subscribing to onAuthStateChanged");
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("[AuthProvider] onAuthStateChanged ->", u ? u.email : null, u);
      setUser(u);
      setLoading(false);
    });
    return () => {
      console.log("[AuthProvider] unsubscribing onAuthStateChanged");
      unsub();
    };
  }, []);

  const logout = () => {
    console.log("[AuthProvider] signOut()");
    return signOut(auth);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
