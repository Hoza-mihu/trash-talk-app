'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Camera, Recycle, BarChart3, Leaf, UserCircle, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Leaf className="w-8 h-8 text-green-600 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">Eco-Eco</span>
          </Link>
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
            <Link href="/about" className="text-gray-700 hover:text-green-600 font-medium">
              About
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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-teal-400/20 to-green-400/20">
          {/* Animated floating elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-green-300/30 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3s' }}></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-teal-300/30 rounded-full blur-xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-green-400/30 rounded-full blur-xl animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 relative">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-green-500 to-teal-500 rounded-full shadow-2xl animate-pulse hover:scale-110 transition-transform duration-300 cursor-pointer">
                <Leaf className="w-16 h-16 text-white animate-spin-slow" style={{ animation: 'spin 20s linear infinite' }} />
              </div>
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent animate-fade-in">
              Trash Talk
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed animate-slide-up">
              Your AI-powered waste tracking companion. Upload trash images, get instant recycling insights, 
              and track your environmental impact in real-time with Firebase.
            </p>
            <div className="flex gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link 
                href="/upload"
                className="group bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 hover:scale-110 hover:shadow-2xl flex items-center gap-2"
              >
                <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Start Analyzing
              </Link>
              <Link 
                href="/dashboard"
                className="group bg-white text-green-600 px-8 py-3 rounded-lg font-semibold border-2 border-green-600 hover:bg-green-50 transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center gap-2"
              >
                <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

        {/* How It Works Section */}
        <div className="mt-20" id="how-it-works" ref={(el) => { sectionRefs.current['how-it-works'] = el; }}>
          <h2 className={`text-4xl font-bold text-center text-gray-900 mb-12 transition-all duration-700 ${
            isVisible['how-it-works'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Camera, color: 'blue', title: '1. Upload Image', desc: 'Take a photo of your waste item and upload it to our AI-powered system', id: 'step1' },
              { icon: Recycle, color: 'green', title: '2. Get Insights', desc: 'Receive instant AI classification and personalized recycling tips', id: 'step2' },
              { icon: BarChart3, color: 'purple', title: '3. Track Impact', desc: 'Monitor your contribution and see how much waste you've reduced', id: 'step3' }
            ].map((step, index) => (
              <div
                key={step.id}
                id={step.id}
                ref={(el) => { sectionRefs.current[step.id] = el; }}
                className={`group bg-white rounded-xl p-8 shadow-sm text-center hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-${step.color}-200 transform hover:-translate-y-2 ${
                  isVisible[step.id] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredCard(step.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`w-20 h-20 bg-${step.color}-100 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 ${
                  hoveredCard === step.id ? `bg-gradient-to-br from-${step.color}-500 to-${step.color}-600` : ''
                }`}>
                  <step.icon className={`w-10 h-10 transition-all duration-500 ${
                    hoveredCard === step.id ? 'text-white scale-110' : `text-${step.color}-600`
                  }`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-green-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-600 group-hover:text-gray-800 transition-colors">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Technologies Section */}
        <div className="mt-20" id="technologies" ref={(el) => { sectionRefs.current['technologies'] = el; }}>
          <h2 className={`text-4xl font-bold text-center text-gray-900 mb-12 transition-all duration-700 ${
            isVisible['technologies'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            Technologies Used
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { emoji: '🔥', title: 'Firebase', desc: 'Authentication, Firestore Database, and Cloud Storage', id: 'tech1' },
              { emoji: '🤖', title: 'Google Cloud Vision', desc: 'AI-powered image recognition for waste classification', id: 'tech2' },
              { emoji: '⚛️', title: 'React/Next.js', desc: 'Modern frontend framework for fast, responsive UI', id: 'tech3' },
              { emoji: '💚', title: 'TypeScript', desc: 'Type-safe code for better developer experience', id: 'tech4' }
            ].map((tech, index) => (
              <div
                key={tech.id}
                id={tech.id}
                ref={(el) => { sectionRefs.current[tech.id] = el; }}
                className={`group bg-white rounded-xl p-6 shadow-sm hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-green-200 transform hover:-translate-y-2 ${
                  isVisible[tech.id] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredCard(tech.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`text-4xl mb-3 transition-all duration-500 ${
                  hoveredCard === tech.id ? 'scale-125 rotate-12' : ''
                }`}>{tech.emoji}</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-green-600 transition-colors">
                  {tech.title}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 py-20" id="cta" ref={(el) => { sectionRefs.current['cta'] = el; }}>
        <div className={`bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-12 text-center text-white shadow-xl relative overflow-hidden transform transition-all duration-700 ${
          isVisible['cta'] ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                <Leaf className="w-10 h-10 animate-pulse" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4">Ready to Make a Difference?</h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of eco-warriors tracking their environmental impact
            </p>
            <Link
              href="/upload"
              className="group inline-flex items-center gap-2 bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all duration-300 hover:scale-110 hover:shadow-2xl"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Get Started Free
            </Link>
          </div>
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