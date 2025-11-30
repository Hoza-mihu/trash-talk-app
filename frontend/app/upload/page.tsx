'use client';

import { useEffect, useState } from 'react';
import { Upload, Leaf, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { mergeWithDefaultStats, recordCategorySample } from '@/lib/stats';
import { useAuth } from '@/context/AuthContext';
import { saveAnalysisResult } from '@/lib/utils';

export default function UploadPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
  }, [authLoading, user, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const analyzeImage = async () => {
    if (!file) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    
    setAnalyzing(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Prefer the Next.js proxy route (same origin) and fall back to direct backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      let response;

      try {
        response = await axios.post('/api/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (proxyError) {
        console.warn('Proxy analyze route failed, falling back to backend URL', proxyError);
        response = await axios.post(`${backendUrl}/api/analyze`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      // Handle backend response format
      const result = response.data.data || response.data;
      
      // Store result and redirect
      localStorage.setItem('analysisResult', JSON.stringify(result));
      localStorage.setItem('analyzedImage', uploadedImage!);
      
      // Persist analysis in background so UI can render results immediately
      if (user && file) {
        saveAnalysisResult(user.uid, result, file).catch((err) => {
          console.error('Saving analysis result failed:', err);
        });
      }

      const statsKey = user ? `userStats_${user.uid}` : 'userStats';
      const storedStats = localStorage.getItem(statsKey);
      const stats = mergeWithDefaultStats(storedStats ? JSON.parse(storedStats) : undefined);

      recordCategorySample(
        stats,
        result.item || 'Other',
        result.category || 'Other',
        result.co2 || 0
      );

      localStorage.setItem(statsKey, JSON.stringify(stats));
      
      router.push('/result');
    } catch (error: any) {
      console.error('Analysis failed:', error);
      alert(`Analysis failed: ${error.response?.data?.message || error.message || 'Unknown error'}. Using demo mode.`);
      
      // Demo fallback
      const demoResult = {
        item: 'Plastic Bottle',
        category: 'Recyclable',
        confidence: 94.5,
        tip: 'Rinse and remove labels before recycling',
        co2: 0.5
      };
      
      localStorage.setItem('analysisResult', JSON.stringify(demoResult));
      localStorage.setItem('analyzedImage', uploadedImage!);
      router.push('/result');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">Eco-Eco</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-green-600">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Upload Section */}
      <div className="max-w-2xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">Upload Waste Image</h1>
        <p className="text-center text-gray-600 mb-8">Take a photo or select an image from your device</p>
        
        <div className="bg-white rounded-2xl p-12 shadow-lg">
          {!uploadedImage ? (
            <label className="block cursor-pointer">
              <div className="border-4 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-green-500 transition-colors">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-700 mb-2">Click to upload an image</p>
                <p className="text-gray-500">or drag and drop</p>
                <p className="text-sm text-gray-400 mt-2">PNG, JPG up to 10MB</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          ) : (
            <div>
              <img src={uploadedImage} alt="Uploaded waste" className="w-full rounded-lg mb-6 max-h-96 object-contain" />
              {analyzing ? (
                <div className="text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-lg font-semibold text-gray-700">Analyzing with AI...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={analyzeImage}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Analyze Image
                  </button>
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setFile(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Choose Another
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-3 text-gray-900">📸 Tips for Best Results</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Ensure good lighting for clear images</li>
            <li>• Focus on a single waste item</li>
            <li>• Avoid blurry or dark photos</li>
            <li>• Make sure the item is clearly visible</li>
          </ul>
        </div>
      </div>
    </div>
  );
}