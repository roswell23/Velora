import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Download,
  Ellipsis,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Wallet,
} from "lucide-react";

const config = {
  sales: {
    eyebrow: "SALES OPERATIONS",
    title: "Sales overview",
    description: "A clear view of customer activity and the orders moving through Vélora.",
    stats: [
      { label: "Orders today", value: "—", change: "Live data connects soon", icon: ShoppingBag },
      { label: "Awaiting fulfillment", value: "—", change: "Across all channels", icon: Clock3 },
      { label: "Open customers", value: "—", change: "Customer records", icon: Sparkles },
      { label: "Average order", value: "—", change: "This month", icon: Wallet },
    ],
    tableTitle: "Recent orders",
    tableIntro: "Online and in-store orders appear together here.",
    headers: ["ORDER", "CUSTOMER", "DATE", "SOURCE", "STATUS", "TOTAL"],
    rows: [
      ["VEL-2026-0010", "Jane Doe", "Today, 10:42", "Online", "Pending", "$185.00"],
      ["VEL-2026-0009", "Amara Cruz", "Yesterday", "In store", "Fulfilled", "$248.00"],
      ["VEL-2026-0008", "Luca Reyes", "Nov 22, 2026", "Online", "Fulfilled", "$162.00"],
    ],
    emptyTitle: "No orders to show yet",
    emptyText: "New orders will appear here as customers shop.",
    icon: ShoppingBag,
  },
  inventory: {
    eyebrow: "INVENTORY & WAREHOUSE",
    title: "Inventory overview",
    description: "Keep every fragrance accounted for, from first delivery to final bottle.",
    stats: [
      { label: "Active products", value: "—", change: "Across all categories", icon: Package },
      {
        label: "Below reorder level",
        value: "—",
        change: "Review stock soon",
        icon: ArrowDownRight,
      },
      { label: "Orders to fulfill", value: "—", change: "Ready for picking", icon: ShoppingBag },
      { label: "Stock movements", value: "—", change: "Logged this week", icon: ArrowUpRight },
    ],
    tableTitle: "Stock watch",
    tableIntro: "Products at or below their reorder level.",
    headers: ["PRODUCT", "SKU", "ON HAND", "REORDER AT", "STATUS", "ACTION"],
    rows: [
      ["Fleur de Soie", "VEL-FLR-075", "2 bottles", "5 bottles", "Low stock", "Restock"],
      ["Santal Royale", "VEL-SAN-100", "10 bottles", "5 bottles", "Healthy", "View"],
      ["Ambre Nocturne", "VEL-AMB-100", "7 bottles", "4 bottles", "Healthy", "View"],
    ],
    emptyTitle: "Inventory is in good shape",
    emptyText: "Products needing attention will appear in this list.",
    icon: Package,
  },
  finance: {
    eyebrow: "FINANCE & RECONCILIATION",
    title: "Finance overview",
    description: "Reconcile collected payments and understand the cost behind every restock.",
    stats: [
      { label: "Paid revenue", value: "—", change: "Paid orders only", icon: Wallet },
      { label: "Unpaid fulfilled", value: "—", change: "Ready to reconcile", icon: Clock3 },
      { label: "Payments today", value: "—", change: "Recorded collections", icon: Check },
      { label: "Stock-in cost", value: "—", change: "Procurement to date", icon: Package },
    ],
    tableTitle: "Payment reconciliation",
    tableIntro: "Only fulfilled, unpaid orders can be recorded here.",
    headers: ["ORDER", "CUSTOMER", "FULFILLED", "AMOUNT", "STATUS", "ACTION"],
    rows: [],
    emptyTitle: "You’re all caught up",
    emptyText: "Fulfilled orders awaiting payment will appear here.",
    icon: Wallet,
  },
  admin: {
    eyebrow: "WORKSPACE ADMINISTRATION",
    title: "Your team, at a glance.",
    description: "A shared home for the people and departments behind every Vélora order.",
    stats: [
      { label: "Staff accounts", value: "—", change: "All departments", icon: Sparkles },
      { label: "Sales orders", value: "—", change: "Across both channels", icon: ShoppingBag },
      { label: "Products", value: "—", change: "In the shared catalog", icon: Package },
      { label: "Finance activity", value: "—", change: "Payments & stock-in", icon: Wallet },
    ],
    tableTitle: "Department access",
    tableIntro: "Your workspace is organized around shared operational roles.",
    headers: ["DEPARTMENT", "ROLE", "RESPONSIBILITY", "ACCESS"],
    rows: [
      ["Sales", "SALES", "Customer records & orders", "View workspace"],
      ["Inventory", "INVENTORY", "Products, stock & fulfillment", "View workspace"],
      ["Finance", "FINANCE", "Payments & cost reporting", "View workspace"],
    ],
    emptyTitle: "No team activity yet",
    emptyText: "Staff activity will appear here as your team works.",
    icon: Sparkles,
  },
};

const chartBars = [
  42, 58, 46, 74, 62, 88, 54, 68, 51, 80, 61, 92, 55, 71, 48, 65, 84, 57, 75, 96, 62, 78, 53, 69,
];

