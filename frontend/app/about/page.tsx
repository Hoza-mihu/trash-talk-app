'use client';

import Link from 'next/link';
import { Leaf, Recycle, BarChart3, ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">Eco-Eco</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </nav>

      {/* About Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">About Eco-Eco</h1>
            <div className="w-24 h-1 bg-green-600 mx-auto"></div>
          </div>

          <div className="max-w-4xl mx-auto space-y-10">
            {/* Vision */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Leaf className="w-8 h-8 text-green-600" />
                Our Vision
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                To create a world where every individual understands the impact of their waste and is empowered 
                to make sustainable choices. We envision a future where waste management is intuitive, accessible, 
                and rewarding—where technology bridges the gap between environmental awareness and actionable change.
              </p>
            </div>

            {/* Mission */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Recycle className="w-8 h-8 text-green-600" />
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Eco-Eco (Trash Talk) is committed to revolutionizing waste management through innovative technology. 
                Our mission is to:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span className="text-lg">Make waste classification accessible to everyone through AI-powered image recognition</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span className="text-lg">Educate users about proper recycling practices and environmental impact</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span className="text-lg">Track and visualize individual contributions to environmental sustainability</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span className="text-lg">Build a community of eco-conscious individuals sharing knowledge and best practices</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span className="text-lg">Provide data-driven insights that inspire positive behavioral change</span>
                </li>
              </ul>
            </div>

            {/* What We Do */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-green-600" />
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

            {/* Founder */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  HM
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Hoza Mihu</h3>
                  <p className="text-lg text-green-600 font-semibold mb-3">Founder & Creator</p>
                  <p className="text-gray-700 max-w-2xl leading-relaxed">
                    Hoza Mihu envisioned Eco-Eco as a solution to bridge the gap between environmental awareness 
                    and practical action. With a passion for sustainability and technology, Hoza created this 
                    platform to make waste management accessible, engaging, and impactful for everyone.
                  </p>
                </div>
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

