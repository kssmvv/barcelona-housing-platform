import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserId } from "@/utils/session";
import { toast } from "sonner";

interface Conversation {
  user_id: string;
  conversation_id: string;
  last_message_timestamp: string;
  other_user_id: string;
  listing_address: string;
  listing_neighborhood: string;
  unread_count: number;
}

interface Message {
  conversation_id: string;
  timestamp: string;
  sender_id: string;
  message: string;
  listing_address?: string;
}

interface MessagesAppProps {
  onBack?: () => void;
}

const MessagesApp = ({ onBack }: MessagesAppProps = {}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = getUserId();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const API_URL = "https://rciq66ft3mr6wb4o3t43jbwuwm0iqslg.lambda-url.us-east-1.on.aws/";
      const response = await fetch(`${API_URL}?user_id=${encodeURIComponent(currentUserId)}`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const API_URL = "https://2rzk4kbrnzdugyjvhqgmwmy6du0zgrun.lambda-url.us-east-1.on.aws/";
      const response = await fetch(`${API_URL}?conversation_id=${encodeURIComponent(conversationId)}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages");
    }
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim() || isSending || !selectedConversation) return;

    setIsSending(true);
    const messageText = input.trim();
    setInput("");

    try {
      const API_URL = "https://rxeaxidiopnx4tw2pa7ukgxdhm0jwtuz.lambda-url.us-east-1.on.aws/";
      
      const listingIdMatch = selectedConversation.conversation_id.match(/listing_([^_]+)_/);
      const listingId = listingIdMatch ? listingIdMatch[1] : "";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUserId,
          listing_id: listingId,
          owner_id: selectedConversation.other_user_id,
          message: messageText,
          listing_address: selectedConversation.listing_address,
          listing_neighborhood: selectedConversation.listing_neighborhood
        })
      });

      if (!response.ok) throw new Error("Failed to send message");
      await fetchMessages(selectedConversation.conversation_id);
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send message");
      setInput(messageText);
    } finally {
      setIsSending(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  // Poll for new messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversation_id);
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.conversation_id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return "now";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-600">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg" style={{ height: '600px' }}>
      {/* Left Sidebar - Conversations List */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-slate-200 bg-white`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-slate-900">Messages</h2>
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="h-8 text-slate-500">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <p className="text-sm text-slate-600">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          <p className="text-[10px] text-slate-400 mt-1">ID: {currentUserId.substring(0, 8)}...</p>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">No messages yet</h3>
              <p className="text-sm text-slate-600">
                Message a property owner to start a conversation
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.map((conv) => (
                <button
                  key={conv.conversation_id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 hover:bg-slate-50 transition-colors text-left ${
                    selectedConversation?.conversation_id === conv.conversation_id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-slate-900 truncate text-sm">
                          {conv.listing_address || "Property Listing"}
                        </h3>
                        <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                          {formatTimestamp(conv.last_message_timestamp)}
                        </span>
                      </div>
                      {conv.listing_neighborhood && (
                        <p className="text-xs text-slate-600 truncate">{conv.listing_neighborhood}</p>
                      )}
                      {conv.unread_count > 0 && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                            {conv.unread_count} new
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Side - Chat Window */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {selectedConversation.listing_address}
              </h3>
              {selectedConversation.listing_neighborhood && (
                <p className="text-sm text-slate-600">{selectedConversation.listing_neighborhood}</p>
              )}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 bg-slate-50">
            <div className="space-y-3 max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-blue-500 text-white rounded-br-sm'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                        </div>
                        <p className={`text-xs text-slate-500 mt-1 px-2 ${isOwn ? 'text-right' : 'text-left'}`}>
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
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isSending && handleSend()}
                disabled={isSending}
                className="flex-1 rounded-full"
              />
              <Button
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                className="rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600"
                size="icon"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50">
          <div className="text-center">
            <MessageCircle className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a conversation</h3>
            <p className="text-slate-600">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default MessagesApp;

