import { useState, useEffect } from 'react';

interface AddressSuggestion {
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    city?: string;
    postcode?: string;
  };
  lat: string;
  lon: string;
}

export const useAddressAutocomplete = (query: string, enabled: boolean = true) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&` +
          `addressdetails=1&` +
          `limit=5&` +
          `q=${encodeURIComponent(query)}, Barcelona, Spain`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Address autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [query, enabled]);

  return { suggestions, isLoading };
};

export const inferNeighborhood = (address: AddressSuggestion): string => {
  // Try to extract neighborhood from address components
  const { suburb, neighbourhood, city_district } = address.address;
  
  // Priority: neighbourhood > suburb > city_district
  return neighbourhood || suburb || city_district || 'Unknown';
};

