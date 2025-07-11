
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import Index from "./pages/Index";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import Clients from "./pages/Clients";
import Gastos from "./pages/Gastos";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Configuration from "./pages/Configuration";
import Inventory from "./pages/Inventory";
import InventoryDetail from "./pages/InventoryDetail";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import CreateOrder from "./pages/CreateOrder";
import EditOrder from "./pages/EditOrder";
import Users from "./pages/Users";
import LoginPage from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AuthProvider, ProtectedRoute } from "./contexts/AuthContext";
import { QueryProvider } from "./contexts/QueryProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Index />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/:id" element={<InvoiceDetail />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/gastos" element={<Gastos />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/:id" element={<InventoryDetail />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/new" element={<CreateOrder />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/orders/:id/edit" element={<EditOrder />} />
                <Route path="/users" element={<Users />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/configuration" element={<Configuration />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryProvider>
  </ThemeProvider>
);

export default App;
