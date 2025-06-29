import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navigation from "../components/Navigation.jsx";
import Header from "../components/Header.jsx";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Navigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 