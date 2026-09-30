import {NextResponse} from "next/server";
import {clearSession} from "../../../../lib/auth";

async function logout(){
  await clearSession();
  return NextResponse.redirect(new URL("/login",process.env.NEXT_PUBLIC_APP_URL||"https://investment-platform-taxr.onrender.com"));
}

export async function GET(){return logout();}
export async function POST(){return logout();}