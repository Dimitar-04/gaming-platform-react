import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googlProvider } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);
  const [loadingBackground, setLoadingBackground] = useState(false);
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  function logout() {
    return signOut(auth);
  }
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }
  function signInWithGoogle() {
    return signInWithPopup(auth, googlProvider);
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
  };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
