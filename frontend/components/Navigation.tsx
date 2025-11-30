import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Leaf className="w-8 h-8 text-green-600" />
          <span className="text-2xl font-bold text-gray-900">Eco-Eco</span>
        </Link>
        <div className="flex gap-6">
          <Link href="/" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
            Home
          </Link>
          <Link href="/upload" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
            Trash Talk
          </Link>
          <Link href="/dashboard" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}