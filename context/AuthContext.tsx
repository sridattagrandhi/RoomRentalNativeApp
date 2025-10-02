// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FIREBASE_AUTH } from '../constants/firebaseConfig';
import { Platform } from 'react-native';

// --- ✅ CORRECTED BASE_URL DEFINITION ---
// Determine the base URL for API requests.  In development the Expo client
// exposes a `EXPO_PUBLIC_DEV_URL` environment variable when configured,
// otherwise we fall back to a localhost URL.  Note that Android emulators
// cannot reach `localhost` directly so we still use `10.0.2.2` there.
const DEV_SERVER_URL = process.env.EXPO_PUBLIC_DEV_URL || 'http://localhost:5001';
const PRODUCTION_SERVER_URL = 'https://your-production-api.com'; // Replace with your actual deployed server URL

const BASE_URL = __DEV__
  ? Platform.OS === 'android' ? 'http://10.0.2.2:5001' : DEV_SERVER_URL
  : PRODUCTION_SERVER_URL;
// -----------------------------------------

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  mongoUser: any | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  mongoUser: null,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [mongoUser, setMongoUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          const resp = await fetch(`${BASE_URL}/api/auth/sync-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await resp.json();
          if (resp.ok) {
            setMongoUser(data.userData || null);
          } else {
            console.warn('[AuthContext] Sync failed:', data);
            setMongoUser(null);
          }
        } catch (err) {
          console.error('[AuthContext] Sync error:', err);
          setMongoUser(null);
        }
      } else {
        setMongoUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, mongoUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
