'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
}

export default function ImageUpload({ onImageSelect }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onImageSelect(file, result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-12 shadow-lg">
      {!preview ? (
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
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div>
          <img src={preview} alt="Uploaded" className="w-full rounded-lg mb-6 max-h-96 object-contain" />
        </div>
      )}
    </div>
  );
}