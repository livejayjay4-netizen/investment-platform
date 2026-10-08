import {NextResponse} from "next/server";
import {getUser} from "../../../../lib/auth";
import {db} from "../../../../lib/prisma";
import {initializeMonnify} from "../../../../lib/monnify";
import {randomUUID} from "crypto";

export async function POST(req:Request){
 const user=await getUser(); if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const isForm=req.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
 const b=isForm?Object.fromEntries(await req.formData()):await req.json().catch(()=>null);
 const productId=String(b?.productId||""),phone=String(b?.customerPhone||"").trim(),method=String(b?.deliveryMethod||"").trim(),address=String(b?.deliveryAddress||"").trim(),preferred=String(b?.preferredDate||"").trim();
 if(!productId||!phone||!method||!address)return NextResponse.json({error:"Phone, delivery method and delivery address are required."},{status:400});
 const p=await db.product.findFirst({where:{id:productId,active:true,brand:{in:["Tesla","Starlink"]},stockQuantity:{gt:0},availability:"AVAILABLE"}});
 if(!p||p.price===null)return NextResponse.json({error:"This product requires a quote and cannot be paid online yet."},{status:400});
 const payAmount=p.downPayment&&Number(p.downPayment)>0?Number(p.downPayment):Number(p.price);
 const reference="MON-"+randomUUID().replaceAll("-","").slice(0,20).toUpperCase();
 const purchase=await db.productPurchase.create({data:{reference,userId:user.id,productId:p.id,amount:p.price,downPayment:p.downPayment,currency:p.currency,status:"REQUESTED",paymentStatus:"UNPAID",customerPhone:phone,deliveryMethod:method,deliveryAddress:address,preferredDate:preferred?new Date(preferred):null,paymentReference:reference,paymentMethod:"MONNIFY"}});
 try{
  const origin=new URL(req.url).origin;
  const init=await initializeMonnify({amount:payAmount,email:user.email,name:user.fullName,reference,description:p.name,currency:p.currency,redirectUrl:origin+"/api/payments/monnify/purchase-callback"});
  return isForm?NextResponse.redirect(init.checkoutUrl):NextResponse.json({ok:true,authorizationUrl:init.checkoutUrl,reference,purchaseId:purchase.id,amount:payAmount});
 }catch(e){
  const message=e instanceof Error?e.message:"Could not initialize payment.";
  console.error("[Monnify purchase initialization]",message);
  await db.productPurchase.update({where:{id:purchase.id},data:{paymentStatus:"FAILED",notes:"Monnify initialization failed: "+message.slice(0,240)}});
  return NextResponse.json({error:"Unable to initialize Monnify payment.",detail:message},{status:502});
 }
}
