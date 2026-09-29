import {cookies} from "next/headers";
import {jwtVerify,SignJWT} from "jose";
import {db} from "./prisma";

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  }
  return new TextEncoder().encode(value);
}

export async function setSession(userId:string){
  const token=await new SignJWT({userId})
    .setProtectedHeader({alg:"HS256"})
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
  (await cookies()).set("session",token,{
    httpOnly:true,
    sameSite:"lax",
    secure:process.env.NODE_ENV==="production",
    maxAge:604800,
    path:"/"
  });
}

export async function getUser(){
  const token=(await cookies()).get("session")?.value;
  if(!token)return null;
  try{
    const {payload}=await jwtVerify(token,getSecret());
    if(typeof payload.userId!=="string")return null;
    return db.user.findUnique({where:{id:payload.userId}});
  }catch{return null}
}

export async function clearSession(){
  (await cookies()).delete("session")
}