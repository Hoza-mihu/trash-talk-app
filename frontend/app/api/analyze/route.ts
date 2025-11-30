import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js API Route - Proxies requests to Flask backend
 * This route acts as a fallback/proxy to the Flask backend API
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }
    
    // Proxy to Flask backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const backendFormData = new FormData();
    backendFormData.append('image', file);
    
    try {
      const backendResponse = await fetch(`${backendUrl}/api/analyze`, {
        method: 'POST',
        body: backendFormData,
      });
      
      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.message || 'Backend analysis failed' },
          { status: backendResponse.status }
        );
      }
      
      const backendData = await backendResponse.json();
      // Return the data in the format expected by frontend
      return NextResponse.json(backendData.data || backendData);
    } catch (backendError: any) {
      console.error('Backend connection error:', backendError);
      // Fallback to mock data if backend is unavailable
      return NextResponse.json({
        error: 'Backend unavailable, using fallback',
        item: 'Plastic Bottle',
        category: 'Recyclable',
        confidence: 85.0,
        tip: 'Rinse and remove labels before recycling',
        co2: 0.5
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

