import { useState, useEffect } from "react";
import { Building, MapPin, Bed, Bath, Ruler, Eye, TrendingUp, TrendingDown, CheckCircle, Heart, Gavel } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ListingDetailView from "./ListingDetailView";
import { useFavorites } from "@/hooks/useFavorites";
import { getUserId } from "@/utils/session";

interface Listing {
  listing_id: string;
  address: string;
  neighborhood: string;
  price: number;
  features: {
    sqm: number;
    bedrooms: number;
    bathrooms: number;
  };
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  description: string;
  created_at: string;
  ai_valuation?: {
    status: string;
    estimated_price: number;
    diff_pct: number;
  };
  sale_type?: 'fixed' | 'auction';
  auction_end_time?: string;
  current_highest_bid?: number;
  bid_count?: number;
  view_count?: number; // From backend update
}

interface ListingListProps {
  onNavigateToMessages?: () => void;
  ownerId?: string; // Filter by owner
}

const ListingList = ({ onNavigateToMessages, ownerId }: ListingListProps = {}) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const userId = getUserId();
  const { favorites, toggleFavorite } = useFavorites(userId);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        let API_URL = "https://esi7gy463qji75j7qf53jhmyku0flswq.lambda-url.us-east-1.on.aws/";
        if (ownerId) {
          API_URL += `?owner_id=${encodeURIComponent(ownerId)}`;
        }
        
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch listings");
        const data = await response.json();
        setListings(data);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Could not load listings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [ownerId]);

  const handleViewDetails = (listing: Listing) => {
    setSelectedListing(listing);
    setDetailOpen(true);
  };

  const displayedListings = showFavoritesOnly 
    ? listings.filter(l => favorites.has(l.listing_id))
    : listings;

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader><Skeleton className="h-4 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-32 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const isMyListings = Boolean(ownerId);

  return (
    <>
      <section id="listings" className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div className="text-left">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {isMyListings ? "My Listings" : (showFavoritesOnly ? "My Favorites" : "Featured Listings")}
              </h2>
              <p className="text-slate-600">
                {isMyListings
                  ? "All the properties you've posted so far."
                  : (showFavoritesOnly ? "Homes you have liked." : "Explore homes recently listed by owners.")}
              </p>
            </div>
            
            {!isMyListings && (
               <Button 
                  variant={showFavoritesOnly ? "default" : "outline"}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="gap-2"
               >
                 <Heart className={`w-4 h-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
                 {showFavoritesOnly ? "Show All" : "My Favorites"}
               </Button>
            )}
          </div>

          {displayedListings.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <Building className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">
                {showFavoritesOnly ? "No favorites yet" : (isMyListings ? "You haven't posted any listings yet" : "No listings yet")}
              </h3>
              <p className="text-slate-500">
                {showFavoritesOnly ? "Mark listings with a heart to see them here." : (isMyListings ? "Create your first listing to see it here." : "Be the first to post your property!")}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedListings.map((listing) => (
                <Card key={listing.listing_id} className="shadow-md hover:shadow-lg transition-shadow duration-300 border-slate-100 overflow-hidden flex flex-col relative group">
                  
                  {/* AI Badge */}
                  {listing.ai_valuation && (
                     <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                        {listing.ai_valuation.status === 'Good Deal' && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1 pl-1.5 shadow-sm">
                              <TrendingUp className="w-3 h-3" /> Great Deal
                          </Badge>
                        )}
                        {listing.ai_valuation.status === 'Overpriced' && (
                          <Badge variant="destructive" className="gap-1 pl-1.5 shadow-sm">
                              <TrendingDown className="w-3 h-3" /> Overpriced
                          </Badge>
                        )}
                        {listing.ai_valuation.status === 'Fair Price' && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 gap-1 pl-1.5 shadow-sm">
                              <CheckCircle className="w-3 h-3" /> Fair Price
                          </Badge>
                        )}
                     </div>
                  )}

                  {/* Auction Badge */}
                  {listing.sale_type === 'auction' && (
                     <div className="absolute top-4 left-4 z-10">
                        <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1 pl-1.5 shadow-sm animate-pulse">
                              <Gavel className="w-3 h-3" /> Auction
                          </Badge>
                     </div>
                  )}

                  <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 pt-12">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                          <CardTitle className="text-lg font-bold text-slate-800 truncate" title={listing.address}>
                          {listing.address}
                          </CardTitle>
                          <div className="flex items-center text-slate-500 text-sm mt-1">
                              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{listing.neighborhood}</span>
                          </div>
                      </div>
                       <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 -mt-1 -mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(listing.listing_id);
                          }}
                       >
                          <Heart className={`w-5 h-5 ${favorites.has(listing.listing_id) ? "fill-red-500 text-red-500" : ""}`} />
                       </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex-grow">
                      <div className="flex justify-between items-end mb-4">
                           <div>
                              <span className="block text-2xl font-bold text-slate-900">
                                  €{(listing.current_highest_bid || listing.price).toLocaleString()}
                              </span>
                              {listing.sale_type === 'auction' && (
                                <span className="text-xs font-medium text-purple-600">
                                  {listing.bid_count || 0} bids
                                </span>
                              )}
                           </div>
                           <div className="text-right">
                               <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                  €{Math.round((listing.current_highest_bid || listing.price) / listing.features.sqm).toLocaleString()}/m²
                              </span>
                           </div>
                      </div>

                    <div className="grid grid-cols-3 gap-2 mb-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1 bg-slate-50 p-2 rounded-lg justify-center">
                          <Ruler className="w-4 h-4 text-slate-400" />
                          <span>{listing.features.sqm} m²</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50 p-2 rounded-lg justify-center">
                          <Bed className="w-4 h-4 text-slate-400" />
                          <span>{listing.features.bedrooms} Bed</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50 p-2 rounded-lg justify-center">
                          <Bath className="w-4 h-4 text-slate-400" />
                          <span>{listing.features.bathrooms} Bath</span>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4 italic">
                      "{listing.description || "No description provided."}"
                    </p>
                  </CardContent>
                  <CardFooter className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center gap-2">
                      <div className="text-sm flex-shrink min-w-0">
                          <p className="font-medium text-slate-900 truncate">{listing.contact.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {listing.view_count !== undefined && (
                          <div className="flex items-center text-xs text-slate-400 mr-2">
                             <Eye className="w-3 h-3 mr-1" /> {listing.view_count}
                          </div>
                        )}
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0" 
                          size="sm"
                          onClick={() => handleViewDetails(listing)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Listing Detail View */}
      {detailOpen && selectedListing && (
        <ListingDetailView
          listing={selectedListing}
          onClose={() => setDetailOpen(false)}
          onMessageOwner={onNavigateToMessages}
          isFavorite={favorites.has(selectedListing.listing_id)}
          onToggleFavorite={() => toggleFavorite(selectedListing.listing_id)}
        />
      )}
    </>
  );
};

export default ListingList;