function StatusPill({ status }) {
  const className =
    status.toLowerCase().includes("low") || status.toLowerCase().includes("pending")
      ? "status-pill status-warn"
      : status.toLowerCase().includes("healthy") || status.toLowerCase().includes("fulfilled")
        ? "status-pill status-good"
        : "status-pill";
  return (
    <span className={className}>
      <i />
      {status}
    </span>
  );
}

function MetricCard({ metric, index }) {
  const Icon = metric.icon;
  return (
    <article className="metric-card" style={{ "--card-index": index }}>
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
}

function OverviewChart() {
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">ACTIVITY SNAPSHOT</p>
          <h2>Momentum, over time</h2>
        </div>
        <button className="select-control" type="button">
          Last 30 days <span>⌄</span>
        </button>
      </div>
      <div className="chart-summary">
        <strong>—</strong>
        <span>Data will appear when connected</span>
      </div>
      <div className="chart-area" aria-label="Illustrative activity chart placeholder">
        <div className="chart-guides">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="chart-bars" aria-hidden="true">
          {chartBars.map((height, index) => (
            <span key={index} style={{ "--bar-height": `${height}%`, "--bar-index": index }} />
          ))}
        </div>
      </div>
      <div className="chart-axis">
        <span>01 NOV</span>
        <span>08 NOV</span>
        <span>15 NOV</span>
        <span>22 NOV</span>
        <span>30 NOV</span>
      </div>
      <p className="preview-caption">Chart layout preview · Live reporting is not connected yet</p>
    </section>
  );
}

function WorkTable({ page }) {
  const PageIcon = page.icon;
  return (
    <section className="panel work-panel">
      <div className="panel-heading work-heading">
        <div>
          <p className="panel-kicker">WORKSPACE</p>
          <h2>{page.tableTitle}</h2>
          <p className="panel-subtitle">{page.tableIntro}</p>
        </div>
        <button className="quiet-button" type="button">
          <Ellipsis size={19} />
        </button>
      </div>
      {page.rows.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {page.headers.map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {page.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) => (
                    <td key={`${row[0]}-${index}`} className={index === 0 ? "table-primary" : ""}>
                      {index === 4 &&
                      (page.eyebrow.includes("SALES") || page.eyebrow.includes("INVENTORY")) ? (
                        <StatusPill status={cell} />
                      ) : index === 0 ? (
                        <>
                          <span className="table-mark">
                            <PageIcon size={14} />
                          </span>
                          {cell}
                        </>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-empty">
          <div className="empty-icon">
            <PageIcon size={20} />
          </div>
          <strong>{page.emptyTitle}</strong>
          <p>{page.emptyText}</p>
        </div>
      )}
      <div className="panel-footer">
        <span>
          {page.rows.length
            ? `Showing ${page.rows.length} preview records`
            : "Ready when your workspace is"}
        </span>
        <button type="button">
          View all <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}

export default function DepartmentDashboard({ department = "sales" }) {
  const page = config[department] || config.sales;
  const [notice, setNotice] = useState(false);
  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
        <div className="heading-actions">
          <span className="preview-badge">
            <i /> UI PREVIEW
          </span>
          <button className="outline-button" type="button" onClick={() => setNotice(true)}>
            <Download size={15} /> Export
          </button>
          {department === "sales" && (
            <button className="primary-button" type="button" onClick={() => setNotice(true)}>
              <Plus size={15} /> New order
            </button>
          )}
          {department === "inventory" && (
            <button className="primary-button" type="button" onClick={() => setNotice(true)}>
              <Plus size={15} /> Add stock
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="inline-notice" role="status">
          <Check size={16} /> This action will be enabled when the module is connected to the API.
          <button onClick={() => setNotice(false)} aria-label="Dismiss notice">
            ×
          </button>
        </div>
      )}

      <div className="preview-notice">
        <Sparkles size={15} />
        <span>
          <strong>Scaffold preview</strong> · Dashboard data and actions are visual examples; live
          API integration is coming in the next slice.
        </span>
        <button aria-label="Dismiss preview notice">×</button>
      </div>

      <div className="metric-grid">
        {page.stats.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </div>

      <div className="dashboard-grid">
        <OverviewChart />
        <section className="panel focus-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">YOUR FOCUS</p>
              <h2>Good work, in view.</h2>
            </div>
            <button className="quiet-button" type="button">
              <Ellipsis size={19} />
            </button>
          </div>
          <div className="focus-progress">
            <div className="progress-ring">
              <span>—</span>
            </div>
            <div>
              <strong>Today’s rhythm</strong>
              <p>Your daily activity summary will appear here.</p>
            </div>
          </div>
          <div className="focus-divider" />
          <div className="focus-row">
            <div className="focus-row-icon gold">
              <Clock3 size={16} />
            </div>
            <div>
              <strong>Stay in the loop</strong>
              <span>Recent changes are gathered here.</span>
            </div>
            <ArrowRight size={15} />
          </div>
          <div className="focus-row">
            <div className="focus-row-icon sage">
              <Check size={16} />
            </div>
            <div>
              <strong>One shared workspace</strong>
              <span>Sales, inventory, and finance stay in sync.</span>
            </div>
            <ArrowRight size={15} />
          </div>
        </section>
      </div>

      <WorkTable page={page} />
      <div className="dashboard-bottom">
        <span>VÉLORA · OPERATIONS WORKSPACE</span>
        <span>Shared data, considered clearly.</span>
      </div>
    </div>
  );
}
