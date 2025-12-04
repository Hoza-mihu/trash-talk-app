import { collection, addDoc, query, where, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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

// Delete an analysis result (only by owner)
export async function deleteAnalysisResult(analysisId: string, userId: string): Promise<void> {
  try {
    const analysisRef = doc(db, 'analyses', analysisId);
    const analysisSnap = await getDoc(analysisRef);

    if (!analysisSnap.exists()) {
      throw new Error('Analysis not found');
    }

    const analysisData = analysisSnap.data();
    if (analysisData.userId !== userId) {
      throw new Error('Only the owner can delete this analysis');
    }

    // Delete image from storage if exists
    if (analysisData.imageUrl) {
      try {
        const urlParts = analysisData.imageUrl.split('/');
        const pathIndex = urlParts.findIndex((part: string) => part === 'o');
        if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
          const encodedPath = urlParts[pathIndex + 1].split('?')[0];
          const decodedPath = decodeURIComponent(encodedPath);
          const imageRef = ref(storage, decodedPath);
          await deleteObject(imageRef);
        }
      } catch (storageError) {
        console.warn('Failed to delete analysis image from storage:', storageError);
        // Continue with analysis deletion even if image deletion fails
      }
    }

    // Delete the analysis document
    await deleteDoc(analysisRef);
  } catch (error) {
    console.error('Error deleting analysis:', error);
    throw error;
  }
}

// Get all analysis results for a user
export async function getUserAnalyses(userId: string): Promise<Array<{ id: string; [key: string]: any }>> {
  try {
    const q = query(collection(db, 'analyses'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user analyses:', error);
    return [];
  }
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