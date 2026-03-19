import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Ingredients from "@/pages/Ingredients";
import YieldFactors from "@/pages/YieldFactors";
import Components from "@/pages/Components";
import PlateSizes from "@/pages/PlateSizes";
import Plates from "@/pages/Plates";
import ExtraCosts from "@/pages/ExtraCosts";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ingredients" element={<Ingredients />} />
              <Route path="/yield" element={<YieldFactors />} />
              <Route path="/components" element={<Components />} />
              <Route path="/plate-sizes" element={<PlateSizes />} />
              <Route path="/plates" element={<Plates />} />
              <Route path="/extra-costs" element={<ExtraCosts />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
