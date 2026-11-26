import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Boxes,
  ChartNoAxesCombined,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    short: "Dashboard",
    icon: LayoutDashboard,
    to: "/dashboard",
    roles: ["ADMIN", "SALES", "INVENTORY", "FINANCE"],
  },
  {
    label: "Sales overview",
    short: "Sales",
    icon: ChartNoAxesCombined,
    to: "/sales",
    roles: ["SALES", "ADMIN"],
  },
  {
    label: "Inventory",
    short: "Inventory",
    icon: Boxes,
    to: "/inventory",
    roles: ["INVENTORY", "ADMIN"],
  },
  {
    label: "Finance",
    short: "Finance",
    icon: CreditCard,
    to: "/finance",
    roles: ["FINANCE", "ADMIN"],
  },
  {
    label: "Administration",
    short: "Administration",
    icon: Settings2,
    to: "/admin",
    roles: ["ADMIN"],
  },
];

const ROLE_LABELS = {
  ADMIN: "Administrator",
  SALES: "Sales team",
  INVENTORY: "Inventory team",
  FINANCE: "Finance team",
};

const STOREFRONT_URL = import.meta.env.VITE_CUSTOMER_ORIGIN || "http://localhost:5173";

export default function Sidebar({ isOpen = false, onNavigate = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));
  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("") || "VL";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <aside className={`admin-sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <a
          href="/"
          className="admin-brand"
          onClick={(event) => {
            event.preventDefault();
            navigate("/");
            onNavigate();
          }}
        >
          <span className="brand-symbol">
            <Sparkles size={17} strokeWidth={1.4} />
          </span>
          <span>
            <strong>VÉLORA</strong>
            <small>OPERATIONS</small>
          </span>
        </a>

        <a
          className="workspace-switcher"
          href={STOREFRONT_URL}
          target="_blank"
          rel="noreferrer"
          title="Open customer storefront in a new tab"
        >
          <span className="workspace-avatar">V</span>
          <span>
            <small>WORKSPACE</small>
            <strong>Maison Vélora</strong>
          </span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Department navigation">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <item.icon size={17} strokeWidth={1.7} />
              <span>{item.short}</span>
              <i className="nav-indicator" aria-hidden="true" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-help"
            onClick={() => setHelpOpen(true)}
          >
            <CircleHelp size={16} aria-hidden="true" />
            <span>Need a hand?</span>
            <ArrowUpRight size={13} aria-hidden="true" />
          </button>
          <div className="sidebar-user">
            <span className="user-avatar">{initials}</span>
            <span className="user-copy">
              <strong>{user?.name || "Team member"}</strong>
              <small>{ROLE_LABELS[user?.role] || "Vélora team"}</small>
            </span>
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {helpOpen && (
        <div
          className="erp-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setHelpOpen(false);
          }}
        >
          <div
            className="erp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="erp-help-title"
          >
            <div className="erp-modal-header">
              <div>
                <p className="panel-kicker">OPERATIONS GUIDE</p>
                <h2 id="erp-help-title">Workspace shortcuts & access</h2>
              </div>
              <button
                type="button"
                className="quiet-button"
                onClick={() => setHelpOpen(false)}
                aria-label="Close help"
              >
                <X size={18} />
              </button>
            </div>
            <div className="erp-help-body">
              <div className="erp-help-item">
                <strong>Quick workspace jump</strong>
                <p>
                  Press <kbd>⌘ K</kbd> or <kbd>Ctrl K</kbd> from any page to search departments and
                  jump directly.
                </p>
              </div>
              <div className="erp-help-item">
                <strong>Connected live modules</strong>
                <p>
                  Administration (<code>/api/users</code>) and the shared Product Catalog (
                  <code>/api/products</code>) read and write directly to the PostgreSQL database.
                </p>
              </div>
              <div className="erp-help-item">
                <strong>Your signed-in role</strong>
                <p>
                  {user?.name} · {ROLE_LABELS[user?.role] || user?.role} ({user?.email})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
