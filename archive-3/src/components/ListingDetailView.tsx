import { useState, useRef, useEffect } from "react";
import { X, MapPin, Bed, Bath, Ruler, Euro, Phone, Mail, MessageCircle, Send, ArrowLeft, Heart, Gavel, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ChatMessage from "./ChatMessage";
import { getUserId } from "@/utils/session";
import { toast } from "sonner";

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Listing {
  listing_id: string;
  owner_id?: string;
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
  highest_bidder_id?: string;
  starting_bid?: number;
  view_count?: number;
}

interface ListingDetailViewProps {
  listing: Listing;
  onClose: () => void;
  onMessageOwner?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const TRACK_VIEW_URL = "https://tmmtqmnxanpapvmsm62ir4mkjq0iqiso.lambda-url.us-east-1.on.aws/";
const PLACE_BID_URL = "https://qsughukc63qq7ezc2uveqo7reu0yfmsc.lambda-url.us-east-1.on.aws/";

const ListingDetailView = ({ listing, onClose, onMessageOwner, isFavorite, onToggleFavorite }: ListingDetailViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);
  const [messageInput, setMessageInput] = useState("Hi, I'm interested in this property. Is it still available?");
  const [isSending, setIsSending] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number]>([41.3851, 2.1734]); // Barcelona center default
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isBidding, setIsBidding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const userId = getUserId();

  // Track view on mount
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch(TRACK_VIEW_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             listing_id: listing.listing_id,
             created_at: listing.created_at,
             viewer_id: userId
          })
        });
      } catch (e) {
        console.error("Failed to track view", e);
      }
    };
    trackView();
  }, [listing.listing_id, listing.created_at, userId]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Geocode address to get coordinates
  useEffect(() => {
    const geocodeAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            listing.address + ", Barcelona, Spain"
          )}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      }
    };
    geocodeAddress();
  }, [listing.address]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch(
        "https://jqcs7rfwkbj3nl5y7izyrybxim0blcds.lambda-url.us-east-1.on.aws/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: input,
            history,
            mode: "listing",
            listing_data: listing,
          }),
        }
      );

      const data = await response.json();
      const assistantMsg = {
        role: "assistant" as const,
        content: data.answer || "I couldn't get an answer.",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    const amount = parseFloat(bidAmount);
    const currentPrice = listing.current_highest_bid || listing.starting_bid || listing.price;
    
    if (isNaN(amount) || amount <= currentPrice) {
      toast.error(`Bid must be higher than €${currentPrice.toLocaleString()}`);
      return;
    }

    setIsBidding(true);
    try {
      const response = await fetch(PLACE_BID_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.listing_id,
          created_at: listing.created_at,
          bidder_id: userId,
          amount: amount
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place bid');
      }

      const data = await response.json();
      toast.success("Bid placed successfully!");
      // Ideally update local state to reflect new price immediately
      listing.current_highest_bid = amount; 
      listing.bid_count = (listing.bid_count || 0) + 1;
      setBidAmount("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsBidding(false);
    }
  };

  const getValuationBadge = () => {
    if (!listing.ai_valuation) return null;
    const { status } = listing.ai_valuation;

    const badgeClasses = {
      "Good Deal": "bg-green-500 text-white",
      "Overpriced": "bg-red-500 text-white",
      "Fair Price": "bg-blue-500 text-white",
    };

    return (
      <Badge className={badgeClasses[status as keyof typeof badgeClasses] || "bg-gray-500"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-slate-50">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{listing.address}</h2>
              {getValuationBadge()}
              {listing.sale_type === 'auction' && (
                  <Badge className="bg-purple-600 text-white gap-1 animate-pulse">
                      <Gavel className="w-3 h-3" /> Auction
                  </Badge>
              )}
            </div>
            <div className="flex items-center text-slate-600">
              <MapPin className="w-4 h-4 mr-1" />
              {listing.neighborhood}
              <span className="mx-2 text-slate-300">|</span>
              <Eye className="w-4 h-4 mr-1" />
              {(listing.view_count || 0) + 1} views
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onToggleFavorite && (
               <Button
                  variant="outline"
                  size="icon"
                  onClick={onToggleFavorite}
                  className={isFavorite ? "text-red-500 border-red-200 bg-red-50" : "text-slate-400"}
               >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
               </Button>
            )}
            <Button variant="outline" onClick={onClose} className="hidden md:flex">
              Back to Results
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        <div className="px-6 py-2 bg-slate-100 text-xs text-slate-500 border-b flex justify-between">
            <span>Listing ID: {listing.listing_id.substring(0, 8)}...</span>
            <span>Owner ID: {listing.owner_id || "N/A"}</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Property Details */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Price / Auction */}
            <Card className={`border-2 ${listing.sale_type === 'auction' ? 'border-purple-200 bg-purple-50' : 'border-orange-200 bg-orange-50'}`}>
              <CardContent className="p-6">
                {listing.sale_type === 'auction' ? (
                   <div className="space-y-4">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-sm font-medium text-purple-700 mb-1 flex items-center gap-2">
                                  <Clock className="w-4 h-4" /> Auction Ends: {new Date(listing.auction_end_time || "").toLocaleDateString()}
                              </p>
                              <p className="text-4xl font-bold text-slate-900">
                                  €{(listing.current_highest_bid || listing.starting_bid || listing.price).toLocaleString()}
                              </p>
                              <p className="text-sm text-slate-500 mt-1">
                                  Current Highest Bid • {listing.bid_count || 0} bids
                              </p>
                          </div>
                          <div className="text-right">
                              <p className="text-sm text-slate-600 mb-1">Starting Price</p>
                              <p className="text-xl font-semibold text-slate-700">
                                  €{(listing.starting_bid || listing.price).toLocaleString()}
                              </p>
                          </div>
                      </div>
                      
                      {/* Bidding Interface */}
                      <div className="bg-white p-4 rounded-lg border border-purple-100 flex gap-4 items-end">
                          <div className="flex-1">
                              <label className="text-xs font-medium text-slate-500 mb-1 block">Your Bid (€)</label>
                              <Input 
                                  type="number" 
                                  placeholder={`Min €${((listing.current_highest_bid || listing.starting_bid || listing.price) + 100).toLocaleString()}`}
                                  value={bidAmount}
                                  onChange={(e) => setBidAmount(e.target.value)}
                                  className="border-purple-200 focus:border-purple-500"
                              />
                          </div>
                          <Button 
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={handlePlaceBid}
                              disabled={isBidding || !bidAmount}
                          >
                              {isBidding ? "Placing Bid..." : "Place Bid"}
                              <Gavel className="w-4 h-4 ml-2" />
                          </Button>
                      </div>
                   </div>
                ) : (
                    <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-slate-600 mb-1">Asking Price</p>
                        <p className="text-4xl font-bold text-slate-900">
                        €{listing.price.toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                        €{Math.round(listing.price / listing.features.sqm).toLocaleString()}/m²
                        </p>
                    </div>
                    {listing.ai_valuation && (
                        <div className="text-right">
                        <p className="text-sm text-slate-600 mb-1">AI Estimate</p>
                        <p className="text-2xl font-semibold text-blue-600">
                            €{listing.ai_valuation.estimated_price.toLocaleString()}
                        </p>
                        <p className={`text-sm font-medium ${
                            listing.ai_valuation.diff_pct < 0 ? "text-green-600" : "text-red-600"
                        }`}>
                            {listing.ai_valuation.diff_pct > 0 ? "+" : ""}
                            {listing.ai_valuation.diff_pct.toFixed(1)}%
                        </p>
                        </div>
                    )}
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-slate-900">Property Features</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg">
                    <Ruler className="w-6 h-6 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{listing.features.sqm}</p>
                      <p className="text-sm text-slate-600">Square meters</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg">
                    <Bed className="w-6 h-6 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{listing.features.bedrooms}</p>
                      <p className="text-sm text-slate-600">Bedrooms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg">
                    <Bath className="w-6 h-6 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{listing.features.bathrooms}</p>
                      <p className="text-sm text-slate-600">Bathrooms</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 text-slate-900">Description</h3>
                <p className="text-slate-700 leading-relaxed">{listing.description || "No description provided."}</p>
              </CardContent>
            </Card>

            {/* Map */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 text-slate-900">Location</h3>
                <div className="h-[300px] rounded-lg overflow-hidden border-2 border-slate-200">
                  <MapContainer
                    center={coordinates}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <Marker position={coordinates}>
                      <Popup>{listing.address}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-slate-900">Contact Owner</h3>
                
                {!isMessaging ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 mb-2">{listing.contact.name}</p>
                      <div className="flex gap-4 text-sm text-slate-600">
                        {listing.contact.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {listing.contact.email}
                          </div>
                        )}
                        {listing.contact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {listing.contact.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => setIsMessaging(true)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message Owner
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">Send a message to {listing.contact.name}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsMessaging(false)}
                        className="text-slate-500 h-8 px-2"
                      >
                        Cancel
                      </Button>
                    </div>
                    <Textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type your message here..."
                      className="min-h-[100px] bg-slate-50"
                    />
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isSending || !messageInput.trim()}
                      onClick={async () => {
                        if (!messageInput.trim()) return;
                        setIsSending(true);
                        const currentUserId = getUserId();

                        try {
                          const API_URL = "https://rxeaxidiopnx4tw2pa7ukgxdhm0jwtuz.lambda-url.us-east-1.on.aws/";
                          const response = await fetch(API_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              sender_id: currentUserId,
                              listing_id: listing.listing_id,
                              owner_id: listing.owner_id || "owner_" + listing.listing_id,
                              message: messageInput,
                              listing_address: listing.address,
                              listing_neighborhood: listing.neighborhood
                            })
                          });
                          
                          if (!response.ok) throw new Error("Failed to send");
                          toast.success("Message sent! Redirecting to chat...");
                          
                          // Close detail view and navigate to messages
                          onClose();
                          if (onMessageOwner) {
                            onMessageOwner();
                          }
                        } catch (error) {
                          console.error(error);
                          toast.error("Failed to send message");
                          setIsSending(false);
                        }
                      }}
                    >
                      {isSending ? "Sending..." : "Send Message"}
                      <Send className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: AI Chat Sidebar */}
          <div className="w-[400px] border-l bg-slate-50 flex flex-col">
            <div className="p-4 border-b bg-orange-50">
              <h3 className="flex items-center gap-2 font-semibold text-orange-900">
                <MessageCircle className="w-5 h-5" />
                Ask AI About This Property
              </h3>
              <p className="text-xs text-orange-700 mt-1">
                Get insights about the neighborhood, valuation, and more
              </p>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-slate-500 py-8">
                    Ask me anything about this property!
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-orange-500 text-white"
                          : "bg-white text-slate-900 border border-slate-200"
                      }`}
                    >
                      <ChatMessage content={msg.content} role={msg.role} />
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm italic text-slate-600">
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about this property..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailView;

