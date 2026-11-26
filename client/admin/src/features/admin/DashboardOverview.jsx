import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  ChartNoAxesCombined,
  Check,
  CreditCard,
  Package,
  RefreshCw,
  Settings2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { api } from "../../services/apiClient.js";

const RANGE_DATA = {
  "7d": {
    label: "Last 7 days",
    bars: [52, 68, 61, 79, 74, 88, 92],
    axis: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
  },
  "30d": {
    label: "Last 30 days",
    bars: [
      42, 58, 46, 74, 62, 88, 54, 68, 51, 80, 61, 92, 55, 71, 48, 65, 84, 57, 75, 96, 62, 78, 53,
      69,
    ],
    axis: ["01 NOV", "08 NOV", "15 NOV", "22 NOV", "30 NOV"],
  },
  "90d": {
    label: "Last 90 days",
    bars: [36, 48, 55, 62, 58, 70, 66, 78, 74, 86, 82, 94],
    axis: ["SEP", "OCT", "NOV", "TODAY"],
  },
};

const WORKSPACES = [
  {
    key: "sales",
    title: "Sales",
    description: "Customer records & online/in-store orders",
    to: "/sales",
    icon: ChartNoAxesCombined,
    roles: ["SALES", "ADMIN"],
  },
  {
    key: "inventory",
    title: "Inventory",
    description: "Live stock levels, SKUs & reorder watch",
    to: "/inventory",
    icon: Boxes,
    roles: ["INVENTORY", "ADMIN"],
  },
  {
    key: "finance",
    title: "Finance",
    description: "Payment reconciliation & procurement cost",
    to: "/finance",
    icon: CreditCard,
    roles: ["FINANCE", "ADMIN"],
  },
  {
    key: "admin",
    title: "Administration",
    description: "Staff accounts, roles & access status",
    to: "/admin",
    icon: Settings2,
    roles: ["ADMIN"],
  },
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [range, setRange] = useState("30d");
  const [products, setProducts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const requests = [api.get("/products?limit=100")];
      if (user?.role === "ADMIN") {
        requests.push(api.get("/users?limit=100"));
      }
      const [productsRes, usersRes] = await Promise.all(requests);
      if (Array.isArray(productsRes?.data)) setProducts(productsRes.data);
      if (Array.isArray(usersRes?.data)) setStaffList(usersRes.data);
    } catch (err) {
      setError(err.message || "Could not load dashboard summary.");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const lowStockCount = useMemo(
    () => products.filter((item) => item.stock <= item.reorderLevel).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((item) => item.stock === 0).length,
    [products]
  );
  const totalUnits = useMemo(
    () => products.reduce((sum, item) => sum + (item.stock || 0), 0),
    [products]
  );
  const activeStaffCount = useMemo(
    () => staffList.filter((member) => member.isActive).length,
    [staffList]
  );

  const progressRatio = products.length
    ? Math.round(((products.length - lowStockCount) / products.length) * 100)
    : 100;
  const activeChart = RANGE_DATA[range] || RANGE_DATA["30d"];
  const visibleWorkspaces = WORKSPACES.filter((ws) => ws.roles.includes(user?.role));

  const metrics = [
    {
      label: "Active fragrances",
      value: loading && products.length === 0 ? "…" : String(products.length),
      change: "In the shared catalog",
      icon: Package,
    },
    {
      label: "Low stock alerts",
      value: loading && products.length === 0 ? "…" : String(lowStockCount),
      change: `${outOfStockCount} out of stock`,
      icon: AlertTriangle,
    },
    {
      label: "Units on hand",
      value: loading && products.length === 0 ? "…" : String(totalUnits),
      change: "Across warehouse SKUs",
      icon: Boxes,
    },
    user?.role === "ADMIN"
      ? {
          label: "Staff accounts",
          value: loading && staffList.length === 0 ? "…" : String(staffList.length),
          change: `${activeStaffCount} active members`,
          icon: UsersRound,
        }
      : {
          label: "Catalog health",
          value: `${progressRatio}%`,
          change: "Above reorder threshold",
          icon: Sparkles,
        },
  ];

  const primaryActionPath =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "INVENTORY"
        ? "/inventory"
        : user?.role === "FINANCE"
          ? "/finance"
          : "/sales";

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">OPERATIONS DASHBOARD</p>
          <h1>Maison Vélora, at a glance.</h1>
          <p>
            Welcome back, {user?.name?.split(" ")[0] || "Team"}. Monitor catalog health,
            department focus, and jump into your active workspace.
          </p>
        </div>
        <div className="heading-actions">
          <span className="preview-badge is-live">
            <i /> LIVE OVERVIEW
          </span>
          <button
            className="outline-button"
            type="button"
            onClick={loadSummary}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin-icon" : ""} aria-hidden="true" />
            <span>Refresh</span>
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => navigate(primaryActionPath)}
          >
            <span>Open my workspace</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <div className="inline-notice is-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      <div className="metric-grid">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <article className="metric-card" key={metric.label} style={{ "--card-index": index }}>
              <div className="metric-top">
                <span>{metric.label}</span>
                <span className="metric-icon">
                  <Icon size={16} strokeWidth={1.7} />
                </span>
              </div>
              <strong>{metric.value}</strong>
              <p>{metric.change}</p>
            </article>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">ACTIVITY SNAPSHOT</p>
              <h2>Momentum, over time</h2>
            </div>
            <select
              className="select-control"
              aria-label="Select chart timeframe"
              value={range}
              onChange={(event) => setRange(event.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <div className="chart-summary">
            <strong>{activeChart.label}</strong>
            <span>Catalog & team overview ({products.length} active SKUs)</span>
          </div>
          <div className="chart-area" aria-label="Activity snapshot bars">
            <div className="chart-guides">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="chart-bars" aria-hidden="true">
              {activeChart.bars.map((height, index) => (
                <span
                  key={`${range}-${index}`}
                  style={{ "--bar-height": `${height}%`, "--bar-index": index }}
                />
              ))}
            </div>
          </div>
          <div className="chart-axis">
            {activeChart.axis.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
          <p className="preview-caption">
            Activity cadence preview · Historical time-series metrics connect with Orders & Payments
          </p>
        </section>

        <section className="panel focus-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">YOUR FOCUS</p>
              <h2>Good work, in view.</h2>
            </div>
          </div>
          <div className="focus-progress">
            <div className="progress-ring">
              <span>{progressRatio}%</span>
            </div>
            <div>
              <strong>Catalog health</strong>
              <p>
                {products.length - lowStockCount} of {products.length} fragrances above reorder
                threshold.
              </p>
            </div>
          </div>
          <div className="focus-divider" />
          <button
            type="button"
            className="focus-row"
            onClick={() =>
              navigate(["INVENTORY", "ADMIN"].includes(user?.role) ? "/inventory" : "/catalog")
            }
          >
            <div className="focus-row-icon gold">
              <AlertTriangle size={16} />
            </div>
            <div>
              <strong>Review low-stock items</strong>
              <span>
                {lowStockCount > 0
                  ? `${lowStockCount} fragrances need replenishment`
                  : "All inventory levels look healthy"}
              </span>
            </div>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="focus-row"
            onClick={() => navigate(user?.role === "ADMIN" ? "/admin" : primaryActionPath)}
          >
            <div className="focus-row-icon sage">
              <Check size={16} />
            </div>
            <div>
              <strong>
                {user?.role === "ADMIN" ? "Manage team access" : "Open department workspace"}
              </strong>
              <span>Sales, inventory, and finance stay in sync.</span>
            </div>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </section>
      </div>

      <section className="workspace-shortcuts" aria-label="Department workspaces">
        <div className="shortcuts-header">
          <p className="panel-kicker">DEPARTMENT MODULES</p>
        </div>
        <div className="shortcuts-grid">
          {visibleWorkspaces.map((ws) => {
            const Icon = ws.icon;
            return (
              <button
                key={ws.key}
                type="button"
                className="shortcut-card"
                onClick={() => navigate(ws.to)}
              >
                <span className="shortcut-icon">
                  <Icon size={17} strokeWidth={1.7} />
                </span>
                <div>
                  <strong>{ws.title}</strong>
                  <span>{ws.description}</span>
                </div>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>

      <div className="dashboard-bottom">
        <span>VÉLORA · OPERATIONS WORKSPACE</span>
        <span>Shared data, considered clearly.</span>
      </div>
    </div>
  );
}
