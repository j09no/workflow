import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { DigitalClock } from "@/components/digital-clock";
import { SettingsOverlay } from "@/components/settings-overlay";
import { BottomNavigation } from "@/components/bottom-navigation";
import Dashboard from "@/pages/dashboard";
import Chapters from "@/pages/chapters";
import Quiz from "./pages/quiz";
import Analytics from "./pages/analytics";
import Storage from "./pages/storage";
import Chat from "./pages/chat";
import Calendar from "./pages/calendar";
import ChapterDetails from "./pages/chapter-details";
import NotFound from "./pages/not-found";
import { BrainCircuit, Sparkles } from "lucide-react";

function Router() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [location] = useLocation();

  // Check if current page is dashboard/home
  const isHomePage = location === "/" || location === "/dashboard";

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden custom-scrollbar">
      {/* Enhanced Header with iOS-style glass morphism */}
      {isHomePage && (
        <header className="fixed top-0 left-0 right-0 z-50 slide-up">
          <div className="mx-4 mt-4">
            <div className="glass-card smooth-transition">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl glass-card-subtle flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20"></div>
                    <BrainCircuit className="w-7 h-7 text-white relative z-10" />
                    <Sparkles className="w-3 h-3 text-blue-400 absolute top-1 right-1 opacity-60" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold gradient-text tracking-tight">NEET Prep Pro</h1>
                    <p className="text-xs text-gray-400 font-medium">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <DigitalClock />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Enhanced main content area */}
      <main className={`pb-32 px-4 smooth-transition ${isHomePage ? 'pt-32' : 'pt-6'}`}>
        <div className="max-w-md mx-auto">
          <Switch>
            <Route path="/" component={() => <Dashboard />} />
            <Route path="/dashboard" component={() => <Dashboard />} />
            <Route path="/chapters" component={() => <Chapters />} />
            <Route path="/chapter/:id">
              {params => <ChapterDetails chapterId={params.id} />}
            </Route>
            <Route path="/quiz" component={Quiz} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/storage" component={Storage} />
            <Route path="/chat" component={Chat} />
            <Route path="/calendar" component={Calendar} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>

      <BottomNavigation />
      <SettingsOverlay />
    </div>
  );
}

function App() {
  useEffect(() => {
    // Set dark mode by default
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;