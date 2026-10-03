import {getUser} from "../../../lib/auth";
import {db} from "../../../lib/prisma";
import {redirect,notFound} from "next/navigation";
import Link from "next/link";

export default async function ProductDetails({params}:{params:Promise<{id:string}>}){
  if(!(await getUser())) redirect("/login");
  const {id}=await params;
  const p=await db.product.findUnique({where:{id}});
  if(!p||!p.active) notFound();
  return <><div className="topbar"><div><p className="eyebrow">{p.brand} · {p.category}</p><h1>{p.name}</h1><p className="muted">{p.description}</p></div><Link className="btn secondary" href="/inventory">Back to inventory</Link></div>
  <div className="grid2"><section className="card"><img src={p.imageUrl} alt={p.name} style={{width:"100%",maxHeight:460,objectFit:"cover",borderRadius:14}}/></section>
  <section className="card"><p className="muted">Platform inventory</p><h2>{p.name}</h2><div className="value">{p.price?new Intl.NumberFormat("en-US",{style:"currency",currency:p.currency,maximumFractionDigits:0}).format(Number(p.price)):"Price available on request"}</div>
  {p.downPayment&&<p className="muted">Down payment: {new Intl.NumberFormat("en-US",{style:"currency",currency:p.currency,maximumFractionDigits:0}).format(Number(p.downPayment))}</p>}
  <p style={{lineHeight:1.7}}>{p.description}</p><div className="card" style={{marginTop:16,background:"var(--surface-2)"}}><b>Owned inventory listing</b><p className="muted">This product is presented from the platform's own inventory database. No external product page is required to view these details.</p></div></section></div></>;
}