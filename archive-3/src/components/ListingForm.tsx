import { useState } from "react";
import { Building, Home, Bath, Bed, Euro, Mail, Phone, FileText, TrendingUp, TrendingDown, CheckCircle, Snowflake, Waves, ArrowUpFromLine, Sun, Gavel, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import AddressAutocomplete from "./AddressAutocomplete";
import { getUserId } from "@/utils/session";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ListingForm = () => {
  // Property Details
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [sqm, setSqm] = useState("");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("1");
  const [price, setPrice] = useState("");
  const [hasAC, setHasAC] = useState(false);
  const [hasPool, setHasPool] = useState(false);
  const [hasElevator, setHasElevator] = useState(false);
  const [hasTerrace, setHasTerrace] = useState(false);
  
  // Auction Details
  const [saleType, setSaleType] = useState<'fixed' | 'auction'>('fixed');
  const [auctionDuration, setAuctionDuration] = useState("7");

  // Contact Details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAiFeedback(null);

    try {
      let auction_end_time = null;
      if (saleType === 'auction') {
          const date = new Date();
          date.setDate(date.getDate() + parseInt(auctionDuration));
          auction_end_time = date.toISOString();
      }

      const payload = {
        owner_id: getUserId(),
        address,
        neighborhood,
        price: parseFloat(price),
        sale_type: saleType,
        starting_bid: saleType === 'auction' ? parseFloat(price) : null,
        auction_end_time: auction_end_time,
        features: {
            sqm: parseFloat(sqm),
            bedrooms: parseInt(bedrooms),
            bathrooms: parseInt(bathrooms),
            has_ac: hasAC,
            has_pool: hasPool,
            has_elevator: hasElevator,
            has_terrace: hasTerrace
        },
        contact: {
            name,
            email,
            phone
        },
        description
      };

      // API URL from Terraform Output
      const API_URL = "https://ocrwuhrasy2dmjdkcxbsvp75cm0ghrid.lambda-url.us-east-1.on.aws/";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to create listing");

      const data = await response.json();
      
      if (data.error) {
          throw new Error(data.error);
      }

      setAiFeedback(data.ai_valuation);

      toast.success("Listing Posted Successfully!", {
        description: "Your property is now live on the marketplace."
      });

    } catch (error) {
      console.error("Error:", error);
      toast.error("Submission Failed", {
        description: "Could not post listing. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="post-listing" className="py-12 bg-slate-50/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Sell Your Home</h2>
            <p className="text-slate-600">Post your property listing to reach thousands of buyers.</p>
          </div>

          {aiFeedback && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <Alert className={`border-l-4 shadow-md ${
                    aiFeedback.status === 'Overpriced' ? 'border-l-red-500 bg-red-50' :
                    aiFeedback.status === 'Good Deal' ? 'border-l-green-500 bg-green-50' :
                    'border-l-blue-500 bg-blue-50'
                }`}>
                    {aiFeedback.status === 'Overpriced' ? <TrendingDown className="h-5 w-5 text-red-600" /> :
                     aiFeedback.status === 'Good Deal' ? <TrendingUp className="h-5 w-5 text-green-600" /> :
                     <CheckCircle className="h-5 w-5 text-blue-600" />}
                    
                    <div className="ml-2">
                        <AlertTitle className={`text-lg font-bold ${
                             aiFeedback.status === 'Overpriced' ? 'text-red-800' :
                             aiFeedback.status === 'Good Deal' ? 'text-green-800' :
                             'text-blue-800'
                        }`}>
                            AI Valuation: {aiFeedback.status}
                        </AlertTitle>
                        <AlertDescription className="text-slate-700 mt-1">
                            {aiFeedback.status === 'Overpriced' && (
                                <>
                                    Your asking price is higher than our AI estimate of <strong>€{Math.round(aiFeedback.estimated_price).toLocaleString()}</strong>. 
                                    Consider lowering it to sell faster.
                                </>
                            )}
                            {aiFeedback.status === 'Good Deal' && (
                                <>
                                    Great price! It's lower than our AI estimate of <strong>€{Math.round(aiFeedback.estimated_price).toLocaleString()}</strong>. 
                                    This listing is likely to attract many buyers.
                                </>
                            )}
                            {aiFeedback.status === 'Fair Price' && (
                                <>
                                    Your price is in line with the market value estimate of <strong>€{Math.round(aiFeedback.estimated_price).toLocaleString()}</strong>.
                                </>
                            )}
                        </AlertDescription>
                    </div>
                </Alert>
            </div>
          )}

          <Card className="shadow-lg border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Building className="w-5 h-5 text-blue-600" />
                New Listing Details
              </CardTitle>
              <CardDescription>Fill out the form below to create your advertisement.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Sale Type */}
                <div className="flex justify-center">
                    <Tabs value={saleType} onValueChange={(v) => setSaleType(v as any)} className="w-[400px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="fixed" className="flex gap-2 items-center">
                                <Home className="w-4 h-4" /> Fixed Price
                            </TabsTrigger>
                            <TabsTrigger value="auction" className="flex gap-2 items-center">
                                <Gavel className="w-4 h-4" /> Auction
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Location & Price */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Location & Pricing</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <AddressAutocomplete
                                value={address}
                                onChange={setAddress}
                                onAddressSelect={(addr, nbh) => {
                                    setAddress(addr);
                                    setNeighborhood(nbh);
                                }}
                                placeholder="Start typing address in Barcelona..."
                                className="bg-slate-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="neighborhood">Neighborhood</Label>
                            <Input 
                                id="neighborhood" 
                                placeholder="e.g., Eixample"
                                value={neighborhood}
                                onChange={(e) => setNeighborhood(e.target.value)}
                                required
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="price">
                                {saleType === 'auction' ? 'Starting Bid (€)' : 'Asking Price (€)'}
                            </Label>
                            <div className="relative">
                                <Euro className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input 
                                    id="price" 
                                    type="number"
                                    placeholder={saleType === 'auction' ? "150000" : "250000"}
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                    className="pl-9 bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>

                        {saleType === 'auction' && (
                            <div className="space-y-2">
                                <Label htmlFor="duration">Auction Duration</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Select value={auctionDuration} onValueChange={setAuctionDuration}>
                                        <SelectTrigger className="pl-9 bg-slate-50 border-slate-200">
                                            <SelectValue placeholder="Select duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 Day</SelectItem>
                                            <SelectItem value="3">3 Days</SelectItem>
                                            <SelectItem value="7">7 Days</SelectItem>
                                            <SelectItem value="14">14 Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Property Features</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="sqm">Size (m²)</Label>
                            <Input 
                                id="sqm" 
                                type="number"
                                placeholder="85"
                                value={sqm}
                                onChange={(e) => setSqm(e.target.value)}
                                required
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bedrooms">Bedrooms</Label>
                            <Select value={bedrooms} onValueChange={setBedrooms}>
                                <SelectTrigger id="bedrooms" className="bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <SelectItem key={num} value={num.toString()}>{num}{num === 5 ? '+' : ''}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bathrooms">Bathrooms</Label>
                            <Select value={bathrooms} onValueChange={setBathrooms}>
                                <SelectTrigger id="bathrooms" className="bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4].map(num => (
                                        <SelectItem key={num} value={num.toString()}>{num}{num === 4 ? '+' : ''}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                            id="description"
                            placeholder="Tell us more about the property..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-slate-50 border-slate-200 min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <Label>Amenities</Label>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: "ac", label: "AC", icon: Snowflake, checked: hasAC, set: setHasAC },
                                { id: "pool", label: "Pool", icon: Waves, checked: hasPool, set: setHasPool },
                                { id: "elevator", label: "Elevator", icon: ArrowUpFromLine, checked: hasElevator, set: setHasElevator },
                                { id: "terrace", label: "Terrace", icon: Sun, checked: hasTerrace, set: setHasTerrace },
                            ].map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <item.icon className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                    </div>
                                    <Switch id={item.id} checked={item.checked} onCheckedChange={item.set} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Contact Information</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <Input 
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input 
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-9 bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input 
                                    id="phone"
                                    type="tel"
                                    placeholder="+34 600 000 000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    className="pl-9 bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-12 text-lg mt-4"
                >
                  {isLoading ? "Analyzing & Posting..." : (saleType === 'auction' ? "Start Auction" : "Post Listing")}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </section>
  );
};

export default ListingForm;

