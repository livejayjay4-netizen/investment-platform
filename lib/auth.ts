import {cookies} from "next/headers";
import {createHash,randomBytes} from "crypto";
import {db} from "./prisma";

const COOKIE="session";
const SESSION_DAYS=7;
const MAX_AGE=SESSION_DAYS*24*60*60;

function hashToken(token:string){
  return createHash("sha256").update(token).digest("hex");
}

export async function setSession(userId:string){
  const token=randomBytes(32).toString("hex");
  const expiresAt=new Date(Date.now()+MAX_AGE*1000);

  await db.session.deleteMany({
    where:{expiresAt:{lt:new Date()}}
  });

  await db.session.create({
    data:{userId,tokenHash:hashToken(token),expiresAt}
  });

  (await cookies()).set(COOKIE,token,{
    httpOnly:true,
    sameSite:"lax",
    secure:process.env.NODE_ENV==="production",
    maxAge:MAX_AGE,
    path:"/"
  });
}

export async function getUser(){
  const token=(await cookies()).get(COOKIE)?.value;
  if(!token)return null;

  const session=await db.session.findUnique({
    where:{tokenHash:hashToken(token)},
    include:{user:true}
  });

  if(!session)return null;

  if(session.expiresAt.getTime()<=Date.now()){
    await db.session.delete({where:{id:session.id}}).catch(()=>{});
    return null;
  }

  if(session.user.status!=="ACTIVE")return null;
  return session.user;
}

export async function clearSession(){
  const token=(await cookies()).get(COOKIE)?.value;
  if(token){
    await db.session.deleteMany({where:{tokenHash:hashToken(token)}});
  }
  (await cookies()).set(COOKIE,"",{
    httpOnly:true,
    sameSite:"lax",
    secure:process.env.NODE_ENV==="production",
    maxAge:0,
    expires:new Date(0),
    path:"/"
  });
}