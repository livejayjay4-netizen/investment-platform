import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/prisma";
import { paystackCurrency, verifyPaystack } from "../../../../../lib/paystack";

async function finalizeDeposit(reference: string) {
  const verified = await verifyPaystack(reference);
  const expectedCurrency = paystackCurrency();
  const tx = await db.walletTransaction.findUnique({ where: { reference } });
  if (!tx) throw new Error("Payment record not found.");
  if (tx.type !== "DEPOSIT") throw new Error("Invalid payment type.");
  if (verified.reference !== reference) throw new Error("Payment reference mismatch.");
  if (verified.currency !== expectedCurrency) throw new Error("Payment currency mismatch.");
  if (Number(verified.amount) !== Math.round(Number(tx.amount) * 100)) throw new Error("Payment amount mismatch.");
  if (verified.status !== "success") {
    if (tx.status === "PENDING") await db.walletTransaction.update({ where: { id: tx.id }, data: { status: "FAILED", provider: "PAYSTACK", providerStatus: verified.status } });
    return verified.status;
  }
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
  return "success";
}

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.redirect(new URL("/wallet/deposit?status=missing_reference", req.url));
  try {
    const status = await finalizeDeposit(reference);
    return NextResponse.redirect(new URL(`/wallet/deposit?status=${encodeURIComponent(status)}&reference=${encodeURIComponent(reference)}`, req.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment verification failed.";
    return NextResponse.redirect(new URL(`/wallet/deposit?status=error&message=${encodeURIComponent(message)}`, req.url));
  }
}
