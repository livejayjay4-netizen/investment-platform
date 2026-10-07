import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getUser } from "../../../../lib/auth";
import { db } from "../../../../lib/prisma";
import { initializePaystack } from "../../../../lib/paystack";

export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await req.json();
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid deposit amount." }, { status: 400 });
  }

  const wallet = await db.wallet.findUnique({ where: { userId: u.id } });
  if (!wallet) return NextResponse.json({ error: "Wallet not found." }, { status: 404 });

  const reference = "DEP-" + Date.now().toString(36).toUpperCase() + "-" + randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
  const tx = await db.walletTransaction.create({
    data: {
      walletId: wallet.id,
      userId: u.id,
      type: "DEPOSIT",
      amount,
      method: "Paystack",
      provider: "PAYSTACK",
      status: "PENDING",
      reference,
    },
  });

  try {
    const origin = new URL(req.url).origin;
    const payment = await initializePaystack({
      email: u.email,
      amount,
      reference,
      callbackUrl: `${origin}/api/payments/paystack/callback`,
    });
    return NextResponse.json({
      ok: true,
      authorizationUrl: payment.authorization_url,
      reference: payment.reference,
      transactionId: tx.id,
    });
  } catch (error) {
    await db.walletTransaction.update({
      where: { id: tx.id },
      data: { status: "FAILED", providerStatus: "INITIALIZATION_FAILED" },
    });
    const message = error instanceof Error ? error.message : "Could not initialize payment.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
