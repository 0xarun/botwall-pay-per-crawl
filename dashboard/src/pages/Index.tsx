import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { CreditCard, Coins, Zap, Crown, Server } from "lucide-react";

const Section = ({ id, children, className = "" }) => (
  <motion.section
    id={id}
    className={`my-24 scroll-mt-32 ${className}`}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.7, ease: "easeOut" }}
  >
    {children}
  </motion.section>
);

const GlassCard = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-border bg-background/60 shadow-xl backdrop-blur-lg supports-[backdrop-filter]:bg-background/40 p-8 ${className}`}
    style={{ boxShadow: "0 8px 32px 0 rgba(31,38,135,0.10)" }}>
    {children}
  </div>
);

const PaymentsCredits = () => (
  <Section id="payments-credits">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-center">
        <span className="bg-gradient-primary bg-clip-text text-transparent">Payments & Credits</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <Coins className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold">Credit Packs</span>
          </div>
          <p className="mb-2 text-muted-foreground">Bots need credits to crawl. Buy packs (Starter, Pro, Enterprise) and pay per request.</p>
          <div className="flex gap-3 mt-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"><Zap className="h-4 w-4" /> Starter</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium"><Crown className="h-4 w-4" /> Pro</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium"><CreditCard className="h-4 w-4" /> Enterprise</span>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <Server className="h-7 w-7 text-accent" />
            <span className="text-xl font-semibold">Mock/Test Credits & Simulated Checkout</span>
          </div>
          <p className="mb-2 text-muted-foreground">For open source/dev, instantly add credits or simulate payments. No real money needed.</p>
          <ul className="list-disc pl-6 text-muted-foreground text-sm mb-2">
            <li>POST <span className="font-mono">/api/bots/:id/mock-add-credits</span> (dev only)</li>
            <li>Simulate checkout & payment for local testing</li>
          </ul>
          <span className="inline-block bg-muted px-3 py-1 rounded text-xs">NODE_ENV=development only</span>
        </GlassCard>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-7 w-7 text-success" />
            <span className="text-xl font-semibold">LemonSqueezy Integration</span>
          </div>
          <p className="mb-2 text-muted-foreground">Enable real payments by configuring LemonSqueezy API keys. Webhooks credit bots after payment.</p>
          <ul className="list-disc pl-6 text-muted-foreground text-sm mb-2">
            <li>Real checkout & webhook flow</li>
            <li>Site owners earn based on price per crawl</li>
          </ul>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <Coins className="h-7 w-7 text-warning" />
            <span className="text-xl font-semibold">Site Owner Earnings</span>
          </div>
          <p className="mb-2 text-muted-foreground">Earnings tracked in backend, viewable via analytics. Earn for every successful crawl on your site.</p>
        </GlassCard>
      </div>
    </div>
  </Section>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <Features />
      <HowItWorks />
      <PaymentsCredits />
      <Footer />
    </div>
  );
};

export default Index;
