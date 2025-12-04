'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Leaf, Recycle, BarChart3, ArrowLeft, Sparkles, Target, Users, TrendingUp, Award } from 'lucide-react';

export default function AboutPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-teal-400/20 to-green-400/20"></div>
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mb-6 shadow-2xl animate-pulse">
              <Leaf className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              About Eco-Eco
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Empowering sustainable choices through innovative technology
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-green-600 to-teal-600 mx-auto mt-6 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* About Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Vision Card */}
        <div 
          className="group bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 mb-8 border-2 border-transparent hover:border-green-200"
          onMouseEnter={() => setHoveredCard('vision')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-start gap-6">
            <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300 ${
              hoveredCard === 'vision' 
                ? 'bg-gradient-to-br from-green-500 to-teal-500 scale-110 rotate-6' 
                : 'bg-green-100'
            }`}>
              <Target className={`w-8 h-8 transition-colors duration-300 ${
                hoveredCard === 'vision' ? 'text-white' : 'text-green-600'
              }`} />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">
                Our Vision
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                To create a world where every individual understands the impact of their waste and is empowered 
                to make sustainable choices. We envision a future where waste management is intuitive, accessible, 
                and rewarding—where technology bridges the gap between environmental awareness and actionable change.
              </p>
            </div>
          </div>
        </div>

        {/* Mission Card */}
        <div 
          className="group bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 mb-8 border-2 border-transparent hover:border-green-200"
          onMouseEnter={() => setHoveredCard('mission')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-start gap-6">
            <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300 ${
              hoveredCard === 'mission' 
                ? 'bg-gradient-to-br from-green-500 to-teal-500 scale-110 rotate-6' 
                : 'bg-green-100'
            }`}>
              <Recycle className={`w-8 h-8 transition-colors duration-300 ${
                hoveredCard === 'mission' ? 'text-white' : 'text-green-600'
              }`} />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
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
                    className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 transition-all duration-300 group/item"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center mt-0.5 group-hover/item:scale-110 transition-transform">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <span className="text-gray-700 group-hover/item:text-gray-900 transition-colors">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* What We Do Card */}
        <div 
          className="group bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-300 mb-8 border-2 border-transparent hover:border-green-200"
          onMouseEnter={() => setHoveredCard('whatwedo')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex items-start gap-6">
            <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300 ${
              hoveredCard === 'whatwedo' 
                ? 'bg-gradient-to-br from-green-500 to-teal-500 scale-110 rotate-6' 
                : 'bg-green-100'
            }`}>
              <BarChart3 className={`w-8 h-8 transition-colors duration-300 ${
                hoveredCard === 'whatwedo' ? 'text-white' : 'text-green-600'
              }`} />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">
                What We Do
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
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
        <div className="mt-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                  HM
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                  <Award className="w-5 h-5 text-yellow-900" />
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <h3 className="text-3xl md:text-4xl font-bold mb-2">Hoza Mihu</h3>
                <p className="text-xl text-green-100 font-semibold mb-4 flex items-center justify-center md:justify-start gap-2">
                  <Sparkles className="w-5 h-5" />
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

