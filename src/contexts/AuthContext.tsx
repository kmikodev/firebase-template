import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  linkWithPopup,
  unlink,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, CustomClaims } from '@/types';
import { parseCustomClaims, parseUser } from '@/lib/validation';
import {
  initializeMessaging,
  getFCMToken,
  deleteFCMToken,
  onForegroundMessage
} from '@/services/notificationService';
import { analyticsService } from '@/services/analyticsService';
import { logEvent } from 'firebase/analytics';
import { analytics } from '@/lib/firebase';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  customClaims: CustomClaims | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  upgradeGuestAccount: () => Promise<void>;
  signOut: () => Promise<void>;
  linkGoogleAccount: () => Promise<{ success: boolean }>;
  unlinkGoogleAccount: () => Promise<{ success: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Crea el documento de usuario en Firestore cuando se registra por primera vez
 */
async function createUserDocument(firebaseUser: FirebaseUser): Promise<void> {
  const isAnonymous = firebaseUser.providerData.length === 0;
  const defaultRole = isAnonymous ? 'guest' : 'client';

  const newUser: User = {
    id: firebaseUser.uid,
    email: firebaseUser.email || null,
    displayName: firebaseUser.displayName || (isAnonymous ? 'Invitado' : 'Usuario'),
    photoURL: firebaseUser.photoURL || null,
    phoneNumber: firebaseUser.phoneNumber || null,
    role: defaultRole,
    isAnonymous,
    queuePoints: 100, // Puntos iniciales
    queueHistory: {
      totalCompleted: 0,
      totalNoShows: 0,
      totalExpired: 0,
      totalCancelled: 0,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [customClaims, setCustomClaims] = useState<CustomClaims | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentFCMToken, setCurrentFCMToken] = useState<string | null>(null);

  // Initialize FCM messaging on mount
  useEffect(() => {
    initializeMessaging();
  }, []);

  // Setup foreground notification handler
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Notification received in foreground:', payload);
      // You can show a toast notification or update UI here
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) return;

      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Obtener custom claims con validación Zod
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          if (cancelled) return;

          const validatedClaims = parseCustomClaims(tokenResult.claims);
          if (validatedClaims) {
            // Usar claims validados, pero llenar valores faltantes con defaults
            setCustomClaims({
              role: validatedClaims.role || (firebaseUser.isAnonymous ? 'guest' : 'client'),
              isAnonymous: validatedClaims.isAnonymous ?? firebaseUser.isAnonymous,
              franchiseId: validatedClaims.franchiseId,
              branchId: validatedClaims.branchId,
            });
          } else {
            // Si la validación falla completamente, usar defaults
            console.warn('Custom claims validation failed, using defaults');
            setCustomClaims({
              role: firebaseUser.isAnonymous ? 'guest' : 'client',
              isAnonymous: firebaseUser.isAnonymous,
            });
          }

          // Obtener datos del usuario desde Firestore con validación Zod
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (cancelled) return;

          if (userDoc.exists()) {
            const validatedUser = parseUser(userDoc.data());
            if (validatedUser) {
              setUser(validatedUser as User);
            } else {
              console.error('Invalid user data from Firestore');
              setUser(null);
            }
          } else {
            // Si el documento no existe, crearlo (primera vez)
            await createUserDocument(firebaseUser);
            if (cancelled) return;

            // Recargar el documento con validación
            const newUserDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (cancelled) return;

            if (newUserDoc.exists()) {
              const validatedNewUser = parseUser(newUserDoc.data());
              if (validatedNewUser) {
                setUser(validatedNewUser as User);
              }
            }
          }

          // Register FCM token for authenticated users (not guests)
          if (!firebaseUser.isAnonymous && !cancelled) {
            try {
              const token = await getFCMToken(firebaseUser.uid);
              if (token && !cancelled) {
                setCurrentFCMToken(token);
                console.log('FCM token registered for user');
              }
            } catch (error) {
              console.error('Error registering FCM token:', error);
              // Non-critical error, don't block user flow
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          if (!cancelled) {
            setUser(null);
            setCustomClaims(null);
          }
        }
      } else {
        // User signed out - delete FCM token
        // Note: firebaseUser is null here, so we can't delete the token
        // Tokens will be cleaned up by Cloud Functions when they become invalid
        setUser(null);
        setCustomClaims(null);
        setCurrentFCMToken(null);
      }

      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [currentFCMToken]); // Include currentFCMToken in dependencies

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      const result = await signInWithPopup(auth, provider);

      // Track login
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      if (isNewUser) {
        analyticsService.trackSignUp('google', customClaims?.role);
      } else {
        analyticsService.trackLogin('google', customClaims?.role);
      }
    } catch (error: any) {
      // Handle account-exists-with-different-credential error
      if (error.code === 'auth/account-exists-with-different-credential') {
        // Get the pending credential
        const pendingCred = GoogleAuthProvider.credentialFromError(error);
        const email = error.customData?.email;

        if (email && pendingCred) {
          throw new Error(
            `Ya existe una cuenta con el email ${email}. Por favor, inicia sesión con tu método existente y vincula Google desde tu perfil.`
          );
        }
      }
      throw error;
    }
  };

  const signInAsGuest = async () => {
    await signInAnonymously(auth);
    analyticsService.trackLogin('anonymous', 'guest');
  };

  const upgradeGuestAccount = async () => {
    if (!firebaseUser || !firebaseUser.isAnonymous) {
      throw new Error('Usuario no es invitado o no está autenticado');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });
    await linkWithPopup(firebaseUser, provider);

    // Track account upgrade
    analyticsService.trackSignUp('google_upgrade', customClaims?.role);
  };

  const signOut = async () => {
    // Track logout
    analyticsService.trackLogout();

    // Delete FCM token before signing out
    if (currentFCMToken && firebaseUser) {
      try {
        await deleteFCMToken(firebaseUser.uid, currentFCMToken);
        console.log('FCM token deleted on sign out');
      } catch (error) {
        console.error('Error deleting FCM token:', error);
      }
    }
    await firebaseSignOut(auth);
  };

  const linkGoogleAccount = async () => {
    if (!firebaseUser) {
      throw new Error('No user logged in');
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      const result = await linkWithPopup(firebaseUser, provider);

      // Update user document with Google provider info
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        photoURL: result.user.photoURL,
        updatedAt: Timestamp.now(),
      }, { merge: true });

      if (analytics) {
        logEvent(analytics, 'account_linked', { provider: 'google' });
      }
      return { success: true };
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        throw new Error('Esta cuenta de Google ya está vinculada a otro usuario');
      }
      if (error.code === 'auth/provider-already-linked') {
        throw new Error('Esta cuenta ya tiene Google vinculado');
      }
      throw error;
    }
  };

  const unlinkGoogleAccount = async () => {
    if (!firebaseUser) {
      throw new Error('No user logged in');
    }

    try {
      await unlink(firebaseUser, 'google.com');
      if (analytics) {
        logEvent(analytics, 'account_unlinked', { provider: 'google' });
      }
      return { success: true };
    } catch (error: any) {
      if (error.code === 'auth/no-such-provider') {
        throw new Error('No hay cuenta de Google vinculada');
      }
      throw error;
    }
  };

  const value = {
    firebaseUser,
    user,
    customClaims,
    loading,
    signInWithGoogle,
    signInAsGuest,
    upgradeGuestAccount,
    signOut,
    linkGoogleAccount,
    unlinkGoogleAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}
