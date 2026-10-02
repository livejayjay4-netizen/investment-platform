import {NextResponse} from "next/server";
import {getAdminChallenge,clearAdminChallenge,createAdminSession} from "../../../../lib/admin-auth";
import {generateTotpSecret,otpauthUri,verifyTotp} from "../../../../lib/totp";
import {db} from "../../../../lib/prisma";

const noStore=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});

export async function GET(){
  const c=await getAdminChallenge();
  if(!c||c.purpose!=="SETUP")return noStore({error:"Setup session expired. Start again."},401);
  let secret=c.pendingSecret;
  if(!secret){
    secret=generateTotpSecret();
    await db.adminChallenge.update({where:{id:c.id},data:{pendingSecret:secret}});
  }
  return noStore({email:c.user.email,secret,otpauth:otpauthUri(secret,c.user.email)});
}

export async function POST(request:Request){
  try{
    const c=await getAdminChallenge();
    if(!c||c.purpose!=="SETUP"||!c.pendingSecret)return noStore({error:"Setup session expired. Start again."},401);
    const b=await request.json().catch(()=>null);
    const code=String(b?.code||"").replace(/\D/g,"").slice(0,6);
    if(code.length!==6||!verifyTotp(c.pendingSecret,code))return noStore({error:"Invalid authentication code. Check your authenticator and try again."},401);
    await db.user.update({where:{id:c.user.id},data:{totpSecret:c.pendingSecret,totpEnabled:true}});
    await createAdminSession(c.user.id);
    await clearAdminChallenge();
    return noStore({ok:true});
  }catch(e){
    console.error("2FA setup error",e);
    return noStore({error:"Unable to finish two-factor setup."},500);
  }
}