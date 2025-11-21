import { useState } from "react";
import { Calculator, MapPin, Home, Bath, Bed, Snowflake, Waves, ArrowUpFromLine, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import MapDisplay from "./MapDisplay";
import EmailReport from "./EmailReport";
import AddressAutocomplete from "./AddressAutocomplete";

const EstimatorForm = () => {
  const [address, setAddress] = useState("");
  const [sqm, setSqm] = useState("");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("1");
  const [hasAC, setHasAC] = useState(false);
  const [hasPool, setHasPool] = useState(false);
  const [hasElevator, setHasElevator] = useState(false);
  const [hasTerrace, setHasTerrace] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [details, setDetails] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setEstimate(null);
    setDetails(null);

    try {
      const payload = {
        address,
        sqm: parseFloat(sqm),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        has_elevator: hasElevator,
        has_pool: hasPool,
        has_ac: hasAC,
        has_terrace: hasTerrace
      };

      // API URL from Terraform Output
      const API_URL = "https://yxsuj3orjdzdgrm3eukeloaqte0uxjke.lambda-url.us-east-1.on.aws/";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to fetch estimate");

      const data = await response.json();
      
      if (data.error) {
          throw new Error(data.error);
      }

      setEstimate(data.estimated_price);
      setDetails(data.details);
      
      toast.success("Estimate Calculated!", {
        description: `Estimated Price: €${data.estimated_price.toLocaleString()}`
      });

    } catch (error) {
      console.error("Error:", error);
      toast.error("Calculation Failed", {
        description: "Could not calculate price. Please check inputs and try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="estimator" className="py-12 bg-slate-50/50">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid lg:grid-cols-1 gap-8">
            <div className="w-full">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Estimate Value</h2>
                    <p className="text-slate-600">Enter details below for an instant AI valuation.</p>
                </div>

                <Card className="shadow-lg border-slate-200 bg-white mb-8">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        <Home className="w-5 h-5 text-blue-600" />
                        Property Details
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <AddressAutocomplete
                                value={address}
                                onChange={setAddress}
                                onAddressSelect={(addr, nbh) => {
                                    setAddress(addr);
                                    // Can also store neighborhood if needed for display
                                }}
                                placeholder="Start typing address in Barcelona..."
                                className="bg-slate-50"
                            />
                        </div>

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

                        <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-12 text-lg"
                        >
                        {isLoading ? "Calculating..." : <><Calculator className="w-5 h-5 mr-2" /> Calculate Estimate</>}
                        </Button>
                    </form>
                    </CardContent>
                    {estimate && (
                        <CardFooter className="flex flex-col items-stretch border-t border-slate-100 bg-blue-50/50 p-6">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Estimated Value</p>
                                    <p className="text-4xl font-extrabold text-slate-900 mt-1">€{estimate.toLocaleString()}</p>
                                </div>
                                <EmailReport estimate={estimate} details={details} />
                            </div>
                            
                            {details && (
                                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="block text-slate-500 mb-1">Neighborhood</span>
                                            <span className="font-semibold text-slate-800">{details.inferred_neighborhood || "Unknown"}</span>
                                        </div>
                                        <div>
                                            <span className="block text-slate-500 mb-1">Price / m²</span>
                                            <span className="font-semibold text-slate-800">€{(estimate / (details.input_features?.sqm || 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardFooter>
                    )}
                </Card>

                {/* MAP SECTION (Only shows if we have coordinates) */}
                {estimate && details?.coordinates && (
                    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Property Location</h3>
                        <MapDisplay 
                            lat={details.coordinates?.lat} 
                            lon={details.coordinates?.lon} 
                            address={details.input_features?.address} 
                        />
                    </div>
                )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default EstimatorForm;
