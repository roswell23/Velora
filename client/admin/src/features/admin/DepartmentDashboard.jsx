import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Download,
  Package,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  UserPlus,
  UsersRound,
  Wallet,
} from "lucide-react";
import CustomerModal from "../../components/CustomerModal.jsx";
import StaffModal from "../../components/StaffModal.jsx";
import StockInModal from "../../components/StockInModal.jsx";
import WalkInOrderModal from "../../components/WalkInOrderModal.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { api } from "../../services/apiClient.js";

const DEPARTMENT_ACCESS_ROWS = [
  {
    id: "dept-sales",
    department: "Sales",
    role: "SALES",
    responsibility: "Customer records & orders",
    to: "/sales",
  },
  {
    id: "dept-inventory",
    department: "Inventory",
    role: "INVENTORY",
    responsibility: "Products, stock & fulfillment",
    to: "/inventory",
  },
  {
    id: "dept-finance",
    department: "Finance",
    role: "FINANCE",
    responsibility: "Payments & cost reporting",
    to: "/finance",
  },
];

const DEPT_CONFIG = {
  sales: {
    eyebrow: "SALES OPERATIONS",
    title: "Sales & customer ordering",
    description: "Manage walk-in and online customers, create orders, and track fulfillment.",
    isLive: true,
    icon: ShoppingBag,
  },
  inventory: {
    eyebrow: "INVENTORY & WAREHOUSE",
    title: "Inventory & stock-in",
    description: "Add stock, fulfill pending orders, and monitor real-time warehouse levels.",
    isLive: true,
    icon: Package,
  },
  catalog: {
    eyebrow: "SHARED PRODUCT CATALOG",
    title: "Product catalog",
    description: "Live view of active Vélora fragrances, pricing, and warehouse stock.",
    isLive: true,
    icon: Package,
  },
  finance: {
    eyebrow: "FINANCE & RECONCILIATION",
    title: "Finance overview",
    description: "Reconcile collected payments and understand the cost behind every restock.",
    isLive: false,
    icon: Wallet,
  },
  admin: {
    eyebrow: "WORKSPACE ADMINISTRATION",
    title: "Your team, at a glance.",
    description: "Manage staff access, roles, and shared operational visibility across Vélora.",
    isLive: true,
    icon: UsersRound,
  },
};

