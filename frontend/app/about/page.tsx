'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Leaf, Recycle, BarChart3, ArrowLeft, Sparkles, Target, Users, TrendingUp, Award, Zap, Globe, Heart } from 'lucide-react';

export default function AboutPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-green-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Leaf className="w-8 h-8 text-green-600 group-hover:rotate-12 transition-transform" />
            <span className="text-2xl font-bold text-gray-900">Eco-Eco</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
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
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mb-6 shadow-2xl animate-pulse hover:scale-110 transition-transform duration-300 cursor-pointer">
              <Leaf className="w-12 h-12 text-white animate-spin-slow" style={{ animation: 'spin 20s linear infinite' }} />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent animate-fade-in">
              About Eco-Eco
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-slide-up">
              Empowering sustainable choices through innovative technology
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-green-600 to-teal-600 mx-auto mt-6 rounded-full animate-expand"></div>
          </div>
        </div>
      </div>

      {/* About Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Vision Card */}
        <div 
          id="vision"
          ref={(el) => { sectionRefs.current['vision'] = el; }}
          className={`group bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 mb-8 border-2 border-transparent hover:border-green-200 transform ${
            isVisible['vision'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          onMouseEnter={() => setHoveredCard('vision')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-start gap-6">
            <div className={`flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-500 relative ${
              hoveredCard === 'vision' 
                ? 'bg-gradient-to-br from-green-500 to-teal-500 scale-125 rotate-12 shadow-2xl' 
                : 'bg-green-100'
            }`}>
              <Target className={`w-10 h-10 transition-all duration-500 ${
                hoveredCard === 'vision' ? 'text-white animate-pulse' : 'text-green-600'
              }`} />
              {hoveredCard === 'vision' && (
                <div className="absolute inset-0 rounded-xl bg-green-400 animate-ping opacity-75"></div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-300 flex items-center gap-3">
                Our Vision
                {hoveredCard === 'vision' && <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" />}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                To create a world where every individual understands the impact of their waste and is empowered 
                to make sustainable choices. We envision a future where waste management is intuitive, accessible, 
                and rewarding—where technology bridges the gap between environmental awareness and actionable change.
              </p>
            </div>
          </div>
        </div>

        {/* Mission Card */}
        <div 
          id="mission"
          ref={(el) => { sectionRefs.current['mission'] = el; }}
          className={`group bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 mb-8 border-2 border-transparent hover:border-green-200 transform ${
            isVisible['mission'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          onMouseEnter={() => setHoveredCard('mission')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-start gap-6">
            <div className={`flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-500 relative ${
              hoveredCard === 'mission' 
                ? 'bg-gradient-to-br from-green-500 to-teal-500 scale-125 rotate-12 shadow-2xl' 
                : 'bg-green-100'
            }`}>
              <Recycle className={`w-10 h-10 transition-all duration-500 ${
                hoveredCard === 'mission' ? 'text-white animate-spin' : 'text-green-600'
              }`} style={hoveredCard === 'mission' ? { animationDuration: '2s' } : {}} />
              {hoveredCard === 'mission' && (
                <div className="absolute inset-0 rounded-xl bg-green-400 animate-ping opacity-75"></div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-300 flex items-center gap-3">
                Our Mission
                {hoveredCard === 'mission' && <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6 group-hover:text-gray-900 transition-colors">
                Eco-Eco (Trash Talk) is committed to revolutionizing waste management through innovative technology. 
                Our mission is to:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Make waste classification accessible to everyone through AI-powered image recognition',
                  'Educate users about proper recycling practices and environmental impact',
                  'Track and visualize individual contributions to environmental sustainability',
                  'Build a community of eco-conscious individuals sharing knowledge and best practices',
                  'Provide data-driven insights that inspire positive behavioral change'
                ].map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 transition-all duration-300 group/item hover:scale-105 hover:shadow-md"
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center mt-0.5 group-hover/item:scale-125 group-hover/item:rotate-12 transition-all duration-300 shadow-lg">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <span className="text-gray-700 group-hover/item:text-gray-900 transition-colors font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* What We Do Card */}
        <div 
          id="whatwedo"
          ref={(el) => { sectionRefs.current['whatwedo'] = el; }}
          className={`group bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 mb-8 border-2 border-transparent hover:border-green-200 transform ${
            isVisible['whatwedo'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          onMouseEnter={() => setHoveredCard('whatwedo')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-start gap-6">
            <div className={`flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-500 relative ${
              hoveredCard === 'whatwedo' 
                ? 'bg-gradient-to-br from-green-500 to-teal-500 scale-125 rotate-12 shadow-2xl' 
                : 'bg-green-100'
            }`}>
              <BarChart3 className={`w-10 h-10 transition-all duration-500 ${
                hoveredCard === 'whatwedo' ? 'text-white animate-bounce' : 'text-green-600'
              }`} />
              {hoveredCard === 'whatwedo' && (
                <div className="absolute inset-0 rounded-xl bg-green-400 animate-ping opacity-75"></div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-300 flex items-center gap-3">
                What We Do
                {hoveredCard === 'whatwedo' && <TrendingUp className="w-6 h-6 text-yellow-400 animate-pulse" />}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                Eco-Eco combines cutting-edge artificial intelligence with user-friendly design to transform how 
                people interact with waste. Our platform uses deep learning models trained on thousands of waste 
                images to instantly classify items and provide personalized recycling guidance. Through real-time 
                impact tracking, community engagement, and educational resources, we empower users to make 
                informed decisions that benefit both their communities and the planet.
              </p>
            </div>
          </div>
        </div>

        {/* Founder Card - Enhanced */}
        <div 
          id="founder"
          ref={(el) => { sectionRefs.current['founder'] = el; }}
          className={`mt-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-8 md:p-12 shadow-2xl text-white relative overflow-hidden transform transition-all duration-700 ${
            isVisible['founder'] ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'
          }`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl backdrop-blur-sm group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 cursor-pointer">
                  HM
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                  <Award className="w-6 h-6 text-yellow-900" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center animate-pulse">
                  <Heart className="w-5 h-5 text-pink-900" />
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <h3 className="text-3xl md:text-4xl font-bold mb-2 animate-fade-in">Hoza Mihu</h3>
                <p className="text-xl text-green-100 font-semibold mb-4 flex items-center justify-center md:justify-start gap-2">
                  <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                  Founder & Creator
                </p>
                <p className="text-lg text-green-50 leading-relaxed max-w-2xl">
                  Hoza Mihu envisioned Eco-Eco as a solution to bridge the gap between environmental awareness 
                  and practical action. With a passion for sustainability and technology, Hoza created this 
                  platform to make waste management accessible, engaging, and impactful for everyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p className="mb-2">© 2025 Trash Talk - Eco-Eco Project. All rights reserved.</p>
          <p className="text-sm">Built with Next.js, Firebase, TypeScript, and Google Cloud Vision API</p>
        </div>
      </footer>
    </div>
  );
}

