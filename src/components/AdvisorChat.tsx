import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChatMessage from "./ChatMessage";
import { cn } from "@/lib/utils";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface AdvisorChatProps {
    context: any; // Property details
    mode?: "general" | "listing";
    listingData?: any;
}

const AdvisorChat = ({ context, mode = "general", listingData }: AdvisorChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // Build conversation history for API (last 10 messages = 5 exchanges)
            const history = messages.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const payload: any = {
                question: input,
                history,
                mode,
            };

            // If in listing mode, pass listing data
            if (mode === "listing" && listingData) {
                payload.listing_data = listingData;
            }

            const response = await fetch("https://jqcs7rfwkbj3nl5y7izyrybxim0blcds.lambda-url.us-east-1.on.aws/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            const aiMsg = { role: 'assistant' as const, content: data.answer || "I couldn't get an answer." };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        if (mode === "listing") {
            return "Property AI Assistant";
        }
        return "AI Real Estate Advisor";
    };

    const getPlaceholder = () => {
        if (mode === "listing") {
            return "Ask about this property...";
        }
        return "Ask about Barcelona market...";
    };

    return (
        <Card className="h-[500px] flex flex-col mt-8 shadow-lg border-slate-100 overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    {getTitle()}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 p-4 pt-4 overflow-hidden bg-slate-50/50">
                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground text-sm py-12 flex flex-col items-center gap-3 opacity-70">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <Sparkles className="w-6 h-6 text-blue-600" />
                                </div>
                                {mode === "listing" 
                                    ? "Ask me anything about this property or the neighborhood!" 
                                    : "Ask me anything about Barcelona real estate!"}
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                                    msg.role === 'user' 
                                        ? "bg-blue-600 text-white rounded-tr-sm" 
                                        : "bg-white text-slate-800 border border-slate-100 rounded-tl-sm"
                                )}>
                                    <ChatMessage content={msg.content} role={msg.role} />
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm text-sm flex items-center gap-2 shadow-sm">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
                <div className="flex gap-2 pt-2">
                    <Input 
                        placeholder={getPlaceholder()}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                        disabled={isLoading}
                        className="bg-white border-slate-200 focus-visible:ring-blue-500"
                    />
                    <Button 
                        size="icon" 
                        onClick={handleSend} 
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default AdvisorChat;
