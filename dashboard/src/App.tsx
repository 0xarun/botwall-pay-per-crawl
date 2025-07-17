import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SiteOwnerDashboard from "./pages/SiteOwnerDashboard";
import BotDeveloperDashboard from "./pages/BotDeveloperDashboard";
import NotFound from "./pages/NotFound";
import Docs from "./pages/Docs";

const queryClient = new QueryClient();

// Simple test component
const TestComponent = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-primary mb-4">BotWall</h1>
      <p className="text-muted-foreground">Frontend is working!</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/dashboard/site-owner" 
              element={
                <ProtectedRoute allowedRoles={['site_owner']}>
                  <SiteOwnerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/bot-developer" 
              element={
                <ProtectedRoute allowedRoles={['bot_developer']}>
                  <BotDeveloperDashboard />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
