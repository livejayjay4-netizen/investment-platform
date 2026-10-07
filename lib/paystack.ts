const BASE_URL = "https://api.paystack.co";

function secret() {
  const value = process.env.PAYSTACK_SECRET_KEY;
  if (!value) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return value;
}

export function paystackCurrency() {
  return (process.env.PAYSTACK_CURRENCY || "NGN").toUpperCase();
}

export async function initializePaystack(input: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
}) {
  const response = await fetch(`${BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100),
      currency: paystackCurrency(),
      reference: input.reference,
      callback_url: input.callbackUrl,
    }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.status || !data?.data?.authorization_url) {
    throw new Error(data?.message || "Paystack could not initialize the payment.");
  }
  return data.data as { authorization_url: string; access_code: string; reference: string };
}

export async function verifyPaystack(reference: string) {
  const response = await fetch(`${BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.status || !data?.data) {
    throw new Error(data?.message || "Paystack verification failed.");
  }
  return data.data as { id: number; status: string; reference: string; amount: number; currency: string };
}
