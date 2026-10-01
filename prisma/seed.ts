import {PrismaClient,Role} from "@prisma/client";
import bcrypt from "bcryptjs";

const db=new PrismaClient();

async function main(){
  const pw=process.env.ADMIN_PASSWORD;
  if(!pw)throw new Error("ADMIN_PASSWORD required");
  const email=(process.env.ADMIN_EMAIL||"admin@example.com").trim().toLowerCase();
  const hash=await bcrypt.hash(pw,12);

  const resetAdmin2FA=process.env.RESET_ADMIN_2FA==="true";
  await db.user.upsert({
    where:{email},
    update:{passwordHash:hash,role:Role.ADMIN,...(resetAdmin2FA?{totpSecret:null,totpEnabled:false}:{})},
    create:{email,fullName:"Platform Administrator",passwordHash:hash,role:Role.ADMIN,wallet:{create:{}}}
  });

  const rows=[
    ["AAPL","Apple",226.96,.84],["META","Meta Platforms",746.98,1.21],["TSLA","Tesla",442.79,-.42],
    ["GOOGL","Alphabet",256.09,.64],["NVDA","NVIDIA",185.48,1.34],["JPM","JPMorgan Chase",310.45,.37],
    ["JNJ","Johnson & Johnson",175.12,-.18],["MSFT","Microsoft",510.78,.92],["AMZN","Amazon",231.45,.58],
    ["NFLX","Netflix",1194.3,.73]
  ];
  for(const x of rows){
    await db.stock.upsert({
      where:{symbol:x[0] as string},
      update:{name:x[1] as string,price:Number(x[2]),changePercent:Number(x[3])},
      create:{symbol:x[0] as string,name:x[1] as string,price:Number(x[2]),changePercent:Number(x[3])}
    });
  }

  const products=[
    {name:"Tesla Model 3",slug:"tesla-model-3",brand:"Tesla",category:"Electric Vehicles",description:"Tesla compact electric sedan.",price:38630,currency:"USD",imageUrl:"https://commons.wikimedia.org/wiki/Special:FilePath/Tesla%20Model%203%20Highland%20RWD%20Pearl%20White%20Multi-Coat%2001.jpg",sourceUrl:"https://www.tesla.com/model3",imageCredit:"Wikimedia Commons",imageLicense:"CC BY-SA",priceLabel:"Starting at $38,630",featured:true},
    {name:"Tesla Model Y",slug:"tesla-model-y",brand:"Tesla",category:"Electric Vehicles",description:"Tesla electric midsize SUV/crossover.",price:39990,currency:"USD",imageUrl:"https://commons.wikimedia.org/wiki/Special:FilePath/Tesla%20Model%20Y%20%28Facelift%29%20%E2%80%93%20f%2005052026.jpg",sourceUrl:"https://www.tesla.com/modely",imageCredit:"Wikimedia Commons",imageLicense:"CC BY-SA",priceLabel:"From $39,990",featured:true},
    {name:"Tesla Model S",slug:"tesla-model-s",brand:"Tesla",category:"Electric Vehicles",description:"Tesla premium electric sedan. Pricing varies by configuration and market.",price:null,currency:"USD",imageUrl:"https://commons.wikimedia.org/wiki/Special:FilePath/Tesla%20Model%20S.jpg",sourceUrl:"https://www.tesla.com/models",imageCredit:"Wikimedia Commons",imageLicense:"CC BY-SA",priceLabel:"Check current Tesla pricing",featured:true},
    {name:"Tesla Model X",slug:"tesla-model-x",brand:"Tesla",category:"Electric Vehicles",description:"Tesla electric SUV with falcon-wing doors. Pricing varies by configuration and market.",price:null,currency:"USD",imageUrl:"https://commons.wikimedia.org/wiki/Special:FilePath/Tesla%20Model%20X.jpg",sourceUrl:"https://www.tesla.com/modelx",imageCredit:"Wikimedia Commons",imageLicense:"CC BY-SA",priceLabel:"Check current Tesla pricing"},
    {name:"Tesla Cybertruck",slug:"tesla-cybertruck",brand:"Tesla",category:"Electric Trucks",description:"Tesla stainless-steel electric pickup truck.",price:null,currency:"USD",imageUrl:"https://commons.wikimedia.org/wiki/Special:FilePath/Tesla%20cybertruck.jpg",sourceUrl:"https://www.tesla.com/cybertruck",imageCredit:"X120412 / Wikimedia Commons",imageLicense:"CC0",priceLabel:"Check current Tesla pricing",featured:true},
    {name:"Tesla Semi",slug:"tesla-semi",brand:"Tesla",category:"Electric Trucks",description:"Tesla all-electric Class 8 semi-trailer truck.",price:null,currency:"USD",imageUrl:"https://commons.wikimedia.org/wiki/Special:FilePath/Tesla%20Semi%201.jpg",sourceUrl:"https://www.tesla.com/semi",imageCredit:"Wikimedia Commons",imageLicense:"CC BY-SA",priceLabel:"Commercial pricing / availability"},
    {name:"Tesla Roadster",slug:"tesla-roadster",brand:"Tesla",category:"Electric Sports Cars",description:"Tesla all-electric sports car; availability and pricing are subject to Tesla updates.",price:null,currency:"USD",imageUrl:"https://commons.wikimedia.org/wiki/Special:FilePath/Tesla%20Roadster.JPG",sourceUrl:"https://www.tesla.com/roadster",imageCredit:"Thomas doerfer / Wikimedia Commons",imageLicense:"CC BY 3.0",priceLabel:"Reserve / check current pricing",featured:true}
  ];
  // Keep this catalog Tesla-only; remove legacy non-Tesla/Starlink inventory entries.
  await db.product.deleteMany({where:{brand:{not:"Tesla"}}});
  for(const p of products)await db.product.upsert({where:{slug:p.slug},update:p,create:p});
}

main().catch(e=>{console.error("Seed failed",e);process.exitCode=1}).finally(()=>db.$disconnect());