import {NextResponse} from "next/server";
import {db} from "../../../../../lib/prisma";
import {verifyMonnify} from "../../../../../lib/monnify";

export async function GET(req:Request){
 const u=new URL(req.url); const ref=u.searchParams.get("paymentReference")||u.searchParams.get("payment_reference");
 if(!ref)return NextResponse.redirect(new URL("/purchases?status=missing",req.url));
 try{
  const v=await verifyMonnify(ref); const p=await db.productPurchase.findFirst({where:{paymentReference:ref}});
  if(!p)return NextResponse.redirect(new URL("/purchases?status=not-found",req.url));
  const expected=Number(p.downPayment||p.amount);
  const valid=v.paymentStatus==="PAID"&&v.paymentReference===ref&&v.currencyCode===p.currency&&Number(v.amountPaid)>=expected;
  if(!valid){await db.productPurchase.update({where:{id:p.id},data:{paymentStatus:v.paymentStatus==="PAID"?"FAILED":String(v.paymentStatus).toUpperCase(),notes:"Monnify verification did not match the expected order amount or currency."}});return NextResponse.redirect(new URL("/purchases?status=failed",req.url));}
  await db.productPurchase.update({where:{id:p.id},data:{paymentStatus:"PAID",status:"REVIEWING",paymentReference:ref}});
  await db.auditLog.create({data:{actorId:p.userId,action:"PRODUCT_PAYMENT_CONFIRMED_MONNIFY",targetType:"ProductPurchase",targetId:p.id,metadata:JSON.stringify({reference:ref,amount:expected,currency:p.currency})}});
  return NextResponse.redirect(new URL("/purchases?status=paid",req.url));
 }catch(e){console.error("[Monnify callback]",e);return NextResponse.redirect(new URL("/purchases?status=error",req.url));}
}
