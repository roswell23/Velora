const familyTone = { Woody: "sand", Floral: "rose", Oriental: "amber", Citrus: "cream" };

export function mapProduct(product, index = 0) {
  return {
    id: product.id,
    sku: product.sku || "",
    name: product.name,
    brand: product.brand || "VÉLORA Atelier",
    description: product.description || "",
    family: product.category?.name || "Fragrance",
    categoryId: product.category?.id ?? product.categoryId ?? null,
    volume: product.size || "100ml",
    size: `${product.size || "100ml"} · Eau de parfum`,
    price: product.unitPrice,
    stock: product.stock,
    reorderLevel: product.reorderLevel,
    imageUrl: product.imageUrl,
    label: ["SIGNATURE", "ATELIER EDIT", "NEW ARRIVAL"][index] || "",
    tone: familyTone[product.category?.name] || "sand",
  };
}

export function getStockStatus(stock, reorderLevel = 5) {
  if (stock === 0) {
    return {
      code: "OUT_OF_STOCK",
      label: "Out of stock",
      detailLabel: "Currently out of stock",
      className: "stock-note-out",
    };
  }
  if (stock <= reorderLevel) {
    return {
      code: "LOW_STOCK",
      label: `Low stock · ${stock} left`,
      detailLabel: `Low stock · Only ${stock} ${stock === 1 ? "bottle" : "bottles"} remaining`,
      className: "stock-note-low",
    };
  }
  return {
    code: "IN_STOCK",
    label: "In stock",
    detailLabel: `In stock · ${stock} available`,
    className: "",
  };
}

export default function BottleArt({ name, tone = "sand", large = false }) {
  return (
    <div
      className={`bottle-art ${tone} ${large ? "bottle-large" : ""}`}
      role="img"
      aria-label={`${name} Vélora perfume bottle illustration`}
    >
      <div className="bottle-light" />
      <div className="bottle-shadow" />
      <div className="bottle-cap" />
      <div className="bottle-neck" />
      <div className="bottle-vessel">
        <div className="bottle-label">
          <span>VÉLORA</span>
          <i />
          <small>{name.toUpperCase()}</small>
        </div>
      </div>
      <span className="bottle-caption">EAU DE PARFUM · PARIS</span>
    </div>
  );
}
