import {NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {db} from "../../../../../lib/prisma";
import {getAdminUser} from "../../../../../lib/admin-auth";
const noStore=(b:unknown,s=200)=>NextResponse.json(b,{status:s,headers:{"Cache-Control":"no-store"}});
const roles=["USER","ADMIN","FINANCE_ADMIN","MARKET_ADMIN","SUPPORT_ADMIN","READ_ONLY_ADMIN"];
export async function GET(_r:Request,{params}:{params:{id:string}}){
 const admin=await getAdminUser(); if(!admin)return noStore({error:"Administrator authentication required."},401);
 const u=await db.user.findUnique({where:{id:params.id},include:{wallet:true,transactions:{orderBy:{createdAt:"desc"},take:50},orders:{include:{stock:true},orderBy:{createdAt:"desc"},take:50},holdings:{include:{stock:true}},tickets:{orderBy:{createdAt:"desc"},take:30},sessions:{orderBy:{createdAt:"desc"}},adminSessions:{orderBy:{createdAt:"desc"}}});
 if(!u)return noStore({error:"User not found."},404);
 return noStore({user:{id:u.id,fullName:u.fullName,email:u.email,role:u.role,status:u.status,totpEnabled:u.totpEnabled,createdAt:u.createdAt,updatedAt:u.updatedAt,wallet:u.wallet?{id:u.wallet.id,balance:u.wallet.balance,availableBalance:u.wallet.availableBalance}:null,transactions:u.transactions,orders:u.orders,holdings:u.holdings,tickets:u.tickets,sessions:u.sessions.map(s=>({id:s.id,createdAt:s.createdAt,expiresAt:s.expiresAt})),adminSessions:u.adminSessions.map(s=>({id:s.id,createdAt:s.createdAt,expiresAt:s.expiresAt}))}});
}
export async function PATCH(request:Request,{params}:{params:{id:string}}){
 const admin=await getAdminUser(); if(!admin)return noStore({error:"Administrator authentication required."},401);
 const body=await request.json().catch(()=>null); const u=await db.user.findUnique({where:{id:params.id}});
 if(!u)return noStore({error:"User not found."},404);
 const action=body?.action;
 if(action==="reset-password"){
   if(admin.role!=="ADMIN"&&admin.role!=="SUPPORT_ADMIN")return noStore({error:"Not authorized to reset passwords."},403);
   const p=typeof body.password==="string"?body.password:""; if(p.length<8||p.length>128)return noStore({error:"Password must be 8-128 characters."},400);
   await db.user.update({where:{id:u.id},data:{passwordHash:await bcrypt.hash(p,12)}});
   await db.session.deleteMany({where:{userId:u.id}});
   await db.auditLog.create({data:{actorId:admin.id,action:"ADMIN_RESET_PASSWORD",targetType:"User",targetId:u.id}});
   return noStore({ok:true,message:"Password reset and customer sessions revoked."});
 }
 if(action==="revoke-sessions"){
   await db.session.deleteMany({where:{userId:u.id}});
   await db.adminSession.deleteMany({where:{userId:u.id}});
   await db.auditLog.create({data:{actorId:admin.id,action:"ADMIN_REVOKE_SESSIONS",targetType:"User",targetId:u.id}});
   return noStore({ok:true});
 }
 if(action==="reset-2fa"){
   if(admin.role!=="ADMIN"&&admin.role!=="SUPPORT_ADMIN")return noStore({error:"Not authorized to reset 2FA."},403);
   await db.user.update({where:{id:u.id},data:{totpEnabled:false,totpSecret:null}});
   await db.adminSession.deleteMany({where:{userId:u.id}});
   await db.auditLog.create({data:{actorId:admin.id,action:"ADMIN_RESET_2FA",targetType:"User",targetId:u.id}});
   return noStore({ok:true,message:"2FA reset. The administrator can enroll again at next admin sign-in."});
 }
 if(action==="wallet-adjust"){
   if(!["ADMIN","FINANCE_ADMIN"].includes(admin.role))return noStore({error:"Finance authorization required."},403);
   const amount=Number(body.amount); const type=String(body.type||"ADJUSTMENT"); const note=typeof body.note==="string"?body.note.slice(0,500):"";
   if(!Number.isFinite(amount)||amount===0||Math.abs(amount)>100000000)return noStore({error:"Enter a valid non-zero amount."},400);
   const wallet=await db.wallet.upsert({where:{userId:u.id},create:{userId:u.id,balance:0,availableBalance:0},update:{}});
   const newBalance=Number(wallet.balance)+amount, newAvailable=Number(wallet.availableBalance)+amount;
   if(newBalance<0||newAvailable<0)return noStore({error:"Adjustment would create a negative balance."},400);
   const reference="ADMIN-"+Date.now()+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
   const result=await db.$transaction(async tx=>{
     const w=await tx.wallet.update({where:{id:wallet.id},data:{balance:newBalance,availableBalance:newAvailable}});
     await tx.walletTransaction.create({data:{walletId:wallet.id,userId:u.id,type:["DEPOSIT","WITHDRAWAL","ADJUSTMENT","FEE","PROFIT"].includes(type)?type:"ADJUSTMENT",amount:Math.abs(amount),status:"COMPLETED",method:"ADMIN_ADJUSTMENT",reference,}});
     await tx.auditLog.create({data:{actorId:admin.id,action:"ADMIN_WALLET_ADJUSTMENT",targetType:"User",targetId:u.id,metadata:JSON.stringify({amount,type,note,reference,before:Number(wallet.balance),after:newBalance})}});
     return w;
   });
   return noStore({ok:true,balance:result.balance,availableBalance:result.availableBalance,reference});
 }
 if(action==="cancel-order"){
   if(!["ADMIN","MARKET_ADMIN"].includes(admin.role))return noStore({error:"Market authorization required."},403);
   const orderId=typeof body.orderId==="string"?body.orderId:""; const order=await db.order.findFirst({where:{id:orderId,userId:u.id}});
   if(!order)return noStore({error:"Order not found."},404);
   await db.order.update({where:{id:order.id},data:{status:"CANCELLED"}});
   await db.auditLog.create({data:{actorId:admin.id,action:"ADMIN_CANCEL_ORDER",targetType:"Order",targetId:order.id,metadata:JSON.stringify({userId:u.id})}});
   return noStore({ok:true});
 }
 return noStore({error:"Unknown admin action."},400);
}