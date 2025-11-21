import { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAddressAutocomplete, inferNeighborhood } from '@/hooks/useAddressAutocomplete';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: string, neighborhood: string, lat: number, lon: number) => void;
  placeholder?: string;
  className?: string;
}

const AddressAutocomplete = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  className = ""
}: AddressAutocompleteProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, isLoading } = useAddressAutocomplete(value, showSuggestions);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(newValue.length >= 3);
  };

  const handleSelectSuggestion = (suggestion: any) => {
    const displayAddress = formatAddress(suggestion);
    onChange(displayAddress);
    setShowSuggestions(false);

    if (onAddressSelect) {
      const neighborhood = inferNeighborhood(suggestion);
      onAddressSelect(
        displayAddress,
        neighborhood,
        parseFloat(suggestion.lat),
        parseFloat(suggestion.lon)
      );
    }
  };

  const formatAddress = (suggestion: any): string => {
    const { road, house_number } = suggestion.address;
    if (road && house_number) {
      return `${road}, ${house_number}`;
    } else if (road) {
      return road;
    }
    return suggestion.display_name.split(',')[0];
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {formatAddress(suggestion)}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {inferNeighborhood(suggestion)}, Barcelona
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && suggestions.length === 0 && value.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-slate-500 text-center">
            No addresses found. Try a different search.
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;

