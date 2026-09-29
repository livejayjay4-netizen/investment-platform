import {NextResponse} from "next/server";
import {cookies} from "next/headers";

async function logout(){
  (await cookies()).set("session","",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:0,path:"/"});
  return NextResponse.redirect(new URL("/login",process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000"));
}

export async function GET(){return logout();}
export async function POST(){return logout();}