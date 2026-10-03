import {redirect} from "next/navigation";
import {getUser} from "../../lib/auth";
import {db} from "../../lib/prisma";
import ProductsBrowser from "../../components/ProductsBrowser";

export default async function Inventory(){
  if(!(await getUser())) redirect("/login");
  const products=await db.product.findMany({
    where:{active:true},
    orderBy:[{featured:"desc"},{createdAt:"desc"}]
  });
  return <ProductsBrowser
    title="Browse Inventory"
    subtitle="Explore premium electric vehicles and current reference listings."
    products={products.map(p=>({
      id:p.id,name:p.name,brand:p.brand,category:p.category,description:p.description,
      price:p.price?Number(p.price):null,currency:p.currency,imageUrl:p.imageUrl,sourceUrl:p.sourceUrl,
      imageCredit:p.imageCredit,imageLicense:p.imageLicense,priceLabel:p.priceLabel,
      downPayment:p.downPayment?Number(p.downPayment):null
    }))}
  />;
}