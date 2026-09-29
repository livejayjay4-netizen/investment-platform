import {NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {db} from "../../../../lib/prisma";
import {setSession} from "../../../../lib/auth";

export async function POST(request:Request){
  try{
    const body=await request.json();
    const fullName=typeof body?.fullName==="string"?body.fullName.trim():"";
    const email=typeof body?.email==="string"?body.email.trim().toLowerCase():"";
    const password=typeof body?.password==="string"?body.password:"";

    if(fullName.length<2||fullName.length>100||!/^\S+@\S+\.\S+$/.test(email)||password.length<8||password.length>128){
      return NextResponse.json({error:"Enter a valid name, email, and password of 8-128 characters."},{status:400});
    }

    const existing=await db.user.findUnique({where:{email}});
    if(existing)return NextResponse.json({error:"Email already registered."},{status:409});

    const passwordHash=await bcrypt.hash(password,12);
    const user=await db.user.create({
      data:{
        fullName,
        email,
        passwordHash,
        wallet:{create:{}}
      }
    });

    await setSession(user.id);
    return NextResponse.json({ok:true});
  }catch(error){
    console.error("Registration error",error);
    if(typeof error==="object"&&error!==null&&"code" in error&&(error as {code?:string}).code==="P2002"){
      return NextResponse.json({error:"Email already registered."},{status:409});
    }
    return NextResponse.json({error:"Unable to create your account right now. Please try again."},{status:500});
  }
}