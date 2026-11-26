import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toCents } from "../utils/formatMoney.js";

export const BAG_STORAGE_KEY = "velora_boutique_bag";
const SAVED_STORAGE_KEY = "velora_saved_fragrances";

const BagContext = createContext(null);

function readStoredList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function BagProvider({ children }) {
  const [bag, setBag] = useState(() => readStoredList(BAG_STORAGE_KEY));
  const [saved, setSaved] = useState(() => readStoredList(SAVED_STORAGE_KEY));
  const [bagOpen, setBagOpen] = useState(false);
  const bagTriggerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(bag));
  }, [bag]);

  useEffect(() => {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  const bagCount = useMemo(
    () => bag.reduce((total, item) => total + item.quantity, 0),
    [bag]
  );

  const bagTotalCents = useMemo(
    () => bag.reduce((total, item) => total + toCents(item.price) * BigInt(item.quantity), 0n),
    [bag]
  );

  const addToBag = useCallback((fragrance, quantity = 1) => {
    if (!fragrance || fragrance.stock <= 0 || quantity <= 0) return;
    setBag((current) => {
      const existing = current.find((item) => item.id === fragrance.id);
      if (existing) {
        return current.map((item) =>
          item.id === fragrance.id
            ? { ...item, ...fragrance, quantity: Math.min(fragrance.stock, item.quantity + quantity) }
            : item
        );
      }
      return [...current, { ...fragrance, quantity: Math.min(fragrance.stock, quantity) }];
    });
    setBagOpen(true);
  }, []);

  const changeQuantity = useCallback((id, delta) => {
    setBag((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.min(item.stock, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const clearBag = useCallback(() => {
    setBag([]);
    localStorage.removeItem(BAG_STORAGE_KEY);
  }, []);

  const syncBagWithProducts = useCallback((products) => {
    if (!products?.length) return;
    setBag((currentBag) => {
      if (!currentBag.length) return currentBag;
      return currentBag.flatMap((item) => {
        const product = products.find(
          (candidate) => candidate.id === item.id || candidate.name === item.name
        );
        if (!product) return [item];
        if (product.stock <= 0) return [];
        return [{ ...product, quantity: Math.min(item.quantity, product.stock) }];
      });
    });
  }, []);

  const toggleSaved = useCallback((id) => {
    setSaved((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]
    );
  }, []);

  const value = useMemo(
    () => ({
      bag,
      saved,
      bagOpen,
      setBagOpen,
      bagTriggerRef,
      bagCount,
      bagTotalCents,
      addToBag,
      changeQuantity,
      clearBag,
      syncBagWithProducts,
      toggleSaved,
    }),
    [
      bag,
      saved,
      bagOpen,
      bagCount,
      bagTotalCents,
      addToBag,
      changeQuantity,
      clearBag,
      syncBagWithProducts,
      toggleSaved,
    ]
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error("useBag must be used within BagProvider.");
  return ctx;
}
