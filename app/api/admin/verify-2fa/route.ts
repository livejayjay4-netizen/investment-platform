import {NextResponse} from "next/server";
import {getAdminChallenge,clearAdminChallenge,createAdminSession} from "../../../../lib/admin-auth";
import {verifyTotp} from "../../../../lib/totp";

const noStore=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});

export async function POST(request:Request){
  try{
    const c=await getAdminChallenge();
    if(!c||c.purpose!=="LOGIN"||!c.user.totpSecret)return noStore({error:"Administrator verification expired. Start again."},401);
    const b=await request.json().catch(()=>null);
    const code=String(b?.code||"").replace(/\D/g,"").slice(0,6);
    if(code.length!==6||!verifyTotp(c.user.totpSecret,code))return noStore({error:"Invalid authentication code."},401);
    await createAdminSession(c.user.id);
    await clearAdminChallenge();
    return noStore({ok:true});
  }catch(e){
    console.error("Admin 2FA verification error",e);
    return noStore({error:"Unable to verify administrator."},500);
  }
}