import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import {
  createDefaultUserStats,
  recordCategorySample,
  type UserStats
} from './stats';

export interface AnalysisData {
  item: string;
  category: string;
  confidence: number;
  tip: string;
  co2: number;
}

// Save analysis result to Firestore
export async function saveAnalysisResult(userId: string, analysisData: AnalysisData, imageFile: File) {
  let imageUrl: string | null = null;

  try {
    const storageRef = ref(storage, `images/${userId}/${Date.now()}_${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    imageUrl = await getDownloadURL(storageRef);
  } catch (storageError) {
    console.error('Image upload failed, storing analysis without image URL:', storageError);
  }

  try {
    const docRef = await addDoc(collection(db, 'analyses'), {
      userId,
      item: analysisData.item,
      category: analysisData.category,
      confidence: analysisData.confidence,
      tip: analysisData.tip,
      co2Saved: analysisData.co2,
      imageUrl,
      timestamp: new Date().toISOString()
    });

    return { success: true, docId: docRef.id };
  } catch (error) {
    console.error('Error saving analysis:', error);
    return { success: false, error };
  }
}

// Get user statistics from Firestore
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const q = query(collection(db, 'analyses'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const stats = createDefaultUserStats();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      recordCategorySample(
        stats,
        data.item || 'Other',
        data.category || 'Other',
        data.co2Saved || 0
      );
    });

    return stats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

// Format date
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Calculate environmental impact
// DEPRECATED: Use calculateEnvironmentalImpact from environmental-impact.ts instead
// This function is kept for backward compatibility but uses outdated hardcoded values
export function calculateImpact(totalItems: number) {
  return {
    waterSaved: (totalItems * 2.5).toFixed(0), // liters
    treesEquivalent: (totalItems * 0.5).toFixed(1),
    energyConserved: (totalItems * 1.2).toFixed(0) // kWh
  };
}