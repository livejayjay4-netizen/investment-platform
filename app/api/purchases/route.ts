import {NextResponse} from "next/server";
import {randomUUID} from "crypto";
import {getUser} from "../../../lib/auth";
import {db} from "../../../lib/prisma";

export async function GET(){
  const user=await getUser();
  if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
  const purchases=await db.productPurchase.findMany({where:{userId:user.id},include:{product:true},orderBy:{createdAt:"desc"}});
  return NextResponse.json({purchases});
}
export async function POST(req:Request){
  const user=await getUser();
  if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
  const body=await req.json().catch(()=>null);
  const productId=typeof body?.productId==="string"?body.productId:"";
  if(!productId)return NextResponse.json({error:"Product is required."},{status:400});
  const product=await db.product.findFirst({where:{id:productId,active:true}});
  if(!product)return NextResponse.json({error:"This product is no longer available."},{status:404});
  if(product.price===null)return NextResponse.json({error:"Price is not currently available. Contact support."},{status:400});
  const reference="PUR-"+randomUUID().replaceAll("-","").slice(0,18).toUpperCase();
  const purchase=await db.productPurchase.create({data:{reference,userId:user.id,productId:product.id,amount:product.price,downPayment:product.downPayment,currency:product.currency,status:"REQUESTED",paymentStatus:"UNPAID"}});
  return NextResponse.json({ok:true,purchase});
}