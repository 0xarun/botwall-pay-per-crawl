import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Shield, TrendingUp, Zap, Lock, BarChart3 } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Code,
      title: "Easy SDK Integration",
      description: "Simple middleware setup for site owners and bot developers. Get protected in minutes, not hours.",
      color: "text-primary"
    },
    {
      icon: Shield,
      title: "Bot Protection",
      description: "Automatically block unauthorized crawlers while allowing paid access. Control who accesses your data.",
      color: "text-accent-bright"
    },
    {
      icon: TrendingUp,
      title: "Revenue Monetization",
      description: "Transform your content into a revenue stream. Set your price and earn from every crawl request.",
      color: "text-success"
    },
    {
      icon: Zap,
      title: "Real-time Validation",
      description: "Instant credit verification and deduction with sub-second response times for seamless integration.",
      color: "text-warning"
    },
    {
      icon: Lock,
      title: "Secure by Design",
      description: "Enterprise-grade security with encrypted API keys and secure token validation for all requests.",
      color: "text-primary"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive insights into crawl patterns, earnings, and bot behavior with detailed reporting.",
      color: "text-accent-bright"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Everything you need to 
            <span className="bg-gradient-primary bg-clip-text text-transparent"> monetize your data</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features that make data monetization simple for site owners and accessible for bot developers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 border-border/50">
              <CardHeader>
                <div className={`h-12 w-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
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