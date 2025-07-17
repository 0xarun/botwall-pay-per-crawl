import { Button } from "@/components/ui/button";
import { ArrowRight, Code, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6">
            <Shield className="h-4 w-4 mr-2" />
            Trusted by developers worldwide
          </div>

          {/* Main headline */}
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Monetize Your Data.
            </span>
            <br />
            Let Bots Pay.
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Turn your protected content into revenue. BotWall's pay-per-crawl system 
            lets bot developers access your data while ensuring you get paid for every request.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/auth">
              <Button variant="hero" size="xl" className="group">
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="outline" size="xl">
              <Code className="h-5 w-5 mr-2" />
              View Documentation
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10k+</div>
              <div className="text-sm text-muted-foreground">Protected Sites</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50M+</div>
              <div className="text-sm text-muted-foreground">API Requests</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">$2M+</div>
              <div className="text-sm text-muted-foreground">Revenue Generated</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;