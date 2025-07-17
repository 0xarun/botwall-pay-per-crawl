import { Button } from "@/components/ui/button";
import { Code, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Navigation = () => {
  const { user, profile, signOut, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed left-0 right-0 top-6 z-50 mx-auto max-w-4xl rounded-2xl border border-border bg-background/70 shadow-xl backdrop-blur-lg supports-[backdrop-filter]:bg-background/40 px-4 py-3 flex items-center justify-between"
        style={{
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
        }}
      >
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            BotWall
          </span>
        </div>
        <div className="animate-pulse bg-muted h-8 w-32 rounded"></div>
      </motion.nav>
    );
  }

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed left-0 right-0 top-6 z-50 mx-auto max-w-4xl rounded-2xl border border-border bg-background/70 shadow-xl backdrop-blur-lg supports-[backdrop-filter]:bg-background/40 px-4 py-3"
      style={{
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
      }}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            BotWall
          </span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-foreground hover:text-primary transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-foreground hover:text-primary transition-colors">
            How It Works
          </a>
          <a href="/docs" className="text-foreground hover:text-primary transition-colors">
            Docs
          </a>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center space-x-2">
          {user && profile ? (
            <>
              <Link
                to={profile.role === "site_owner" ? "/dashboard/site-owner" : "/dashboard/bot-developer"}
              >
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;