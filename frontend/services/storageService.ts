
import { User } from '../types';

/**
 * In a production environment, this service would interact with the Google Cloud Storage JSON API
 * or use the Firebase Storage SDK to upload files to a bucket (e.g., gs://aura-user-data).
 * 
 * Since this is a client-side demo without a backend proxy or service account credentials,
 * we simulate the network latency and storage logic.
 */

const CLOUD_STORAGE_BUCKET = 'aura-user-assets';

// Simulate uploading a profile picture to Google Cloud Storage
export const uploadProfileImage = async (file: File): Promise<string> => {
  console.log(`[Cloud Storage] Initiating upload to gs://${CLOUD_STORAGE_BUCKET}/avatars/${file.name}...`);
  
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (file.size > 5000000) { // 5MB limit check
    throw new Error("File too large. Max size is 5MB.");
  }

  // In a real app, this would return the public URL from GCS
  // For demo, we create a local object URL to display the image immediately
  const mockUrl = URL.createObjectURL(file);
  console.log(`[Cloud Storage] Upload successful: ${mockUrl}`);
  
  return mockUrl;
};

// Simulate saving user metadata (JSON) to Google Cloud Storage
export const saveUserDataToCloud = async (user: User): Promise<void> => {
  console.log(`[Cloud Storage] Saving metadata to gs://${CLOUD_STORAGE_BUCKET}/users/${user.id}.json...`);
  
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Verify data integrity (mock)
  if (!user.id) {
    throw new Error("Invalid user ID");
  }

  console.log(`[Cloud Storage] User data synced successfully.`);
};
