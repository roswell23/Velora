import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Boxes,
  ChartNoAxesCombined,
  CircleHelp,
  CreditCard,
  LogOut,
  PackageSearch,
  Settings2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";

const NAV_ITEMS = [
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

export default function Sidebar({ isOpen = false, onNavigate = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

      <div className="workspace-switcher">
        <span className="workspace-avatar">V</span>
        <span>
          <small>WORKSPACE</small>
          <strong>Maison Vélora</strong>
        </span>
        <ArrowUpRight size={14} />
      </div>

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
            {item.to === "/sales" && <i className="nav-indicator" />}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-section-label tools-label">TOOLS</div>
      <div className="sidebar-tool-link">
        <PackageSearch size={16} />
        <span>Product catalog</span>
        <span className="soon-tag">SOON</span>
      </div>
      {user?.role === "ADMIN" && (
        <div className="sidebar-tool-link">
          <UsersRound size={16} />
          <span>Team members</span>
          <span className="soon-tag">SOON</span>
        </div>
      )}

      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <CircleHelp size={16} />
          <span>Need a hand?</span>
          <ArrowUpRight size={13} />
        </div>
        <div className="sidebar-user">
          <span className="user-avatar">{initials}</span>
          <span className="user-copy">
            <strong>{user?.name || "Team member"}</strong>
            <small>{ROLE_LABELS[user?.role] || "Vélora team"}</small>
          </span>
          <button className="logout-button" onClick={handleLogout} aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
