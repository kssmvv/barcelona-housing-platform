import { useState, useEffect, useRef } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { getUserId } from "@/utils/session";
import { toast } from "sonner";

interface Message {
  conversation_id: string;
  timestamp: string;
  sender_id: string;
  message: string;
  listing_address?: string;
}

interface ChatWindowProps {
  conversationId: string;
  listingAddress: string;
  otherUserId: string;
  onClose: () => void;
}

const ChatWindow = ({ conversationId, listingAddress, otherUserId, onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = getUserId();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const API_URL = "https://2rzk4kbrnzdugyjvhqgmwmy6du0zgrun.lambda-url.us-east-1.on.aws/";
      const response = await fetch(`${API_URL}?conversation_id=${encodeURIComponent(conversationId)}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for new messages every 10 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);
    const messageText = input.trim();
    setInput("");

    try {
      const API_URL = "https://rxeaxidiopnx4tw2pa7ukgxdhm0jwtuz.lambda-url.us-east-1.on.aws/";
      
      // Extract listing_id from conversation_id
      const listingIdMatch = conversationId.match(/listing_([^_]+)_/);
      const listingId = listingIdMatch ? listingIdMatch[1] : "";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUserId,
          listing_id: listingId,
          owner_id: otherUserId,
          message: messageText,
          listing_address: listingAddress,
          listing_neighborhood: ""
        })
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Immediately fetch new messages
      await fetchMessages();
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send message");
      setInput(messageText); // Restore message
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-orange-50">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="font-semibold text-slate-900">Conversation</h3>
              <p className="text-xs text-slate-600">{listingAddress}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {isLoading && messages.length === 0 ? (
              <div className="text-center text-slate-500 py-8">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isOwn = msg.sender_id === currentUserId;
                return (
                  <div key={idx} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${
                        isOwn
                          ? "bg-orange-500 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${isOwn ? "text-orange-100" : "text-slate-500"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isSending && handleSend()}
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatWindow;

