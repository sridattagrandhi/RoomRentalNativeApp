// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FIREBASE_AUTH } from '../constants/firebaseConfig';
import { Platform } from 'react-native';

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

const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5001'
    : 'http://localhost:5001';

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
            console.warn('Sync failed:', data);
            setMongoUser(null);
          }
        } catch (err) {
          console.error('Sync error:', err);
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
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
