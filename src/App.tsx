import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Returns from "@/pages/Returns";
import ReturnDetail from "@/pages/Returns/Detail";
import Approvals from "@/pages/Approvals";
import Logistics from "@/pages/Logistics";
import Warehouse from "@/pages/Warehouse";
import Refunds from "@/pages/Refunds";
import Tickets from "@/pages/Tickets";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Logs from "@/pages/Logs";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="returns" element={<Returns />} />
          <Route path="returns/:id" element={<ReturnDetail />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="logistics" element={<Logistics />} />
          <Route path="warehouse" element={<Warehouse />} />
          <Route path="refunds" element={<Refunds />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="logs" element={<Logs />} />
        </Route>
      </Routes>
    </Router>
  );
}
