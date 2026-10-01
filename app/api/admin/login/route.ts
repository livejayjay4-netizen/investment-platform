import {NextResponse} from "next/server";import bcrypt from "bcryptjs";import {db} from "../../../../lib/prisma";import {createAdminChallenge} from "../../../../lib/admin-auth";
export async function POST(request:Request){
  try{
    const b=await request.json();
    const email=typeof b?.email==="string"?b.email.trim().toLowerCase():"";
    const password=typeof b?.password==="string"?b.password:"";
    if(!email||!password)return NextResponse.json({error:"Email and password are required."},{status:400});
    const user=await db.user.findFirst({where:{email:{equals:email,mode:"insensitive"}}});
    if(!user||user.status!=="ACTIVE"||user.role==="USER"||!(await bcrypt.compare(password,user.passwordHash)))return NextResponse.json({error:"Invalid administrator credentials."},{status:401});
    if(user.totpEnabled&&user.totpSecret){await createAdminChallenge(user.id,"LOGIN");return NextResponse.json({requires2fa:true});}
    await createAdminChallenge(user.id,"SETUP");return NextResponse.json({setup2fa:true});
  }catch(e){console.error("Admin login error",e);return NextResponse.json({error:"Unable to start administrator sign-in."},{status:500});}
}