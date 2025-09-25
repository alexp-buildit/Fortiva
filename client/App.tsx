import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppPlaceholder from "./pages/AppPlaceholder";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/layout/Layout";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import WireInstructions from "./pages/WireInstructions";
import Transactions from "./pages/Transactions";
import TransactionDetail from "./pages/TransactionDetail";
import TransactionEdit from "./pages/TransactionEdit";
import DemoRequest from "./pages/DemoRequest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/wire-instructions" element={<WireInstructions />} />
              <Route path="/wire-instructions/:transactionId" element={<WireInstructions />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/transactions/:id" element={<TransactionDetail />} />
              <Route path="/transactions/:id/edit" element={<TransactionEdit />} />
              <Route path="/demo" element={<DemoRequest />} />
              <Route path="/app" element={<AppPlaceholder />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

const _container = document.getElementById("root")!;
if (!(window as any).__FORTIVA_ROOT) {
  (window as any).__FORTIVA_ROOT = createRoot(_container);
}
(window as any).__FORTIVA_ROOT.render(<App />);
