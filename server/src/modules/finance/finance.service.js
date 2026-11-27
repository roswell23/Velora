import { Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";

export async function getDashboardSummary() {
  const [payments, unpaidOrders, stockIns] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.order.aggregate({
      where: { status: "FULFILLED", paymentStatus: "UNPAID" },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.stockMovement.findMany({
      where: { type: "STOCK_IN" },
      select: { quantity: true, unitCost: true },
    }),
  ]);

  const inventoryPurchaseCost = stockIns.reduce((total, movement) => {
    if (!movement.unitCost) return total;
    return total.add(movement.unitCost.mul(movement.quantity));
  }, new Prisma.Decimal(0));

  return {
    paidRevenue: (payments._sum.amount || new Prisma.Decimal(0)).toFixed(2),
    unpaidReceivables: (unpaidOrders._sum.total || new Prisma.Decimal(0)).toFixed(2),
    unpaidOrderCount: unpaidOrders._count._all,
    inventoryPurchaseCost: inventoryPurchaseCost.toFixed(2),
    stockInCount: stockIns.length,
  };
}
