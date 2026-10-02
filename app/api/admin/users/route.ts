import {NextResponse} from "next/server";
import {db} from "../../../../lib/prisma";
import {getAdminUser} from "../../../../lib/admin-auth";
const roles=["USER","ADMIN","FINANCE_ADMIN","MARKET_ADMIN","SUPPORT_ADMIN","READ_ONLY_ADMIN"];
const noStore=(b:unknown,s=200)=>NextResponse.json(b,{status:s,headers:{"Cache-Control":"no-store"}});
export async function GET(request:Request){
 const admin=await getAdminUser(); if(!admin)return noStore({error:"Administrator authentication required."},401);
 const {searchParams}=new URL(request.url); const q=(searchParams.get("q")||"").trim(); const status=searchParams.get("status")||"";
 const users=await db.user.findMany({where:{AND:[q?{OR:[{fullName:{contains:q,mode:"insensitive"}},{email:{contains:q,mode:"insensitive"}}]}:{},status?{status}:{}]},select:{id:true,fullName:true,email:true,role:true,status:true,totpEnabled:true,createdAt:true,updatedAt:true,wallet:{select:{balance:true,availableBalance:true}}},orderBy:{createdAt:"desc"},take:200});
 return noStore({users});
}
export async function PATCH(request:Request){
 const admin=await getAdminUser(); if(!admin)return noStore({error:"Administrator authentication required."},401);
 const body=await request.json().catch(()=>null); const id=typeof body?.id==="string"?body.id:"";
 if(!id)return noStore({error:"User id is required."},400);
 const data:any={};
 if(typeof body.fullName==="string"&&body.fullName.trim().length>=2)data.fullName=body.fullName.trim();
 if(typeof body.email==="string"&&/^\S+@\S+\.\S+$/.test(body.email.trim()))data.email=body.email.trim().toLowerCase();
 if(typeof body.status==="string"&&["ACTIVE","SUSPENDED","LOCKED"].includes(body.status))data.status=body.status;
 if(typeof body.role==="string"&&roles.includes(body.role)&&admin.role==="ADMIN")data.role=body.role;
 if(!Object.keys(data).length)return noStore({error:"No permitted changes supplied."},400);
 const before=await db.user.findUnique({where:{id}});
 if(!before)return noStore({error:"User not found."},404);
 if(id===admin.id&&data.status&&data.status!=="ACTIVE")return noStore({error:"You cannot deactivate your own administrator account."},400);
 const user=await db.user.update({where:{id},data});
 await db.auditLog.create({data:{actorId:admin.id,action:"ADMIN_UPDATE_USER",targetType:"User",targetId:id,metadata:JSON.stringify({changed:Object.keys(data),before:{email:before.email,status:before.status,role:before.role},after:{email:user.email,status:user.status,role:user.role}})}});
 return noStore({ok:true,user:{id:user.id,fullName:user.fullName,email:user.email,role:user.role,status:user.status}});
}