import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, Clock, Search, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const forumTopics = [
  {
    id: 1,
    title: "Best neighborhoods for families in Barcelona?",
    author: "Maria Garcia",
    replies: 23,
    views: 456,
    category: "Neighborhoods",
    timestamp: "2 hours ago",
    trending: true,
  },
  {
    id: 2,
    title: "Negotiating rent prices - tips and experiences",
    author: "John Smith",
    replies: 45,
    views: 892,
    category: "Renting",
    timestamp: "5 hours ago",
    trending: true,
  },
  {
    id: 3,
    title: "Understanding NIE requirements for renting",
    author: "Sophie Chen",
    replies: 31,
    views: 567,
    category: "Legal",
    timestamp: "1 day ago",
    trending: false,
  },
  {
    id: 4,
    title: "Gracia vs Eixample - where to live?",
    author: "Carlos Rodriguez",
    replies: 67,
    views: 1234,
    category: "Neighborhoods",
    timestamp: "2 days ago",
    trending: true,
  },
  {
    id: 5,
    title: "Landlord refusing to return deposit",
    author: "Anna Kowalski",
    replies: 19,
    views: 345,
    category: "Legal",
    timestamp: "3 days ago",
    trending: false,
  },
  {
    id: 6,
    title: "Pet-friendly apartments near the beach",
    author: "David Park",
    replies: 12,
    views: 234,
    category: "Renting",
    timestamp: "4 days ago",
    trending: false,
  },
];

const categories = ["All", "Neighborhoods", "Renting", "Legal", "Buying", "Expat Life"];

const Forum = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTopics = forumTopics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Community Forum</h1>
            <p className="text-lg text-muted-foreground">
              Connect with locals and expats, share experiences, and get answers to your Barcelona housing questions
            </p>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              New Discussion
            </Button>
          </div>

          {/* Categories */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
            <TabsList className="w-full justify-start overflow-x-auto">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Topics List */}
          <div className="space-y-4">
            {filteredTopics.map((topic) => (
              <Card key={topic.id} className="hover:shadow-medium transition-smooth cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {topic.category}
                        </Badge>
                        {topic.trending && (
                          <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mb-2">{topic.title}</CardTitle>
                      <CardDescription>
                        Posted by <span className="font-medium text-foreground">{topic.author}</span> • {topic.timestamp}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>{topic.replies} replies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{topic.views} views</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTopics.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No discussions found matching your criteria.</p>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Forum;
