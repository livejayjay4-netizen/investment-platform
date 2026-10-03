import {NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {db} from "../../../../../lib/prisma";
import {getAdminUser} from "../../../../../lib/admin-auth";
const noStore=(b:unknown,s=200)=>NextResponse.json(b,{status:s,headers:{"Cache-Control":"no-store"}});
export async function GET(_request:Request,ctx:{params:Promise<{id:string}>}){
 const admin=await getAdminUser(); if(!admin)return noStore({error:"Administrator authentication required."},401);
 const {id}=await ctx.params;
 const u=await db.user.findUnique({where:{id}});
 if(!u)return noStore({error:"User not found."},404);
 const [wallet,transactions,orders,holdings,tickets,sessions,adminSessions]=await Promise.all([
  db.wallet.findUnique({where:{userId:id}}),
  db.walletTransaction.findMany({where:{userId:id},orderBy:{createdAt:"desc"},take:50}),
  db.order.findMany({where:{userId:id},include:{stock:true},orderBy:{createdAt:"desc"},take:50}),
  db.holding.findMany({where:{userId:id},include:{stock:true}}),
  db.supportTicket.findMany({where:{userId:id},orderBy:{createdAt:"desc"},take:30}),
  db.session.findMany({where:{userId:id},orderBy:{createdAt:"desc"}}),
  db.adminSession.findMany({where:{userId:id},orderBy:{createdAt:"desc"}})
 ]);
 const walletView = wallet ? {id:wallet.id,balance:Number(wallet.balance),availableBalance:Number(wallet.availableBalance)} : null;
 const user={id:u.id,fullName:u.fullName,email:u.email,role:u.role,status:u.status,totpEnabled:u.totpEnabled,createdAt:u.createdAt,updatedAt:u.updatedAt,
  wallet:walletView,
  transactions:transactions.map(t=>({id:t.id,type:t.type,amount:Number(t.amount),fee:Number(t.fee),status:t.status,method:t.method,reference:t.reference,createdAt:t.createdAt})),
  orders:orders.map(o=>({id:o.id,side:o.side,quantity:Number(o.quantity),price:Number(o.price),total:Number(o.total),status:o.status,createdAt:o.createdAt,stock:o.stock?{symbol:o.stock.symbol,name:o.stock.name}:null})),
  holdings:holdings.map(h=>({id:h.id,quantity:Number(h.quantity),averagePrice:Number(h.averagePrice),updatedAt:h.updatedAt,stock:h.stock?{symbol:h.stock.symbol,name:h.stock.name}:null})),
  tickets,
  sessions:sessions.map(s=>({id:s.id,createdAt:s.createdAt,expiresAt:s.expiresAt})),
  adminSessions:adminSessions.map(s=>({id:s.id,createdAt:s.createdAt,expiresAt:s.expiresAt}))
 };
 return noStore({user,viewer:{id:admin.id,role:admin.role}});
}
export async function PATCH(request:Request,ctx:{params:Promise<{id:string}>}){
 const admin=await getAdminUser(); if(!admin)return noStore({error:"Administrator authentication required."},401);
 const {id}=await ctx.params; const body=await request.json().catch(()=>null); const u=await db.user.findUnique({where:{id}});
 if(!u)return noStore({error:"User not found."},404);
 const action=body?.action;\n if(!action){\n  const data:any={};\n  if(typeof body?.fullName==="string"&&body.fullName.trim().length>=2)data.fullName=body.fullName.trim();\n  if(typeof body?.email==="string"&&/^\\S+@\\S+\\.\\S+$/.test(body.email.trim()))data.email=body.email.trim().toLowerCase();\n  if(typeof body?.status==="string"&&["ACTIVE","SUSPENDED","LOCKED"].includes(body.status))data.status=body.status;\n  if(typeof body?.role==="string"&&["USER","ADMIN","FINANCE_ADMIN","MARKET_ADMIN","SUPPORT_ADMIN","READ_WRITE_ADMIN"].includes(body.role)&&admin.role==="ADMIN")data.role=body.role;\n  if(!Object.keys(data).length)return noStore({error:"No permitted account changes supplied."},400);\n  if(id===admin.id&&data.status&&data.status!=="ACTIVE")return noStore({error:"You cannot deactivate your own administrator account."},400);\n  const before=await db.user.findUnique({where:{id}});\n  if(!before)return noStore({error:"User not found."},404);\n  try{const updated=await db.user.update({where:{id},data});await db.auditLog.create({data:{actorId:admin.id,action:"ADMIN_UPDATE_USER",targetType:"User",targetId:id,metadata:JSON.stringify({changed:Object.keys(data),before:{email:before.email,status:before.status,role:before.role},after:{email:updated.email,status:updated.status,role:updated.role}})}});return noStore({ok:true,message:"Account changes saved.",user:{id:updated.id,fullName:updated.fullName,email:updated.email,role:updated.role,status:updated.status}})}catch(error:any){if(error?.code==="P2002")return noStore({error:"That email address is already in use."},409);return noStore({error:"Unable to update this user account."},500)}\n }
 if(action==="reset-password"){
  if(!["ADMIN","SUPPORT_ADMIN"].includes(admin.role))return noStore({error:"Not authorized to reset passwords."},403);
  const p=typeof body.password==="string"?body.password:""; if(p.length<8||p.length>128)return noStore({error:"Password must be 8-128 characters."},400);
  await db.user.update({where:{id},data:{passwordHash:await bcrypt.hash(p,12)}});
  await db.session.deleteMany({where:{userId:id}});
  await db.auditLog.create({data:{actorId:admin.id,action:"ADMIN_RESET_PASSWORD",targetType:"User",targetId:id}});
  return noStore({ok:true,message:"Password reset and customer sessions revoked."});
 }
 if(action==="revoke-sessions"){
  await db.session.deleteMany({where:{userId:id}}); await db.adminSession.deleteMany({where:{userId:id}});
  await db.auditLog.create({data:{actorId:admin.id,action:"ADMIN_REVOKE_SESSIONS",targetType:"User",targetId:id}});
  return noStore({ok:true,message:"All sessions revoked."});
 }
 if(action==="reset-2fa"){
  if(!["ADMIN","SUPPORT_ADMIN"].includes(admin.role))return noStore({error:"Not authorized to reset 2FA."},403);
  await db.user.update({where:{id},data:{totpEnabled:false,totpSecret:null}}); await db.adminSession.deleteMany({where:{userId:id}});
  await db.auditLog.create({data:{actorId:admin.id,action:"ADMIN_RESET_2FA",targetType:"User",targetId:id}});
  return noStore({ok:true,message:"2FA reset. Re-enrollment is required for admin access."});
 }
 if(action==="wallet-adjust"){
  if(!["ADMIN","FINANCE_ADMIN"].includes(admin.role))return noStore({error:"Finance authorization required."},403);
  const amount=Number(body.amount); const note=typeof body.note==="string"?body.note.slice(0,500):"";
  if(!Number.isFinite(amount)||amount===0||Math.abs(amount)>100000000)return noStore({error:"Enter a valid non-zero amount."},400);
  const wallet=await db.wallet.upsert({where:{userId:id},create:{userId:id,balance:0,availableBalance:0},update:{}});
  const newBalance=Number(wallet.balance)+amount; const newAvailable=Number(wallet.availableBalance)+amount;
  if(newBalance<0||newAvailable<0)return noStore({error:"Adjustment would create a negative balance."},400);
  const reference="ADMIN-"+Date.now()+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
  const result=await db.$transaction(async tx=>{
   const w=await tx.wallet.update({where:{id:wallet.id},data:{balance:newBalance,availableBalance:newAvailable}});
   await tx.walletTransaction.create({data:{walletId:wallet.id,userId:id,type:amount>0?"DEPOSIT":"WITHDRAWAL",amount:Math.abs(amount),status:"COMPLETED",method:"ADMIN_ADJUSTMENT",reference}});
   await tx.auditLog.create({data:{actorId:admin.id,action:"ADMIN_WALLET_ADJUSTMENT",targetType:"User",targetId:id,metadata:JSON.stringify({amount,note,reference,before:Number(wallet.balance),after:newBalance})}});
   return w;
  });
  return noStore({ok:true,balance:Number(result.balance),availableBalance:Number(result.availableBalance),reference});
 }
 if(action==="cancel-order"){
  if(!["ADMIN","MARKET_ADMIN"].includes(admin.role))return noStore({error:"Market authorization required."},403);
  const orderId=typeof body.orderId==="string"?body.orderId:""; const order=await db.order.findFirst({where:{id:orderId,userId:id}});
  if(!order)return noStore({error:"Order not found."},404);
  await db.order.update({where:{id:order.id},data:{status:"CANCELLED"}});
  await db.auditLog.create({data:{actorId:admin.id,action:"ADMIN_CANCEL_ORDER",targetType:"Order",targetId:order.id,metadata:JSON.stringify({userId:id})}});
  return noStore({ok:true,message:"Order cancelled."});
 }
 return noStore({error:"Unknown admin action."},400);
}