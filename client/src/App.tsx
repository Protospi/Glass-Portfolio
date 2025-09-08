import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nextProvider } from "@/translations/I18nextProvider";
import { DynamicTranslationsProvider } from "@/lib/DynamicTranslations";
import IntroAnimation from "@/components/intro/intro-animation";
import LoadingScreen from "@/components/loading/loading-screen";
import Chat from "@/pages/chat";
import NotFound from "@/pages/not-found";

// Landing page component that shows the intro animation
function LandingPage() {
  return <IntroAnimation />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/loading" component={LoadingScreen} />
      <Route path="/chat" component={Chat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <I18nextProvider>
            <DynamicTranslationsProvider>
              <Toaster />
              <Router />
            </DynamicTranslationsProvider>
          </I18nextProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
