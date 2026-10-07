import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyPaystack } from "../../../../lib/paystack";
import { db } from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let event: any;
  try { event = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (event?.event === "charge.success" && event?.data?.reference) {
    const reference = String(event.data.reference);
    try {
      const verified = await verifyPaystack(reference);
      const tx = await db.walletTransaction.findUnique({ where: { reference } });
      const purchase = await db.productPurchase.findFirst({ where: { paymentReference: reference } });
      if (purchase) {
        const expected = Number(purchase.downPayment || purchase.amount);
        if (verified.status === "success" && verified.reference === reference && verified.currency === purchase.currency && Number(verified.amount) === Math.round(expected * 100)) {
          await db.productPurchase.updateMany({ where: { id: purchase.id, paymentStatus: { not: "PAID" } }, data: { paymentStatus: "PAID", status: "REVIEWING" } });
          await db.auditLog.create({ data: { actorId: purchase.userId, action: "VEHICLE_PAYMENT_CONFIRMED_WEBHOOK", targetType: "ProductPurchase", targetId: purchase.id, metadata: JSON.stringify({ reference, amount: expected, currency: purchase.currency }) } });
        }
      }
      if (tx && tx.type === "DEPOSIT" && tx.status !== "COMPLETED") {
        if (
          verified.status === "success" &&
          verified.reference === reference &&
          verified.currency === (process.env.PAYSTACK_CURRENCY || "NGN").toUpperCase() &&
          Number(verified.amount) === Math.round(Number(tx.amount) * 100)
        ) {
          await db.$transaction(async (prisma) => {
            const current = await prisma.walletTransaction.findUnique({ where: { id: tx.id } });
            if (!current || current.status === "COMPLETED") return;
            const changed = await prisma.walletTransaction.updateMany({
              where: { id: current.id, status: "PENDING" },
              data: { status: "COMPLETED", provider: "PAYSTACK", providerStatus: verified.status },
            });
            if (changed.count !== 1) return;
            await prisma.wallet.update({
              where: { id: current.walletId },
              data: { balance: { increment: current.amount }, availableBalance: { increment: current.amount } },
            });
          });
        }
      }
    } catch {
      return NextResponse.json({ received: true });
    }
  }
  return NextResponse.json({ received: true });
}
