import {PrismaClient} from "@prisma/client";

const db=new PrismaClient();

async function main(){
  const starlinkUsd=[
    {slug:"starlink-router-3",price:160,downPayment:160,priceLabel:"$160"},
    {slug:"starlink-mini-router",price:106,downPayment:106,priceLabel:"$106"},
    {slug:"starlink-cable-45m",price:188,downPayment:188,priceLabel:"$188"},
  ];
  for(const item of starlinkUsd){
    await db.product.updateMany({
      where:{slug:item.slug},
      data:{currency:"USD",price:item.price,downPayment:item.downPayment,priceLabel:item.priceLabel},
    });
  }
}

main().catch(e=>{console.error("Currency normalization failed",e);process.exitCode=1}).finally(()=>db.$disconnect());