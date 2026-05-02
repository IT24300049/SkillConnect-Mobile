import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login, register } from "../services/apiClient";

const TOKEN_KEY = "sc_token";
const USER_KEY = "sc_user";

// This Context is the "Global Memory" for Authentication
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null); // Stores the JWT VIP Pass
  const [user, setUser] = useState(null);   // Stores user details (name, email, role)
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // PERSISTENCE: This runs when the app starts. 
  // It checks if there is a saved token in the phone's memory.
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const savedUser = await AsyncStorage.getItem(USER_KEY);

        if (savedToken) setToken(savedToken);
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch (_e) {
        setAuthError("Failed to restore session");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Helper function to save token and user info to phone memory (AsyncStorage)
  async function persistSession(nextToken, nextUser) {
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  // SIGN IN: Calls the login API and saves the session
  async function signIn(email, password) {
    setAuthError("");
    const data = await login(email.trim().toLowerCase(), password);
    await persistSession(data.token, data);
  }

  // SIGN UP: Calls the register API and saves the session
  async function signUp(form) {
    setAuthError("");
    const data = await register({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      phone: form.phone.trim(),
      role: form.role,
      primarySkill: form.primarySkill,
      skills: form.primarySkill ? [form.primarySkill] : [],
      district: form.district?.trim(),
      city: form.city?.trim(),
      hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
      experience: form.experience?.trim(),
    });
    await persistSession(data.token, data);
  }

  // SIGN OUT: Clears the memory and logs the user out
  async function signOut() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, loading, authError, setAuthError, signIn, signUp, signOut }),
    [token, user, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to easily use authentication in any screen
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
