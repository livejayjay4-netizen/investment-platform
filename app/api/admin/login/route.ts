import {NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {db} from "../../../../lib/prisma";
import {createAdminChallenge} from "../../../../lib/admin-auth";

const noStore=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});

export async function POST(request:Request){
  try{
    const b=await request.json().catch(()=>null);
    const email=typeof b?.email==="string"?b.email.trim().toLowerCase():"";
    const password=typeof b?.password==="string"?b.password:"";
    if(!email||!password)return noStore({error:"Email and password are required."},400);

    const user=await db.user.findFirst({where:{email:{equals:email,mode:"insensitive"}}});
    const adminRoles=["ADMIN","FINANCE_ADMIN","MARKET_ADMIN","SUPPORT_ADMIN","READ_ONLY_ADMIN"];
    const valid=!!user&&user.status==="ACTIVE"&&adminRoles.includes(user.role)&&await bcrypt.compare(password,user.passwordHash);
    if(!valid)return noStore({error:"Invalid administrator credentials."},401);

    if(user.totpEnabled&&user.totpSecret){
      await createAdminChallenge(user.id,"LOGIN");
      return noStore({requires2fa:true});
    }

    await createAdminChallenge(user.id,"SETUP");
    return noStore({setup2fa:true});
  }catch(e){
    console.error("Admin login error",e);
    return noStore({error:"Unable to start administrator sign-in."},500);
  }
}