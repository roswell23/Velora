import React, { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Bell, Menu, Package, Search, Sparkles, X } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { api } from "../services/apiClient.js";

const pageNames = {
  dashboard: "Dashboard",
  sales: "Sales",
  inventory: "Inventory",
  finance: "Finance",
  admin: "Administration",
  catalog: "Product Catalog",
};

const QUICK_DESTINATIONS = [
  {
    label: "Operations Dashboard",
    meta: "Momentum, catalog health & focus",
    to: "/dashboard",
    roles: ["ADMIN", "SALES", "INVENTORY", "FINANCE"],
  },
  {
    label: "Sales overview",
    meta: "Orders & customer records",
    to: "/sales",
    roles: ["SALES", "ADMIN"],
  },
  {
    label: "Inventory & stock watch",
    meta: "Live product catalog & reorder levels",
    to: "/inventory",
    roles: ["INVENTORY", "ADMIN"],
  },
  {
    label: "Finance & reconciliation",
    meta: "Payments & procurement costs",
    to: "/finance",
    roles: ["FINANCE", "ADMIN"],
  },
  {
    label: "Team & administration",
    meta: "Staff accounts & role permissions",
    to: "/admin",
    roles: ["ADMIN"],
  },
  {
    label: "Shared product catalog",
    meta: "Browse active fragrances & pricing",
    to: "/catalog",
    roles: ["SALES", "FINANCE"],
  },
];

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const searchInputRef = useRef(null);
  const searchWrapRef = useRef(null);
  const notifWrapRef = useRef(null);

  const pageName = pageNames[location.pathname.split("/")[1]] || "Workspace";
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
  })
    .format(new Date())
    .toUpperCase();

  useEffect(() => {
    let ignore = false;
    api
      .get("/products?limit=100")
      .then((res) => {
        if (ignore || !Array.isArray(res.data)) return;
        setLowStockProducts(res.data.filter((item) => item.stock <= item.reorderLevel));
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      } else if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    }

    function handleClickOutside(event) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (notifWrapRef.current && !notifWrapRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredDestinations = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return QUICK_DESTINATIONS.filter((item) => {
      if (!item.roles.includes(user?.role)) return false;
      if (!term) return true;
      return `${item.label} ${item.meta}`.toLowerCase().includes(term);
    });
  }, [searchQuery, user?.role]);

  function handleSelectDestination(to) {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(to);
  }

  return (
    <div className="admin-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="topbar-menu"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
          >
            {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <div className="breadcrumb">
            <Sparkles size={14} aria-hidden="true" />
            <span>Workspace</span>
            <i>/</i>
            <strong>{pageName}</strong>
          </div>
          <div className="topbar-actions">
            <div className="workspace-search-wrap" ref={searchWrapRef}>
              <label className="workspace-search">
                <Search size={15} aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && filteredDestinations.length > 0) {
                      event.preventDefault();
                      handleSelectDestination(filteredDestinations[0].to);
                    }
                  }}
                  placeholder="Search workspace"
                  aria-label="Search workspace"
                  aria-expanded={searchOpen}
                />
                <kbd>⌘ K</kbd>
              </label>

              {searchOpen && (
                <div className="topbar-popover search-popover" role="listbox" aria-label="Quick navigation">
                  <p className="popover-kicker">QUICK JUMP</p>
                  {filteredDestinations.length ? (
                    filteredDestinations.map((item) => (
                      <button
                        key={item.to}
                        type="button"
                        className="popover-item"
                        onClick={() => handleSelectDestination(item.to)}
                      >
                        <div>
                          <strong>{item.label}</strong>
                          <span>{item.meta}</span>
                        </div>
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    ))
                  ) : (
                    <p className="popover-empty">No matching workspace pages.</p>
                  )}
                </div>
              )}
            </div>

            <div className="topbar-notif-wrap" ref={notifWrapRef}>
              <button
                type="button"
                className="topbar-icon"
                aria-label={`Notifications, ${lowStockProducts.length} stock alerts`}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={17} />
                {lowStockProducts.length > 0 && <i aria-hidden="true" />}
              </button>

              {notificationsOpen && (
                <div className="topbar-popover notif-popover" role="region" aria-label="Workspace notifications">
                  <div className="popover-header">
                    <p className="popover-kicker">WORKSPACE ALERTS</p>
                    <span>{lowStockProducts.length} items</span>
                  </div>
                  {lowStockProducts.length > 0 ? (
                    <>
                      <div className="notif-list">
                        {lowStockProducts.slice(0, 4).map((item) => (
                          <div className="notif-item" key={item.id}>
                            <Package size={14} aria-hidden="true" />
                            <div>
                              <strong>{item.name}</strong>
                              <span>
                                {item.stock === 0
                                  ? "Out of stock"
                                  : `Low stock · ${item.stock} left (reorder at ${item.reorderLevel})`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="popover-footer-cta"
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate(
                            ["INVENTORY", "ADMIN"].includes(user?.role) ? "/inventory" : "/catalog"
                          );
                        }}
                      >
                        <span>Review product stock</span>
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <p className="popover-empty">All products are currently above reorder levels.</p>
                  )}
                </div>
              )}
            </div>

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
