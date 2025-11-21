/**
 * Session Management for Anonymous Users
 * Uses localStorage to persist user identity across browser sessions
 */

const USER_ID_KEY = 'bcn_user_id';

/**
 * Generate a UUID v4 compatible string
 * Fallback for environments where crypto.randomUUID is not available (e.g. HTTP)
 */
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Get or create a unique user ID for this browser session
 * @returns User ID (e.g., "user_abc123-def456-...")
 */
export const getUserId = (): string => {
  try {
    let userId = localStorage.getItem(USER_ID_KEY);
    
    if (!userId) {
      // Generate new UUID-based user ID
      userId = `user_${generateUUID()}`;
      localStorage.setItem(USER_ID_KEY, userId);
    }
    
    return userId;
  } catch (error) {
    console.error("Error accessing localStorage or generating ID:", error);
    // Fallback for very restrictive environments
    return `user_${Math.random().toString(36).substring(2, 15)}`;
  }
};

/**
 * Clear user session (for testing/debugging)
 */
export const clearSession = (): void => {
  try {
    localStorage.removeItem(USER_ID_KEY);
  } catch (e) {
    console.error("Error clearing session:", e);
  }
};

/**
 * Check if user has an active session
 */
export const hasSession = (): boolean => {
  try {
    return !!localStorage.getItem(USER_ID_KEY);
  } catch (e) {
    return false;
  }
};
