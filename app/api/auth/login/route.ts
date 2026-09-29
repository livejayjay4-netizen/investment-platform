import {NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {db} from "../../../../lib/prisma";
import {setSession} from "../../../../lib/auth";

export async function POST(request:Request){
  try{
    const body=await request.json();
    const email=typeof body?.email==="string"?body.email.trim().toLowerCase():"";
    const password=typeof body?.password==="string"?body.password:"";

    if(!email||!password)return NextResponse.json({error:"Email and password are required."},{status:400});

    const user=await db.user.findUnique({where:{email}});
    if(!user||user.status!=="ACTIVE"||!(await bcrypt.compare(password,user.passwordHash))){
      return NextResponse.json({error:"Invalid credentials."},{status:401});
    }

    await setSession(user.id);
    return NextResponse.json({ok:true});
  }catch(error){
    console.error("Login error",error);
    return NextResponse.json({error:"Unable to sign in right now. Please try again."},{status:500});
  }
}