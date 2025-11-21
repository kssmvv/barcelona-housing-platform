import { Shield, TrendingUp, Users, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Accurate Valuations",
    description: "Data-driven estimates based on real Barcelona market trends and historical sales data.",
    color: "text-primary"
  },
  {
    icon: TrendingUp,
    title: "Market Insights",
    description: "Stay informed with up-to-date analysis of Barcelona's dynamic property market.",
    color: "text-accent"
  },
  {
    icon: Users,
    title: "Community Forum",
    description: "Connect with other Barcelona residents, share experiences, and get advice.",
    color: "text-primary"
  },
  {
    icon: Clock,
    title: "Instant Results",
    description: "Get your property evaluation in seconds, no waiting or complicated processes.",
    color: "text-accent"
  }
];

const Features = () => {
  return (
    <section className="py-20 bg-subtle-gradient">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Why Choose Barcelona Home?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We provide comprehensive tools and community support for all your Barcelona property needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="border-border/50 shadow-soft hover:shadow-medium transition-smooth hover:-translate-y-1"
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
