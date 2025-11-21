import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const HistoryList = () => {
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("https://rzkqhvnq64ral5k7o2pzjzt6qu0koibd.lambda-url.us-east-1.on.aws/");
                const data = await res.json();
                if (Array.isArray(data)) {
                    setHistory(data);
                }
            } catch (e) {
                console.error("Failed to load history", e);
            }
        };
        fetchHistory();
    }, []);

    if (history.length === 0) return null;

    return (
        <Card className="shadow-lg border-slate-200 bg-white h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Recent Estimates
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                        {history.map((item) => (
                            <div key={item.estimate_id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                                <div>
                                    <p className="font-semibold text-slate-700 text-sm">{item.neighborhood || "Unknown Location"}</p>
                                    <p className="text-slate-400 text-xs mt-0.5">{new Date(item.timestamp).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-blue-600 text-sm">
                                        €{item.estimated_price.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {item.input_features?.bedrooms} bds • {item.input_features?.sqm} m²
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default HistoryList;
