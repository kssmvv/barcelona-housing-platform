import { MessageSquare, BookOpen, HelpCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const sections = [
  {
    id: "forum",
    icon: MessageSquare,
    title: "Community Forum",
    description: "Join discussions about Barcelona living, share experiences, and get answers from locals and expats.",
    badge: "500+ Active Members",
    color: "bg-primary/10 text-primary"
  },
  {
    id: "advice",
    icon: BookOpen,
    title: "Expert Advice",
    description: "Access guides, tips, and expert articles about renting, buying, and living in Barcelona.",
    badge: "50+ Articles",
    color: "bg-accent/10 text-accent"
  },
  {
    id: "help",
    icon: HelpCircle,
    title: "Get Help",
    description: "Need personalized assistance? Our support team is here to help with your property questions.",
    badge: "24/7 Support",
    color: "bg-primary/10 text-primary"
  }
];

const CommunitySections = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            More Than Just Valuations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access our full suite of resources to make your Barcelona property journey seamless
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {sections.map((section) => (
            <Card 
              key={section.id}
              id={section.id}
              className="border-border/50 shadow-soft hover:shadow-medium transition-smooth group"
            >
              <CardHeader>
                <div className={`w-14 h-14 rounded-xl ${section.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
                  <section.icon className="w-7 h-7" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">{section.title}</CardTitle>
                  <span className={`text-xs px-3 py-1 rounded-full ${section.color} font-medium`}>
                    {section.badge}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-muted-foreground text-base">
                  {section.description}
                </CardDescription>
                <Button 
                  variant="ghost" 
                  className="group/btn text-primary hover:text-primary hover:bg-primary/10 p-0 h-auto"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-smooth" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunitySections;
