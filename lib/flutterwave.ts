const BASE_URL = "https://api.flutterwave.com/v3";

type FlutterwaveInitInput = {
  email: string;
  name: string;
  phone: string;
  amount: number;
  currency: string;
  reference: string;
  callbackUrl: string;
};

function secret() {
  const value = process.env.FLW_SECRET_KEY;
  if (!value) {
    throw new Error("FLW_SECRET_KEY is not configured.");
  }
  return value;
}

export async function initializeFlutterwave(input: FlutterwaveInitInput) {
  const response = await fetch(`${BASE_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      tx_ref: input.reference,
      currency: input.currency,
      redirect_url: input.callbackUrl,
      customer: {
        email: input.email,
        name: input.name,
        phone_number: input.phone,
      },
      customizations: {
        title: "Elite Auto Investment",
        description: "Secure product purchase",
      },
      meta: {
        reference: input.reference,
      },
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || data?.status !== "success" || !data?.data?.link) {
    throw new Error(data?.message || "Flutterwave could not initialize the payment.");
  }

  return data.data as { link: string; id?: number };
}

export async function verifyFlutterwaveByReference(reference: string) {
  const response = await fetch(
    `${BASE_URL}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secret()}`,
      },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || data?.status !== "success" || !data?.data) {
    throw new Error(data?.message || "Flutterwave verification failed.");
  }

  return data.data as {
    id: number;
    status: string;
    tx_ref: string;
    amount: number;
    currency: string;
  };
}
