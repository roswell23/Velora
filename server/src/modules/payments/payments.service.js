import { Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";

function createPaymentError(statusCode, code, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

export async function recordPayment(staffUserId, { orderId, amount, method, referenceNo }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw createPaymentError(404, "NOT_FOUND", "Order not found.");
    if (order.status !== "FULFILLED") {
      throw createPaymentError(400, "ORDER_NOT_FULFILLED", "Only fulfilled orders can be paid.");
    }
    if (order.paymentStatus !== "UNPAID") {
      throw createPaymentError(400, "ORDER_ALREADY_PAID", "This order has already been paid.");
    }

    const paymentAmount = new Prisma.Decimal(amount);
    if (!paymentAmount.equals(order.total)) {
      throw createPaymentError(400, "AMOUNT_MISMATCH", "Payment amount must match the order total.");
    }

    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        amount: paymentAmount,
        method,
        referenceNo: referenceNo || null,
        recordedById: staffUserId,
      },
      include: {
        order: { select: { id: true, orderNumber: true, total: true } },
        recordedBy: { select: { id: true, name: true } },
      },
    });

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID" },
      select: { id: true, orderNumber: true, total: true, paymentStatus: true },
    });

    return { ...payment, order: updatedOrder };
  });
}