function StatusPill({ status }) {
  const lower = status.toLowerCase();
  const className =
    lower.includes("low") || lower.includes("pending") || lower.includes("unpaid")
      ? "status-pill status-warn"
      : lower.includes("out") || lower.includes("deactivated") || lower.includes("cancel")
        ? "status-pill status-danger"
        : lower.includes("healthy") ||
            lower.includes("fulfilled") ||
            lower.includes("active") ||
            lower.includes("paid") ||
            lower.includes("stock_in")
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

function downloadCsv(filename, headers, rows) {
  const escape = (val) => `"${String(val ?? "").replaceAll('"', '""')}"`;
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DepartmentDashboard({ department = "sales" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const page = DEPT_CONFIG[department] || DEPT_CONFIG.sales;
  const PageIcon = page.icon;

  const [notice, setNotice] = useState("");
  const [errorBanner, setErrorBanner] = useState("");
  const [showPreviewBanner, setShowPreviewBanner] = useState(true);

  const [staffList, setStaffList] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [movements, setMovements] = useState([]);

  const [loadingData, setLoadingData] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [stockInProductId, setStockInProductId] = useState(null);

  const [adminTab, setAdminTab] = useState("staff");
  const [salesTab, setSalesTab] = useState("orders");
  const [inventoryTab, setInventoryTab] = useState("stock");
  const [tableFilter, setTableFilter] = useState("all");
  const [tableSearch, setTableSearch] = useState("");

  const loadLiveData = useCallback(async () => {
    setLoadingData(true);
    setErrorBanner("");
    try {
      const promises = {
        products: api.get("/products?limit=100"),
      };
      if (department === "admin" && user?.role === "ADMIN") {
        promises.users = api.get("/users?limit=100");
      }
      if (department === "sales") {
        promises.orders = api.get("/orders?limit=100");
        promises.customers = api.get("/customers?limit=100");
      }
      if (department === "inventory") {
        promises.orders = api.get("/orders?status=PENDING&limit=100");
        promises.movements = api.get("/inventory/movements?limit=50");
      }
      if (department === "finance") {
        promises.orders = api.get("/orders?limit=100");
      }

      const entries = await Promise.all(
        Object.entries(promises).map(async ([key, req]) => [key, await req])
      );
      const resultMap = Object.fromEntries(entries);

      if (Array.isArray(resultMap.products?.data)) setProducts(resultMap.products.data);
      if (Array.isArray(resultMap.users?.data)) setStaffList(resultMap.users.data);
      if (Array.isArray(resultMap.orders?.data)) setOrders(resultMap.orders.data);
      if (Array.isArray(resultMap.customers?.data)) setCustomers(resultMap.customers.data);
      if (Array.isArray(resultMap.movements?.data)) setMovements(resultMap.movements.data);
    } catch (err) {
      setErrorBanner(err.message || "Could not refresh workspace records.");
    } finally {
      setLoadingData(false);
    }
  }, [department, user?.role]);

  useEffect(() => {
    setNotice("");
    setErrorBanner("");
    setTableFilter("all");
    setTableSearch("");
    setShowPreviewBanner(true);
    loadLiveData();
  }, [department, loadLiveData]);

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
  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === "PENDING").length,
    [orders]
  );
  const fulfilledUnpaidOrders = useMemo(
    () => orders.filter((o) => o.status === "FULFILLED" && o.paymentStatus === "UNPAID"),
    [orders]
  );
  const paidRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.paymentStatus === "PAID")
        .reduce((sum, o) => sum + Number(o.total || 0), 0),
    [orders]
  );

  const metrics = useMemo(() => {
    if (department === "admin") {
      return [
        {
          label: "Staff accounts",
          value: loadingData && staffList.length === 0 ? "…" : String(staffList.length),
          change: `${activeStaffCount} active across departments`,
          icon: UsersRound,
        },
        {
          label: "Products",
          value: loadingData && products.length === 0 ? "…" : String(products.length),
          change: "In the shared catalog",
          icon: Package,
        },
        {
          label: "Low stock alerts",
          value: loadingData && products.length === 0 ? "…" : String(lowStockCount),
          change: "At or below reorder level",
          icon: AlertTriangle,
        },
        {
          label: "Departments",
          value: "3",
          change: "Sales, Inventory, Finance",
          icon: Sparkles,
        },
      ];
    }

    if (department === "inventory" || department === "catalog") {
      return [
        {
          label: "Active products",
          value: loadingData && products.length === 0 ? "…" : String(products.length),
          change: "Shared with storefront",
          icon: Package,
        },
        {
          label: "Below reorder level",
          value: loadingData && products.length === 0 ? "…" : String(lowStockCount),
          change: lowStockCount > 0 ? "Review stock soon" : "All stock healthy",
          icon: ArrowDownRight,
        },
        {
          label: "Orders to fulfill",
          value: loadingData && orders.length === 0 ? "0" : String(pendingOrdersCount),
          change: `${outOfStockCount} SKUs out of stock`,
          icon: ShoppingBag,
        },
        {
          label: "Units on hand",
          value: loadingData && products.length === 0 ? "…" : String(totalUnits),
          change: "Total warehouse bottles",
          icon: ArrowUpRight,
        },
      ];
    }

    if (department === "finance") {
      return [
        { label: "Paid revenue", value: `$${paidRevenue.toFixed(2)}`, change: "Paid orders only", icon: Wallet },
        {
          label: "Unpaid fulfilled",
          value: String(fulfilledUnpaidOrders.length),
          change: "Ready to reconcile",
          icon: Clock3,
        },
        { label: "Catalog SKUs", value: String(products.length || "—"), change: "Active fragrances", icon: Package },
        { label: "Low stock alerts", value: String(lowStockCount), change: "Potential restock spend", icon: ArrowUpRight },
      ];
    }

    return [
      { label: "Total orders", value: String(orders.length), change: "Online & walk-in", icon: ShoppingBag },
      { label: "Pending fulfillment", value: String(pendingOrdersCount), change: "Awaiting inventory pick", icon: Clock3 },
      { label: "Customers", value: String(customers.length), change: "Registered & walk-in", icon: UsersRound },
      { label: "Available SKUs", value: String(products.filter((p) => p.stock > 0).length), change: "Ready to order", icon: Package },
    ];
  }, [
    activeStaffCount,
    customers.length,
    department,
    fulfilledUnpaidOrders.length,
    loadingData,
    lowStockCount,
    orders.length,
    outOfStockCount,
    paidRevenue,
    pendingOrdersCount,
    products,
    staffList.length,
    totalUnits,
  ]);

  const filteredStaff = useMemo(() => {
    const term = tableSearch.trim().toLowerCase();
    return staffList.filter((member) => {
      const matchesFilter =
        tableFilter === "all" ||
        (tableFilter === "active" && member.isActive) ||
        (tableFilter === "inactive" && !member.isActive);
      const matchesSearch =
        !term || `${member.name} ${member.email} ${member.role}`.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [staffList, tableFilter, tableSearch]);

  const filteredProducts = useMemo(() => {
    const term = tableSearch.trim().toLowerCase();
    return products.filter((item) => {
      const matchesFilter =
        tableFilter === "all" || (tableFilter === "low" && item.stock <= item.reorderLevel);
      const matchesSearch =
        !term ||
        `${item.name} ${item.sku} ${item.category?.name || ""}`.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [products, tableFilter, tableSearch]);

  const filteredOrders = useMemo(() => {
    const term = tableSearch.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter =
        tableFilter === "all" || order.status.toLowerCase() === tableFilter;
      const matchesSearch =
        !term ||
        `${order.orderNumber} ${order.customer?.name || ""} ${order.source}`
          .toLowerCase()
          .includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [orders, tableFilter, tableSearch]);

  const filteredCustomers = useMemo(() => {
    const term = tableSearch.trim().toLowerCase();
    return customers.filter(
      (c) => !term || `${c.name} ${c.phone} ${c.email || ""}`.toLowerCase().includes(term)
    );
  }, [customers, tableSearch]);

  async function handleUpdateUser(member, patch) {
    setBusyId(member.id);
    setErrorBanner("");
    try {
      const response = await api.patch(`/users/${member.id}`, patch);
      setStaffList((current) =>
        current.map((item) => (item.id === member.id ? response.data : item))
      );
      setNotice(`Updated ${response.data.name}'s account.`);
    } catch (err) {
      setErrorBanner(err.message || "Could not update staff account.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancelOrder(order) {
    setBusyId(order.id);
    setErrorBanner("");
    try {
      const response = await api.post(`/orders/${order.id}/cancel`);
      setOrders((current) => current.map((o) => (o.id === order.id ? response.data : o)));
      setNotice(`Order ${order.orderNumber} was cancelled.`);
    } catch (err) {
      setErrorBanner(err.message || "Could not cancel order.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleFulfillOrder(order) {
    setBusyId(order.id);
    setErrorBanner("");
    try {
      await api.post(`/orders/${order.id}/fulfill`);
      setNotice(`Fulfilled order ${order.orderNumber} and updated warehouse stock.`);
      await loadLiveData();
    } catch (err) {
      setErrorBanner(err.message || "Could not fulfill order.");
    } finally {
      setBusyId(null);
    }
  }

  function openRestockModal(productId = null) {
    setStockInProductId(productId);
    setStockInModalOpen(true);
  }

  function handleExportCsv() {
    if (department === "admin" && adminTab === "staff") {
      downloadCsv(
        "velora-staff.csv",
        ["Name", "Email", "Role", "Status"],
        filteredStaff.map((m) => [m.name, m.email, m.role, m.isActive ? "Active" : "Deactivated"])
      );
      setNotice(`Exported ${filteredStaff.length} staff records to CSV.`);
      return;
    }
    if (department === "sales" && salesTab === "orders") {
      downloadCsv(
        "velora-orders.csv",
        ["Order", "Customer", "Source", "Status", "Payment", "Total"],
        filteredOrders.map((o) => [
          o.orderNumber,
          o.customer?.name || "",
          o.source,
          o.status,
          o.paymentStatus,
          o.total,
        ])
      );
      setNotice(`Exported ${filteredOrders.length} orders to CSV.`);
      return;
    }
    if (department === "sales" && salesTab === "customers") {
      downloadCsv(
        "velora-customers.csv",
        ["Name", "Phone", "Email", "Type", "Orders"],
        filteredCustomers.map((c) => [
          c.name,
          c.phone,
          c.email || "",
          c.userId ? "Online" : "Walk-in",
          c._count?.orders ?? 0,
        ])
      );
      setNotice(`Exported ${filteredCustomers.length} customers to CSV.`);
      return;
    }
    if (department === "inventory" || department === "catalog") {
      downloadCsv(
        "velora-inventory.csv",
        ["Product", "SKU", "Category", "Stock", "Reorder Level", "Unit Price"],
        filteredProducts.map((p) => [
          p.name,
          p.sku,
          p.category?.name || "",
          p.stock,
          p.reorderLevel,
          p.unitPrice,
        ])
      );
      setNotice(`Exported ${filteredProducts.length} products to CSV.`);
      return;
    }
    setNotice("Nothing to export in this view yet.");
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
        <div className="heading-actions">
          <span className={`preview-badge ${page.isLive ? "is-live" : ""}`}>
            <i /> {page.isLive ? "LIVE DATA" : "UI PREVIEW"}
          </span>
          <button
            className="outline-button"
            type="button"
            onClick={loadLiveData}
            disabled={loadingData}
            title="Refresh data"
          >
            <RefreshCw size={14} className={loadingData ? "spin-icon" : ""} aria-hidden="true" />
            <span>Refresh</span>
          </button>
          <button className="outline-button" type="button" onClick={handleExportCsv}>
            <Download size={15} aria-hidden="true" />
            <span>Export CSV</span>
          </button>

          {department === "admin" && (
            <button
              className="primary-button"
              type="button"
              onClick={() => setStaffModalOpen(true)}
            >
              <UserPlus size={15} aria-hidden="true" />
              <span>Add staff member</span>
            </button>
          )}

          {department === "sales" && (
            <>
              <button
                className="outline-button"
                type="button"
                onClick={() => setCustomerModalOpen(true)}
              >
                <UserPlus size={15} aria-hidden="true" />
                <span>Add customer</span>
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => setWalkInModalOpen(true)}
              >
                <Plus size={15} aria-hidden="true" />
                <span>New order</span>
              </button>
            </>
          )}

          {department === "inventory" && (
            <button
              className="primary-button"
              type="button"
              onClick={() => openRestockModal(null)}
            >
              <PackagePlus size={15} aria-hidden="true" />
              <span>Add stock</span>
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="inline-notice" role="status">
          <Check size={16} aria-hidden="true" />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice">
            ×
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="inline-notice is-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{errorBanner}</span>
          <button type="button" onClick={() => setErrorBanner("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {!page.isLive && showPreviewBanner && (
        <div className="preview-notice">
          <Sparkles size={15} aria-hidden="true" />
          <span>
            <strong>Scaffold preview</strong> · Live orders and catalog metrics are synced, while
            payment recording connects in the Finance API slice.
          </span>
          <button
            type="button"
            onClick={() => setShowPreviewBanner(false)}
            aria-label="Dismiss preview notice"
          >
            ×
          </button>
        </div>
      )}

      <div className="metric-grid">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </div>

      <section className="panel work-panel" id="workspace-records">
        <div className="panel-heading work-heading">
          <div>
            <p className="panel-kicker">
              {department === "admin"
                ? "DIRECTORY & ACCESS"
                : department === "sales"
                  ? "SALES & CUSTOMERS"
                  : department === "inventory" || department === "catalog"
                    ? "LIVE WAREHOUSE CATALOG"
                    : "WORKSPACE"}
            </p>
            <h2>
              {department === "admin"
                ? adminTab === "staff"
                  ? "Staff accounts"
                  : "Department access"
                : department === "sales"
                  ? salesTab === "orders"
                    ? "Customer orders"
                    : "Customer directory"
                  : department === "inventory"
                    ? inventoryTab === "stock"
                      ? "Product catalog & stock watch"
                      : inventoryTab === "fulfill"
                        ? "Orders to fulfill"
                        : "Stock movement log"
                    : department === "catalog"
                      ? "Product catalog & stock watch"
                      : "Payment reconciliation"}
            </h2>
            <p className="panel-subtitle">
              {department === "admin"
                ? "Manage staff logins, roles, and active status across departments."
                : department === "sales"
                  ? "Online checkout orders and walk-in orders stay synced with inventory."
                  : department === "inventory"
                    ? "Restock changes sync immediately to the customer storefront."
                    : department === "catalog"
                      ? "Live stock levels and pricing from the shared database."
                      : "Fulfilled, unpaid orders ready for payment collection."}
            </p>
          </div>

          <div className="work-toolbar">
            {department === "admin" && (
              <div className="work-tabs" role="tablist" aria-label="Administration views">
                <button
                  type="button"
                  role="tab"
                  aria-selected={adminTab === "staff"}
                  className={`work-tab ${adminTab === "staff" ? "is-active" : ""}`}
                  onClick={() => {
                    setAdminTab("staff");
                    setTableFilter("all");
                  }}
                >
                  Staff ({staffList.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={adminTab === "departments"}
                  className={`work-tab ${adminTab === "departments" ? "is-active" : ""}`}
                  onClick={() => setAdminTab("departments")}
                >
                  Departments
                </button>
              </div>
            )}

            {department === "sales" && (
              <>
                <div className="work-tabs" role="tablist" aria-label="Sales views">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={salesTab === "orders"}
                    className={`work-tab ${salesTab === "orders" ? "is-active" : ""}`}
                    onClick={() => {
                      setSalesTab("orders");
                      setTableFilter("all");
                    }}
                  >
                    Orders ({orders.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={salesTab === "customers"}
                    className={`work-tab ${salesTab === "customers" ? "is-active" : ""}`}
                    onClick={() => {
                      setSalesTab("customers");
                      setTableFilter("all");
                    }}
                  >
                    Customers ({customers.length})
                  </button>
                </div>
                {salesTab === "orders" && (
                  <div className="work-tabs" role="group" aria-label="Filter order status">
                    {["all", "pending", "fulfilled"].map((statusKey) => (
                      <button
                        key={statusKey}
                        type="button"
                        className={`work-tab ${tableFilter === statusKey ? "is-active" : ""}`}
                        onClick={() => setTableFilter(statusKey)}
                      >
                        {statusKey === "all"
                          ? "All"
                          : statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {department === "inventory" && (
              <div className="work-tabs" role="tablist" aria-label="Inventory views">
                <button
                  type="button"
                  role="tab"
                  aria-selected={inventoryTab === "stock"}
                  className={`work-tab ${inventoryTab === "stock" ? "is-active" : ""}`}
                  onClick={() => {
                    setInventoryTab("stock");
                    setTableFilter("all");
                  }}
                >
                  Stock ({products.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={inventoryTab === "fulfill"}
                  className={`work-tab ${inventoryTab === "fulfill" ? "is-active" : ""}`}
                  onClick={() => setInventoryTab("fulfill")}
                >
                  Fulfill ({pendingOrdersCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={inventoryTab === "movements"}
                  className={`work-tab ${inventoryTab === "movements" ? "is-active" : ""}`}
                  onClick={() => setInventoryTab("movements")}
                >
                  Movements ({movements.length})
                </button>
              </div>
            )}

            {((department === "inventory" && inventoryTab === "stock") ||
              department === "catalog") && (
              <div className="work-tabs" role="group" aria-label="Filter stock">
                <button
                  type="button"
                  className={`work-tab ${tableFilter === "all" ? "is-active" : ""}`}
                  onClick={() => setTableFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`work-tab ${tableFilter === "low" ? "is-active" : ""}`}
                  onClick={() => setTableFilter("low")}
                >
                  Low stock ({lowStockCount})
                </button>
              </div>
            )}

            {!(department === "admin" && adminTab === "departments") &&
              !(department === "inventory" && inventoryTab !== "stock") &&
              department !== "finance" && (
                <label className="table-search">
                  <Search size={14} aria-hidden="true" />
                  <input
                    value={tableSearch}
                    onChange={(event) => setTableSearch(event.target.value)}
                    placeholder={
                      department === "admin"
                        ? "Filter team…"
                        : department === "sales"
                          ? salesTab === "customers"
                            ? "Search customer…"
                            : "Search order or customer…"
                          : "Filter SKU or name…"
                    }
                    aria-label="Filter table rows"
                  />
                </label>
              )}
          </div>
        </div>

        {/* ADMIN: STAFF */}
        {department === "admin" && adminTab === "staff" ? (
          filteredStaff.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>TEAM MEMBER</th>
                    <th>EMAIL</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => {
                    const isSelf = member.id === user?.id;
                    const isBusy = busyId === member.id;
                    return (
                      <tr key={member.id}>
                        <td className="table-primary">
                          <span className="table-mark">
                            <UsersRound size={14} />
                          </span>
                          {member.name}
                          {isSelf && <span className="self-tag">You</span>}
                        </td>
                        <td>{member.email}</td>
                        <td>
                          <select
                            className="inline-role-select"
                            aria-label={`Role for ${member.name}`}
                            value={member.role}
                            disabled={isBusy || isSelf}
                            onChange={(event) =>
                              handleUpdateUser(member, { role: event.target.value })
                            }
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="SALES">SALES</option>
                            <option value="INVENTORY">INVENTORY</option>
                            <option value="FINANCE">FINANCE</option>
                          </select>
                        </td>
                        <td>
                          <StatusPill status={member.isActive ? "Active" : "Deactivated"} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="table-action-button"
                            disabled={isBusy || isSelf}
                            onClick={() =>
                              handleUpdateUser(member, { isActive: !member.isActive })
                            }
                          >
                            {isBusy
                              ? "Saving…"
                              : member.isActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-empty">
              <div className="empty-icon">
                <UsersRound size={20} />
              </div>
              <strong>{loadingData ? "Loading staff directory…" : "No matching staff accounts"}</strong>
              <p>Add a new team member or clear your search filter.</p>
            </div>
          )
        ) : department === "admin" ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>DEPARTMENT</th>
                  <th>ROLE</th>
                  <th>RESPONSIBILITY</th>
                  <th>ACCESS</th>
                </tr>
              </thead>
              <tbody>
                {DEPARTMENT_ACCESS_ROWS.map((row) => (
                  <tr key={row.id}>
                    <td className="table-primary">
                      <span className="table-mark">
                        <PageIcon size={14} />
                      </span>
                      {row.department}
                    </td>
                    <td>{row.role}</td>
                    <td>{row.responsibility}</td>
                    <td>
                      <button
                        type="button"
                        className="table-action-link"
                        onClick={() => navigate(row.to)}
                      >
                        <span>Open workspace</span>
                        <ArrowRight size={13} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : department === "sales" && salesTab === "orders" ? (
          filteredOrders.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ORDER</th>
                    <th>CUSTOMER</th>
                    <th>ITEMS</th>
                    <th>SOURCE</th>
                    <th>STATUS</th>
                    <th>TOTAL</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="table-primary">
                        <span className="table-mark">
                          <ShoppingBag size={14} />
                        </span>
                        {order.orderNumber}
                      </td>
                      <td>{order.customer?.name || "—"}</td>
                      <td>
                        {order.items?.map((i) => `${i.quantity}× ${i.productName}`).join(", ") || "—"}
                      </td>
                      <td>{order.source}</td>
                      <td>
                        <StatusPill status={order.status} />
                      </td>
                      <td>${Number(order.total).toFixed(2)}</td>
                      <td>
                        {order.status === "PENDING" ? (
                          <button
                            type="button"
                            className="table-action-button"
                            disabled={busyId === order.id}
                            onClick={() => handleCancelOrder(order)}
                          >
                            {busyId === order.id ? "Cancelling…" : "Cancel"}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-empty">
              <div className="empty-icon">
                <ShoppingBag size={20} />
              </div>
              <strong>{loadingData ? "Loading orders…" : "No orders found"}</strong>
              <p>Create a walk-in order or wait for online customer checkouts.</p>
            </div>
          )
        ) : department === "sales" ? (
          filteredCustomers.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>CUSTOMER</th>
                    <th>PHONE</th>
                    <th>EMAIL</th>
                    <th>CHANNEL</th>
                    <th>ORDERS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id}>
                      <td className="table-primary">
                        <span className="table-mark">
                          <UsersRound size={14} />
                        </span>
                        {c.name}
                      </td>
                      <td>{c.phone}</td>
                      <td>{c.email || "—"}</td>
                      <td>{c.userId ? "Online" : "Walk-in"}</td>
                      <td>{c._count?.orders ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-empty">
              <div className="empty-icon">
                <UsersRound size={20} />
              </div>
              <strong>{loadingData ? "Loading customers…" : "No customers yet"}</strong>
              <p>Click “Add customer” to register a walk-in client.</p>
            </div>
          )
        ) : department === "inventory" && inventoryTab === "fulfill" ? (
          orders.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ORDER</th>
                    <th>CUSTOMER</th>
                    <th>ITEMS</th>
                    <th>SOURCE</th>
                    <th>TOTAL</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="table-primary">
                        <span className="table-mark">
                          <ShoppingBag size={14} />
                        </span>
                        {order.orderNumber}
                      </td>
                      <td>{order.customer?.name || "—"}</td>
                      <td>
                        {order.items?.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
                      </td>
                      <td>{order.source}</td>
                      <td>${Number(order.total).toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="table-action-button"
                          disabled={busyId === order.id}
                          onClick={() => handleFulfillOrder(order)}
                        >
                          {busyId === order.id ? "Fulfilling…" : "Fulfill order"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-empty">
              <div className="empty-icon">
                <Check size={20} />
              </div>
              <strong>All caught up</strong>
              <p>No pending orders waiting for warehouse fulfillment.</p>
            </div>
          )
        ) : department === "inventory" && inventoryTab === "movements" ? (
          movements.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>TYPE</th>
                    <th>QUANTITY</th>
                    <th>REASON / NOTES</th>
                    <th>BY</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mv) => (
                    <tr key={mv.id}>
                      <td className="table-primary">{mv.product?.name || "—"}</td>
                      <td>
                        <StatusPill status={mv.type} />
                      </td>
                      <td>{mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity}</td>
                      <td>{mv.reason || "—"}</td>
                      <td>{mv.performedBy?.name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-empty">
              <div className="empty-icon">
                <Package size={20} />
              </div>
              <strong>No stock movements yet</strong>
              <p>Stock-ins and order fulfillments will appear in this audit log.</p>
            </div>
          )
        ) : department === "inventory" || department === "catalog" ? (
          filteredProducts.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>SKU</th>
                    <th>CATEGORY</th>
                    <th>ON HAND</th>
                    <th>REORDER AT</th>
                    <th>PRICE</th>
                    <th>STATUS</th>
                    {department === "inventory" && <th>ACTION</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((item) => {
                    const statusText =
                      item.stock === 0
                        ? "Out of stock"
                        : item.stock <= item.reorderLevel
                          ? "Low stock"
                          : "Healthy";
                    return (
                      <tr key={item.id}>
                        <td className="table-primary">
                          <span className="table-mark">
                            <Package size={14} />
                          </span>
                          {item.name}
                        </td>
                        <td>{item.sku}</td>
                        <td>{item.category?.name || "—"}</td>
                        <td>{item.stock} bottles</td>
                        <td>{item.reorderLevel} bottles</td>
                        <td>${Number(item.unitPrice).toFixed(2)}</td>
                        <td>
                          <StatusPill status={statusText} />
                        </td>
                        {department === "inventory" && (
                          <td>
                            <button
                              type="button"
                              className="table-action-button"
                              onClick={() => openRestockModal(item.id)}
                            >
                              <Plus size={13} aria-hidden="true" />
                              <span>Restock</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-empty">
              <div className="empty-icon">
                <Package size={20} />
              </div>
              <strong>{loadingData ? "Loading inventory…" : "No matching products"}</strong>
              <p>Try clearing the filter or switching back to all products.</p>
            </div>
          )
        ) : fulfilledUnpaidOrders.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>STATUS</th>
                  <th>PAYMENT</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {fulfilledUnpaidOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="table-primary">{order.orderNumber}</td>
                    <td>{order.customer?.name || "—"}</td>
                    <td>
                      <StatusPill status={order.status} />
                    </td>
                    <td>
                      <StatusPill status={order.paymentStatus} />
                    </td>
                    <td>${Number(order.total).toFixed(2)}</td>
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
            <strong>You’re all caught up</strong>
            <p>Fulfilled orders awaiting payment will appear here.</p>
          </div>
        )}

        <div className="panel-footer">
          <span>
            {department === "admin" && adminTab === "staff"
              ? `Showing ${filteredStaff.length} of ${staffList.length} staff accounts`
              : department === "sales" && salesTab === "orders"
                ? `Showing ${filteredOrders.length} of ${orders.length} orders`
                : department === "sales"
                  ? `Showing ${filteredCustomers.length} of ${customers.length} customers`
                  : department === "inventory" || department === "catalog"
                    ? `Showing ${filteredProducts.length} of ${products.length} products`
                    : "Ready when your workspace is"}
          </span>
          <button type="button" onClick={loadLiveData}>
            <span>Refresh records</span>
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </section>

      <div className="dashboard-bottom">
        <span>VÉLORA · OPERATIONS WORKSPACE</span>
        <span>Shared data, considered clearly.</span>
      </div>

      <StaffModal
        open={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        onCreated={(createdUser) => {
          setStaffList((current) => [createdUser, ...current]);
          setNotice(`Created staff account for ${createdUser.name} (${createdUser.role}).`);
        }}
      />

      <CustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onCreated={(createdCustomer) => {
          setCustomers((current) => [createdCustomer, ...current]);
          setNotice(`Added customer ${createdCustomer.name}.`);
        }}
      />

      <WalkInOrderModal
        open={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        customers={customers}
        products={products}
        onCreated={(createdOrder) => {
          setOrders((current) => [createdOrder, ...current]);
          setNotice(`Created walk-in order ${createdOrder.orderNumber}.`);
        }}
      />

      <StockInModal
        open={stockInModalOpen}
        onClose={() => setStockInModalOpen(false)}
        products={products}
        initialProductId={stockInProductId}
        onRestocked={({ product }) => {
          setProducts((current) => current.map((p) => (p.id === product.id ? product : p)));
          setNotice(
            `Added stock to ${product.name}. New stock: ${product.stock} bottles (live on Customer Storefront).`
          );
          loadLiveData();
        }}
      />
    </div>
  );
}
