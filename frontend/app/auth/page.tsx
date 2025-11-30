'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user, loading, login, signup } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await signup({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          password: formData.password
        });
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Unable to authenticate. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">Eco-Eco</span>
          </Link>
          <Link
            href="/"
            className="text-gray-700 hover:text-green-600 font-medium transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full grid md:grid-cols-2 overflow-hidden">
          <div className="bg-gradient-to-br from-green-600 to-teal-600 text-white p-10 flex flex-col justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-white/80 mb-3">
                Eco Impact
              </p>
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Login or create an account to track your recycling journey
              </h2>
              <p className="text-white/90 text-lg">
                Save every analysis, earn achievements, and build a profile that celebrates your
                sustainability wins.
              </p>
            </div>
            <div className="mt-10 space-y-3 text-white/80 text-sm">
              <p>• Unlimited AI waste analyses</p>
              <p>• Personal dashboard & achievements</p>
              <p>• Secure cloud backups powered by Firebase</p>
            </div>
          </div>

          <div className="p-10">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  mode === 'signup'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <>
                  <label className="block">
                    <span className="text-sm text-gray-600">Full Name</span>
                    <div className="relative mt-1">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        placeholder="Jane Doe"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-600">Phone Number</span>
                    <div className="relative mt-1">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        required
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        placeholder="+1 555 555 1234"
                      />
                    </div>
                  </label>
                </>
              )}

              <label className="block">
                <span className="text-sm text-gray-600">Email</span>
                <div className="relative mt-1">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    placeholder="you@example.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Password</span>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    placeholder="********"
                  />
                </div>
              </label>

              {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <p className="text-center text-sm text-gray-500">
                By continuing you agree to our{' '}
                <span className="text-green-600 font-semibold">eco code of conduct</span>.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

