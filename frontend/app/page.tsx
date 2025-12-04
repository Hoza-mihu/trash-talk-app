'use client';

import Link from 'next/link';
import { Camera, Recycle, BarChart3, Leaf, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">Eco-Eco</span>
          </div>
          <div className="flex gap-6 items-center">
            <Link href="/" className="text-gray-700 hover:text-green-600 font-medium">
              Home
            </Link>
            <Link href="/upload" className="text-gray-700 hover:text-green-600 font-medium">
              Trash Talk
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-green-600 font-medium">
              Dashboard
            </Link>
            <Link href="/community" className="text-gray-700 hover:text-green-600 font-medium">
              Community
            </Link>
            <Link
              href={user ? '/profile' : '/auth'}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <UserCircle className="w-5 h-5" />
              {user ? 'Profile' : 'Login'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Leaf className="w-24 h-24 text-green-600" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-6">Trash Talk</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Your AI-powered waste tracking companion. Upload trash images, get instant recycling insights, 
            and track your environmental impact in real-time with Firebase.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/upload"
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Start Analyzing
            </Link>
            <Link 
              href="/dashboard"
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold border-2 border-green-600 hover:bg-green-50 transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">1. Upload Image</h3>
              <p className="text-gray-600">Take a photo of your waste item and upload it to our AI-powered system</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Recycle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">2. Get Insights</h3>
              <p className="text-gray-600">Receive instant AI classification and personalized recycling tips</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">3. Track Impact</h3>
              <p className="text-gray-600">Monitor your contribution and see how much waste you've reduced</p>
            </div>
          </div>
        </div>

        {/* Technologies Section */}
        <div className="mt-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Technologies Used</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">🔥</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Firebase</h3>
              <p className="text-sm text-gray-600">Authentication, Firestore Database, and Cloud Storage</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Google Cloud Vision</h3>
              <p className="text-sm text-gray-600">AI-powered image recognition for waste classification</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">⚛️</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">React/Next.js</h3>
              <p className="text-sm text-gray-600">Modern frontend framework for fast, responsive UI</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">💚</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">TypeScript</h3>
              <p className="text-sm text-gray-600">Type-safe code for better developer experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-12 text-center text-white shadow-xl">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Leaf className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of eco-warriors tracking their environmental impact
          </p>
          <Link
            href="/upload"
            className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p className="mb-2">© 2025 Trash Talk - Eco-Eco Project. All rights reserved.</p>
          <p className="text-sm">Built with Next.js, Firebase, TypeScript, and Google Cloud Vision API</p>
        </div>
      </footer>
    </div>
  );
}