import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

const normalizeProfile = (data: Partial<UserProfile> | undefined): UserProfile => ({
  name: data?.name || '',
  phone: data?.phone || '',
  email: data?.email || '',
  photoUrl: data?.photoUrl || '',
  createdAt: data?.createdAt,
  updatedAt: data?.updatedAt
});

export const createUserProfile = async (userId: string, profile: Partial<UserProfile>) => {
  const ref = doc(db, 'users', userId);
  await setDoc(
    ref,
    {
      name: profile.name || '',
      phone: profile.phone || '',
      email: profile.email || '',
      photoUrl: profile.photoUrl || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const ref = doc(db, 'users', userId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    return null;
  }
  const data = snapshot.data();
  return normalizeProfile({
    ...data,
    createdAt: data.createdAt?.toDate?.().toISOString?.(),
    updatedAt: data.updatedAt?.toDate?.().toISOString?.()
  });
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  const ref = doc(db, 'users', userId);
  await setDoc(
    ref,
    {
      ...updates,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

