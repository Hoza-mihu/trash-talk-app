'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Recycle, Leaf, ArrowLeft, Sparkles, Award } from 'lucide-react';

interface AnalysisResult {
  item: string;
  category: string;
  confidence: number;
  tip: string;
  co2: number;
}

export default function ResultPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedResult = localStorage.getItem('analysisResult');
      const storedImage = localStorage.getItem('analyzedImage');
      
      if (storedResult) {
        const parsed = JSON.parse(storedResult);
        setResult(parsed);
      }
      if (storedImage) {
        setImage(storedImage);
      }
    } catch (error) {
      console.error('Error loading stored results:', error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, []);

  if (loading || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

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

      {/* Results Section */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Success Banner */}
        <div className="bg-green-600 text-white rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">Analysis Complete!</h2>
              <p className="text-green-100">Your waste item has been successfully identified</p>
            </div>
          </div>
        </div>

        {/* Main Results Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-6">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Image */}
            <div className="space-y-4">
              {image && (
                <div className="relative">
                  <img 
                    src={image} 
                    alt="Analyzed waste" 
                    className="w-full rounded-lg shadow-md" 
                  />
                  <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-700 shadow-lg">
                    ✨ Analyzed
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-200">
                <p className="text-sm text-gray-600 mb-2 font-medium">Item Detected</p>
                <p className="text-3xl font-bold text-gray-900">{result.item}</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-2 font-medium">Category</p>
                <p className="text-3xl font-bold text-blue-900">{result.category}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Confidence</p>
                  <p className="text-3xl font-bold text-purple-900">{result.confidence}%</p>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border-2 border-orange-200">
                  <p className="text-sm text-gray-600 mb-2 font-medium">CO₂ Saved</p>
                  <p className="text-3xl font-bold text-orange-900">{result.co2} kg</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recycling Tip */}
          <div className="bg-gradient-to-r from-green-100 to-teal-100 p-6 rounded-lg border-2 border-green-300">
            <h3 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
              <Recycle className="w-6 h-6 text-green-600" />
              Recycling Tip
            </h3>
            <p className="text-gray-700 text-lg leading-relaxed">{result.tip}</p>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">🌊</div>
            <p className="text-2xl font-bold text-blue-600 mb-2">2.5 L</p>
            <p className="text-sm text-gray-600">Water Saved</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">🌳</div>
            <p className="text-2xl font-bold text-green-600 mb-2">0.5</p>
            <p className="text-sm text-gray-600">Trees Equivalent</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">⚡</div>
            <p className="text-2xl font-bold text-purple-600 mb-2">1.2 kWh</p>
            <p className="text-sm text-gray-600">Energy Conserved</p>
          </div>
        </div>

        {/* Achievement Badge */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 shadow-lg mb-6 border-2 border-yellow-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Great Job! 🎉</h3>
              <p className="text-gray-700">You're contributing to a cleaner planet!</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link 
            href="/upload"
            className="flex-1 bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-all hover:scale-105 text-center shadow-lg"
          >
            📸 Analyze Another Item
          </Link>
          <Link 
            href="/dashboard"
            className="flex-1 bg-white text-green-600 py-4 rounded-lg font-semibold border-2 border-green-600 hover:bg-green-50 transition-all hover:scale-105 text-center shadow-lg"
          >
            📊 View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}