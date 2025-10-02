import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  linkWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, CustomClaims } from '@/types';
import { parseCustomClaims, parseUser } from '@/lib/validation';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  customClaims: CustomClaims | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  upgradeGuestAccount: () => Promise<void>;
  signOut: () => Promise<void>;
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
        } catch (error) {
          console.error('Error loading user data:', error);
          if (!cancelled) {
            setUser(null);
            setCustomClaims(null);
          }
        }
      } else {
        setUser(null);
        setCustomClaims(null);
      }

      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });
    await signInWithPopup(auth, provider);
  };

  const signInAsGuest = async () => {
    await signInAnonymously(auth);
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
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
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
