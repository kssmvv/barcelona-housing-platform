import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const articles = [
  {
    id: 1,
    title: "Complete Guide to Renting in Barcelona: What You Need to Know",
    excerpt: "Everything from finding apartments to signing contracts. Learn about the rental market, typical costs, and essential documentation.",
    category: "Renting",
    readTime: "8 min read",
    featured: true,
    image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Understanding Barcelona's Neighborhoods: A Comprehensive Overview",
    excerpt: "From Gothic Quarter to Gracia, discover the unique character, amenities, and rental prices of Barcelona's diverse districts.",
    category: "Neighborhoods",
    readTime: "12 min read",
    featured: true,
    image: "https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Legal Requirements for Expats: NIE, Contracts, and More",
    excerpt: "Navigate the bureaucracy with confidence. Step-by-step guide to obtaining necessary documents and understanding your rights.",
    category: "Legal",
    readTime: "6 min read",
    featured: false,
  },
  {
    id: 4,
    title: "How to Negotiate Rent Prices in Barcelona",
    excerpt: "Expert tips on negotiation strategies, market research, and when to walk away from a deal.",
    category: "Renting",
    readTime: "5 min read",
    featured: false,
  },
  {
    id: 5,
    title: "First-Time Buyer's Guide to Barcelona Real Estate",
    excerpt: "From mortgage options to closing costs, everything you need to know about buying property in Barcelona.",
    category: "Buying",
    readTime: "10 min read",
    featured: false,
  },
  {
    id: 6,
    title: "Avoiding Common Rental Scams in Barcelona",
    excerpt: "Red flags to watch out for and how to protect yourself when searching for accommodation.",
    category: "Safety",
    readTime: "7 min read",
    featured: false,
  },
  {
    id: 7,
    title: "Understanding Your Tenant Rights in Spain",
    excerpt: "Know your rights regarding deposits, repairs, rent increases, and eviction protections.",
    category: "Legal",
    readTime: "9 min read",
    featured: false,
  },
  {
    id: 8,
    title: "Best Time to Look for Apartments in Barcelona",
    excerpt: "Seasonal trends, market dynamics, and strategies for finding the best deals throughout the year.",
    category: "Tips",
    readTime: "4 min read",
    featured: false,
  },
];

const Advice = () => {
  const featuredArticles = articles.filter(article => article.featured);
  const regularArticles = articles.filter(article => !article.featured);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Expert Advice</h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Comprehensive guides, tips, and expert articles to help you navigate the Barcelona property market with confidence
            </p>
          </div>

          {/* Featured Articles */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Featured Articles</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredArticles.map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-medium transition-smooth group cursor-pointer">
                  {article.image && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={article.image} 
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                        {article.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readTime}
                      </span>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-smooth">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {article.excerpt}
                    </CardDescription>
                    <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary hover:bg-transparent group/btn">
                      Read Article
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-smooth" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* All Articles */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">All Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularArticles.map((article) => (
                <Card key={article.id} className="hover:shadow-medium transition-smooth group cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readTime}
                      </span>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-smooth">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4 text-sm">
                      {article.excerpt}
                    </CardDescription>
                    <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary hover:bg-transparent group/btn">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-smooth" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Advice;
