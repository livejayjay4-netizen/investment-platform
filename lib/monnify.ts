const DEFAULT_BASE_URL = "https://api.monnify.com";

type InitInput = { amount:number; email:string; name:string; reference:string; description:string; currency:string; redirectUrl:string };

function cfg(){
  const apiKey=process.env.MONNIFY_API_KEY;
  const secretKey=process.env.MONNIFY_SECRET_KEY;
  const contractCode=process.env.MONNIFY_CONTRACT_CODE;
  if(!apiKey||!secretKey||!contractCode) throw new Error("Monnify credentials are not configured. Add MONNIFY_API_KEY, MONNIFY_SECRET_KEY and MONNIFY_CONTRACT_CODE.");
  return {apiKey,secretKey,contractCode,base:(process.env.MONNIFY_BASE_URL||DEFAULT_BASE_URL).replace(/\/$/,"")};
}

async function token(){
  const c=cfg();
  const basic=Buffer.from(c.apiKey+":"+c.secretKey).toString("base64");
  const r=await fetch(c.base+"/api/v1/auth/login",{method:"POST",headers:{Authorization:"Basic "+basic,"Content-Type":"application/json"},cache:"no-store"});
  const d=await r.json().catch(()=>null);
  if(!r.ok||!d?.requestSuccessful||!d?.responseBody?.accessToken) throw new Error(d?.responseMessage||"Monnify authentication failed.");
  return {c,accessToken:d.responseBody.accessToken};
}

export async function initializeMonnify(input:InitInput){
  const {c,accessToken}=await token();
  const r=await fetch(c.base+"/api/v1/merchant/transactions/init-transaction",{method:"POST",headers:{Authorization:"Bearer "+accessToken,"Content-Type":"application/json"},body:JSON.stringify({amount:input.amount,customerEmail:input.email,paymentReference:input.reference,paymentDescription:input.description,currencyCode:input.currency,contractCode:c.contractCode,redirectUrl:input.redirectUrl,paymentMethods:input.currency==="USD"?["CARD"]:["CARD","ACCOUNT_TRANSFER","USSD","PHONE_NUMBER"],metadata:{reference:input.reference}}),cache:"no-store"});
  const d=await r.json().catch(()=>null);
  if(!r.ok||!d?.requestSuccessful||!d?.responseBody?.checkoutUrl) throw new Error(d?.responseMessage||"Monnify could not initialize the payment.");
  return d.responseBody as {checkoutUrl:string;transactionReference?:string;paymentReference?:string};
}

export async function verifyMonnify(reference:string){
  const {c,accessToken}=await token();
  const r=await fetch(c.base+"/api/v2/merchant/transactions/query?paymentReference="+encodeURIComponent(reference),{headers:{Authorization:"Bearer "+accessToken},cache:"no-store"});
  const d=await r.json().catch(()=>null);
  if(!r.ok||!d?.requestSuccessful||!d?.responseBody) throw new Error(d?.responseMessage||"Monnify verification failed.");
  return d.responseBody as {paymentReference:string;paymentStatus:string;amountPaid:number;totalPayable:number;currencyCode:string;transactionReference:string;paymentMethod:string};
}
