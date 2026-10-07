import {redirect} from "next/navigation";
import {getUser} from "../../lib/auth";
import {db} from "../../lib/prisma";
import Link from "next/link";
const money=(n:number,c="USD")=>new Intl.NumberFormat("en-US",{style:"currency",currency:c,maximumFractionDigits:0}).format(n);
export default async function Purchases(){
 const u=await getUser(); if(!u)redirect("/login");
 const purchases=await db.productPurchase.findMany({where:{userId:u.id},include:{product:true},orderBy:{createdAt:"desc"}});
 return <><div className="topbar"><div><p className="eyebrow">Vehicle purchases</p><h1>My purchases</h1><p className="muted">Track purchase requests, payment status and the next action for each vehicle.</p></div><Link className="btn" href="/inventory">Browse inventory</Link></div>
 <div className="card">{purchases.length?purchases.map(p=><div key={p.id} style={{display:"grid",gridTemplateColumns:"90px 1fr auto",gap:16,alignItems:"center",padding:"16px 0",borderBottom:"1px solid var(--line)"}}>
 <img src={p.product.imageUrl} alt={p.product.name} style={{width:90,height:70,objectFit:"cover",borderRadius:10}}/>
 <div><b>{p.product.name}</b><div className="muted">{p.reference} · {new Date(p.createdAt).toLocaleString()}</div><div style={{marginTop:5}}>{money(Number(p.amount),p.currency)}{p.downPayment?<> · down payment {money(Number(p.downPayment),p.currency)}</>:null}</div></div>
 <div><span className="badge">{p.status}</span><div className="muted" style={{marginTop:6}}>{p.paymentStatus}</div></div>
 </div>):<div className="empty"><h2>No purchase requests</h2><p>Choose a vehicle from inventory to start a purchase request.</p><Link className="btn" href="/inventory">Browse inventory</Link></div>}</div></>;
}