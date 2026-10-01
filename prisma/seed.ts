import {PrismaClient,Role} from "@prisma/client";
import bcrypt from "bcryptjs";

const db=new PrismaClient();

async function main(){
  const pw=process.env.ADMIN_PASSWORD;
  if(!pw)throw new Error("ADMIN_PASSWORD required");
  const email=(process.env.ADMIN_EMAIL||"admin@example.com").trim().toLowerCase();
  const hash=await bcrypt.hash(pw,12);

  await db.user.upsert({
    where:{email},
    update:{passwordHash:hash,role:Role.ADMIN},
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
    {name:"Tesla Model 3",slug:"tesla-model-3",brand:"Tesla",category:"Electric Vehicles",description:"Tesla's compact electric sedan. Reference product listing with price sourced from Tesla's U.S. Model 3 page.",price:38630,currency:"USD",imageUrl:"https://commons.wikimedia.org/wiki/Special:FilePath/Tesla%20Model%203%20Highland%20RWD%20Pearl%20White%20Multi-Coat%2001.jpg",sourceUrl:"https://www.tesla.com/model3",imageCredit:"Ethan Llamas / Wikimedia Commons",imageLicense:"CC BY-SA",priceLabel:"Starting at $38,630"},
    {name:"Tesla Model Y",slug:"tesla-model-y",brand:"Tesla",category:"Electric Vehicles",description:"Tesla's electric SUV/crossover. Reference product listing with price sourced from Tesla's U.S. configurator.",price:39990,currency:"USD",imageUrl:"https://commons.wikimedia.org/wiki/Special:FilePath/Tesla%20Model%20Y%20%28Facelift%29%20%E2%80%93%20f%2005052026.jpg",sourceUrl:"https://www.tesla.com/modely",imageCredit:"M 93 / Wikimedia Commons",imageLicense:"CC BY-SA 3.0 DE",priceLabel:"From $39,990"},
    {name:"Tesla Model S",slug:"tesla-model-s",brand:"Tesla",category:"Electric Vehicles",description:"Tesla Model S reference listing. Price is configuration and market dependent; verify with Tesla before purchase.",price:null,currency:"USD",imageUrl:"https://commons.wikimedia.org/wiki/Special:FilePath/Tesla%20Model%20S.jpg",sourceUrl:"https://www.tesla.com/models",imageCredit:"mark.warren / Wikimedia Commons",imageLicense:"CC BY-SA 2.5",priceLabel:"Check current Tesla pricing"},
    {name:"Tesla Model X",slug:"tesla-model-x",brand:"Tesla",category:"Electric Vehicles",description:"Tesla Model X reference listing. Price is configuration and market dependent; verify with Tesla before purchase.",price:null,currency:"USD",imageUrl:"https://commons.wikimedia.org/wiki/Special:FilePath/Tesla%20Model%20X.jpg",sourceUrl:"https://www.tesla.com/modelx",imageCredit:"JayGJH / Wikimedia Commons",imageLicense:"CC BY-SA 4.0",priceLabel:"Check current Tesla pricing"}
  ];
  for(const p of products)await db.product.upsert({where:{slug:p.slug},update:p,create:p});
}

main().catch(e=>{console.error("Seed failed",e);process.exitCode=1}).finally(()=>db.$disconnect());