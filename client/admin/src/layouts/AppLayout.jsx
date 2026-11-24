import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Bell, Menu, Search, Sparkles, X } from "lucide-react";
import Sidebar from "./Sidebar.jsx";

const pageNames = {
  sales: "Sales",
  inventory: "Inventory",
  finance: "Finance",
  admin: "Administration",
};

export default function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageName = pageNames[location.pathname.split("/")[1]] || "Workspace";
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
  })
    .format(new Date())
    .toUpperCase();

  return (
    <div className="admin-shell">
      {sidebarOpen && (
        <button
          className="sidebar-scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="topbar-menu"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
          >
            {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <div className="breadcrumb">
            <Sparkles size={14} />
            <span>Workspace</span>
            <i>/</i>
            <strong>{pageName}</strong>
          </div>
          <div className="topbar-actions">
            <label className="workspace-search">
              <Search size={15} />
              <input placeholder="Search workspace" aria-label="Search workspace" />
              <kbd>⌘ K</kbd>
            </label>
            <button className="topbar-icon" aria-label="Notifications">
              <Bell size={17} />
              <i />
            </button>
            <span className="topbar-divider" />
            <span className="topbar-date">{dateLabel}</span>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
