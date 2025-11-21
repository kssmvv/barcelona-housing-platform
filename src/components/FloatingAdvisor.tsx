import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import ChatMessage from "./ChatMessage";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FloatingAdvisorProps {
  context?: any;
  mode?: "general" | "listing";
  listingData?: any;
}

const FloatingAdvisor = ({ context, mode = "general", listingData }: FloatingAdvisorProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (open && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const ask = async () => {
    if (!input.trim()) return;
    const question = input.trim();
    const userMsg = { role: "user" as const, content: question };
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
        question,
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
      const assistantMsg = { role: "assistant" as const, content: data.answer || "I couldn't get an answer." };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholderText = () => {
    if (mode === "listing") {
      return "Ask about this property...";
    }
    return "Ask about Barcelona real estate...";
  };

  const getInitialMessage = () => {
    if (mode === "listing" && listingData) {
      return `Ask me about this property in ${listingData.neighborhood || "Barcelona"}! I can explain the AI valuation, neighborhood insights, investment potential, and more.`;
    }
    return "Hi! I'm your Barcelona AI Advisor. Ask me about neighborhoods, prices, safety, or how to use the platform.";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {open && (
        <Card 
            ref={containerRef} 
            className="w-[380px] h-[550px] shadow-2xl border-0 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300 rounded-2xl ring-1 ring-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  {mode === "listing" ? "Property Assistant" : "AI Real Estate Advisor"}
                </p>
                <p className="text-[10px] text-blue-100 font-medium opacity-90 uppercase tracking-wider">
                  Powered by OpenAI
                </p>
              </div>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setOpen(false)}
                className="text-white hover:bg-white/20 hover:text-white rounded-full h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 opacity-70">
                 <div className="bg-blue-100 p-4 rounded-full mb-4">
                    <Bot className="w-8 h-8 text-blue-600" />
                 </div>
                 <p className="text-sm text-slate-600 max-w-[240px] leading-relaxed">
                    {getInitialMessage()}
                 </p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div 
                    className={cn(
                        "max-w-[85%] px-4 py-3 text-sm shadow-sm",
                        msg.role === "user" 
                            ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm" 
                            : "bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-sm"
                    )}
                >
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

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex gap-2 relative">
              <Input
                placeholder={getPlaceholderText()}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && ask()}
                disabled={isLoading}
                className="pr-12 py-6 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
              />
              <Button 
                size="icon" 
                onClick={ask} 
                disabled={isLoading || !input.trim()}
                className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      <Button 
        size="lg" 
        className={cn(
            "rounded-full h-14 w-14 shadow-xl transition-all duration-300 hover:scale-105",
            open ? "bg-slate-800 hover:bg-slate-900 rotate-90" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
        )}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </Button>
    </div>
  );
};

export default FloatingAdvisor;
