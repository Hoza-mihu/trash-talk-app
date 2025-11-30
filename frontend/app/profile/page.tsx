'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf, User, Phone, Mail, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  type UserProfile
} from '@/lib/profile';
import { getUserStats } from '@/lib/utils';
import { createDefaultUserStats, type UserStats } from '@/lib/stats';
import { storage } from '@/lib/firebase';
import { ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage';

const formatMemberSince = (creationTime?: string | null) => {
  if (!creationTime) return '—';
  const date = new Date(creationTime);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    phone: '',
    email: ''
  });
  const [stats, setStats] = useState<UserStats>(createDefaultUserStats());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const [profileData, statsData] = await Promise.all([
        getUserProfile(user.uid),
        getUserStats(user.uid)
      ]);
      if (profileData) {
        setProfile(profileData);
        setPhotoPreview(profileData.photoUrl || user.photoURL || '');
      } else {
        const fallbackProfile = {
          name: user.displayName || '',
          phone: '',
          email: user.email || '',
          photoUrl: user.photoURL || ''
        };
        setProfile(fallbackProfile);
        setPhotoPreview(fallbackProfile.photoUrl || '');
        await createUserProfile(user.uid, fallbackProfile);
      }
      if (statsData) {
        setStats(statsData);
      }
    };

    loadData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('Please upload an image file.');
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setStatus('Profile photos must be smaller than 5MB.');
      return;
    }
    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const getFileExtension = (fileName: string) => {
    const parts = fileName.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  };

  const uploadPhotoIfNeeded = async (): Promise<string | undefined> => {
    if (!user || !photoFile) return profile.photoUrl || undefined;
    
    // Validate file before upload
    if (!photoFile.type.startsWith('image/')) {
      throw new Error('Please select a valid image file.');
    }
    
    const ext = getFileExtension(photoFile.name);
    const storageRef = ref(storage, `profiles/${user.uid}/avatar-${Date.now()}${ext}`);
    const uploadTask = uploadBytesResumable(storageRef, photoFile, {
      contentType: photoFile.type
    });

    // Add timeout (30 seconds) to prevent infinite retries
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        uploadTask.cancel();
        reject(new Error('Upload timed out. Please check your internet connection and try again.'));
      }, 30000);
    });

    const uploadPromise = new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Optional: You can add progress tracking here if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(0)}%`);
        },
        (error) => {
          // Handle specific Firebase Storage errors
          let errorMessage = 'Failed to upload photo. ';
          if (error.code === 'storage/unauthorized') {
            errorMessage += 'You don\'t have permission to upload. Please check Firebase Storage rules.';
          } else if (error.code === 'storage/canceled') {
            errorMessage += 'Upload was canceled.';
          } else if (error.code === 'storage/unknown') {
            errorMessage += 'An unknown error occurred. Please try again.';
          } else if (error.code === 'storage/retry-limit-exceeded') {
            errorMessage += 'Upload failed after multiple retries. Please check your internet connection and try again.';
          } else {
            errorMessage += error.message || 'Please try again.';
          }
          reject(new Error(errorMessage));
        },
        () => resolve()
      );
    });

    // Race between upload and timeout
    await Promise.race([uploadPromise, timeoutPromise]);

    return getDownloadURL(uploadTask.snapshot.ref);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setStatus(null);
    try {
      const uploadedPhotoUrl = await uploadPhotoIfNeeded();

      const updates: Partial<UserProfile> = {
        name: profile.name,
        phone: profile.phone
      };

      if (uploadedPhotoUrl) {
        updates.photoUrl = uploadedPhotoUrl;
      }

      await updateUserProfile(user.uid, updates);
      setProfile((prev) => ({
        ...prev,
        photoUrl: uploadedPhotoUrl || prev.photoUrl
      }));
      if (photoFile && fileInputRef.current) {
        fileInputRef.current.value = '';
        setPhotoFile(null);
      }
      if (uploadedPhotoUrl) {
        setPhotoPreview(uploadedPhotoUrl);
      }
      setStatus('Profile updated successfully.');
    } catch (error: any) {
      // Show user-friendly error messages
      let errorMessage = 'Failed to update profile. ';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code) {
        if (error.code === 'storage/unauthorized') {
          errorMessage = 'Permission denied. Please check Firebase Storage rules.';
        } else if (error.code === 'storage/retry-limit-exceeded') {
          errorMessage = 'Upload timed out. Please check your internet connection and try again.';
        } else {
          errorMessage = `Error: ${error.code}. Please try again.`;
        }
      }
      setStatus(errorMessage);
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">Eco-Eco</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-green-600 transition-colors font-medium"
            >
              Dashboard
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-3xl overflow-hidden border border-green-200">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="Profile photo" className="w-full h-full object-cover" />
                ) : (
                  <span>{profile.name ? profile.name.charAt(0).toUpperCase() : '🌱'}</span>
                )}
              </div>
              <label
                htmlFor="profile-photo"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs bg-white border border-green-200 text-green-600 font-semibold rounded-full px-3 py-1 shadow hover:bg-green-50 cursor-pointer"
              >
                Change
              </label>
              <input
                id="profile-photo"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">Eco ID</p>
              <h1 className="text-3xl font-bold text-gray-900">{profile.name || 'Eco Warrior'}</h1>
              <p className="text-gray-500">Member since {formatMemberSince(user.metadata.creationTime)}</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSave}>
            <div>
              <label className="text-sm text-gray-600">Full Name</label>
              <div className="relative mt-1">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Phone Number</label>
              <div className="relative mt-1">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  placeholder="+1 555 555 1234"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <div className="relative mt-1">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={profile.email}
                    disabled
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Joined</label>
                <div className="relative mt-1">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={formatMemberSince(user.metadata.creationTime)}
                    disabled
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>

            {status && (
              <p
                className={`text-sm rounded-xl px-3 py-2 ${
                  status.includes('success') ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'
                }`}
              >
                {status}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>

        <section className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Items</span>
                <span className="font-semibold text-gray-900">{stats.totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Recyclable</span>
                <span className="font-semibold text-blue-600">{stats.recyclableItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Compostable</span>
                <span className="font-semibold text-orange-600">{stats.compostableItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">CO₂ Saved</span>
                <span className="font-semibold text-purple-600">{stats.co2Saved.toFixed(1)} kg</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Need to refresh stats?</h2>
            <p className="text-sm text-gray-600 mb-4">
              Head to the dashboard to see detailed charts, or upload a new analysis to keep building
              your profile.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="text-center bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                View Dashboard
              </Link>
              <Link
                href="/upload"
                className="text-center bg-white border-2 border-green-600 text-green-600 py-2 rounded-lg font-semibold hover:bg-green-50"
              >
                Analyze New Item
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

