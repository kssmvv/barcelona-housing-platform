import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import ChatMessage from "./ChatMessage";

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
    return "Hi! Ask me about Barcelona neighborhoods, prices, safety, or how to use our platform.";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <Card ref={containerRef} className="w-[360px] h-[480px] shadow-2xl border border-orange-200 flex flex-col mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-orange-50">
            <div>
              <p className="text-sm font-semibold text-orange-700">
                {mode === "listing" ? "Property AI Assistant" : "AI Real Estate Advisor"}
              </p>
              <p className="text-xs text-orange-600">
                {mode === "listing" ? "Ask about this listing" : "Ask about Barcelona market"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">{getInitialMessage()}</p>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-xl text-sm leading-relaxed ${msg.role === "user" ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-900"}`}>
                  <ChatMessage content={msg.content} role={msg.role} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-orange-100 text-orange-900 px-3 py-2 rounded-xl text-sm italic">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-3 flex gap-2">
            <Input
              placeholder={getPlaceholderText()}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && ask()}
              disabled={isLoading}
            />
            <Button size="icon" onClick={ask} disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
      <Button 
        size="lg" 
        className="rounded-full h-14 w-14 shadow-lg bg-orange-500 hover:bg-orange-600" 
        onClick={() => setOpen(!open)}
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </Button>
    </div>
  );
};

export default FloatingAdvisor;
