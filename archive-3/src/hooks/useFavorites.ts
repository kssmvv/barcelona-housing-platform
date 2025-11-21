import { useState, useEffect, useCallback } from 'react';

const GET_FAVORITES_URL = "https://ngr3uvlfqlxez2skubaupwvw2y0qrvgw.lambda-url.us-east-1.on.aws/";
const TOGGLE_FAVORITE_URL = "https://spsfbuxel3ily2sjmiwdsda5pu0jgnuu.lambda-url.us-east-1.on.aws/";

export const useFavorites = (userId: string) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${GET_FAVORITES_URL}?user_id=${userId}`);
      const data = await response.json();
      if (data.favorites) {
        setFavorites(new Set(data.favorites));
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const toggleFavorite = async (listingId: string) => {
    if (!userId) return;
    
    // Optimistic update
    const newFavorites = new Set(favorites);
    if (newFavorites.has(listingId)) {
      newFavorites.delete(listingId);
    } else {
      newFavorites.add(listingId);
    }
    setFavorites(newFavorites);

    try {
      const response = await fetch(TOGGLE_FAVORITE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          listing_id: listingId,
        }),
      });
      
      const data = await response.json();
      // If server disagrees, revert (optional, but good practice)
      // For now, relying on optimistic update being mostly right
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert on error
      fetchFavorites(); 
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return { favorites, toggleFavorite, isLoading, refreshFavorites: fetchFavorites };
};

