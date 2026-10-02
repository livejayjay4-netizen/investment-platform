import {NextResponse} from "next/server";
import {db} from "../../../../lib/prisma";
import {getAdminUser} from "../../../../lib/admin-auth";

const roles=["USER","ADMIN","FINANCE_ADMIN","MARKET_ADMIN","SUPPORT_ADMIN","READ_WRITE_ADMIN"];
const statuses=["ACTIVE","SUSPENDED","LOCKED"];
const noStore=(b:unknown,s=200)=>NextResponse.json(b,{status:s,headers:{"Cache-Control":"no-store"}});

export async function GET(request:Request){
 try{
  const admin=await getAdminUser();
  if(!admin)return noStore({error:"Administrator authentication required."},401);
  const {searchParams}=new URL(request.url);
  const q=(searchParams.get("q")||"").trim();
  const status=searchParams.get("status")||"";
  const role=searchParams.get("role")||"";
  const where:any={AND:[
   q?{OR:[{fullName:{contains:q,mode:"insensitive"}},{email:{contains:q,mode:"insensitive"}}]}:{},
   status&&statuses.includes(status)?{status}:{},
   role&&roles.includes(role)?{role}:{}
  ]};
  const [users,total,customers,admins]=await Promise.all([
   db.user.findMany({where,select:{id:true,fullName:true,email:true,role:true,status:true,totpEnabled:true,createdAt:true,updatedAt:true,wallet:{select:{balance:true,availableBalance:true}}},orderBy:{createdAt:"desc"},take:200}),
   db.user.count(),
   db.user.count({where:{role:"USER"}}),
   db.user.count({where:{role:{not:"USER"}}})
  ]);
  return noStore({users,counts:{total,customers,admins},viewer:{id:admin.id,role:admin.role}});
 }catch(error){
  console.error("Admin users GET failed",error);
  return noStore({error:"Unable to load user accounts from the database."},500);
 }
}

export async function PATCH(request:Request){
 try{
  const admin=await getAdminUser();
  if(!admin)return noStore({error:"Administrator authentication required."},401);
  const body=await request.json().catch(()=>null);
  const id=typeof body?.id==="string"?body.id:"";
  if(!id)return noStore({error:"User id is required."},400);
  const data:any={};
  if(typeof body.fullName==="string"&&body.fullName.trim().length>=2)data.fullName=body.fullName.trim();
  if(typeof body.email==="string"&&/^\S+@\S+\.\S+$/.test(body.email.trim()))data.email=body.email.trim().toLowerCase();
  if(typeof body.status==="string"&&statuses.includes(body.status))data.status=body.status;
  if(typeof body.role==="string"&&roles.includes(body.role)&&admin.role==="ADMIN")data.role=body.role;
  if(!Object.keys(data).length)return noStore({error:"No permitted changes supplied."},400);
  const before=await db.user.findUnique({where:{id}});
  if(!before)return noStore({error:"User not found."},404);
  if(id===admin.id&&data.status&&data.status!=="ACTIVE")return noStore({error:"You cannot deactivate your own administrator account."},400);
  const user=await db.user.update({where:{id},data});
  await db.auditLog.create({data:{actorId:admin.id,action:"ADMIN_UPDATE_USER",targetType:"User",targetId:id,metadata:JSON.stringify({changed:Object.keys(data),before:{email:before.email,status:before.status,role:before.role},after:{email:user.email,status:user.status,role:user.role}})}});
  return noStore({ok:true,user:{id:user.id,fullName:user.fullName,email:user.email,role:user.role,status:user.status}});
 }catch(error:any){
  console.error("Admin users PATCH failed",error);
  if(error?.code==="P2002")return noStore({error:"That email address is already in use."},409);
  return noStore({error:"Unable to update this user account."},500);
 }
}