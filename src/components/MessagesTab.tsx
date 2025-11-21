import { useState, useEffect } from "react";
import { MessageCircle, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserId } from "@/utils/session";
import ChatWindow from "./ChatWindow";
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

const MessagesTab = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const currentUserId = getUserId();

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

  useEffect(() => {
    fetchConversations();
    // Poll for new conversations every 15 seconds
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return "Just now";
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">My Messages</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-12 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Messages</h1>
              <p className="text-slate-600 mt-1">Your conversations about property listings</p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {conversations.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-200">
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No messages yet</h3>
                <p className="text-slate-600">
                  Start a conversation by messaging a property owner on their listing page
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {conversations.map((conv) => (
                <Card
                  key={conv.conversation_id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-orange-500"
                  onClick={() => setSelectedConversation(conv)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <h3 className="font-semibold text-slate-900">
                            {conv.listing_address || "Property Listing"}
                          </h3>
                          {conv.unread_count > 0 && (
                            <Badge className="bg-orange-500">
                              {conv.unread_count} new
                            </Badge>
                          )}
                        </div>
                        {conv.listing_neighborhood && (
                          <p className="text-sm text-slate-600 mb-2">{conv.listing_neighborhood}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(conv.last_message_timestamp)}
                        </div>
                      </div>
                      <MessageCircle className="w-5 h-5 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Chat Window Modal */}
      {selectedConversation && (
        <ChatWindow
          conversationId={selectedConversation.conversation_id}
          listingAddress={selectedConversation.listing_address}
          otherUserId={selectedConversation.other_user_id}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </>
  );
};

export default MessagesTab;

