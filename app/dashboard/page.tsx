import Link from "next/link";
import { getUser } from "../../lib/auth";
import { db } from "../../lib/prisma";
import { redirect } from "next/navigation";
export default async function Dashboard(){
  const user=await getUser(); if(!user) redirect("/login");
  const wallet=await db.wallet.findUnique({where:{userId:user.id}});
  const holdings=await db.holding.count({where:{userId:user.id}});
  const orders=await db.order.count({where:{userId:user.id}});
  const balance=Number(wallet?.balance||0), available=Number(wallet?.availableBalance||0);
  return <>
    <div className="page-title"><div><h1>Good to see you, {user.fullName.split(" ")[0]}</h1><p>Your investment workspace at a glance.</p></div><Link href="/stocks" className="btn">Invest now</Link></div>
    <div className="stat-strip">
      <div className="card"><div className="muted">Wallet balance</div><div className="value">{`$${balance.toFixed(2)}`}</div></div>
      <div className="card"><div className="muted">Available</div><div className="value">{`$${available.toFixed(2)}`}</div></div>
      <div className="card"><div className="muted">Holdings</div><div className="value">{holdings}</div></div>
      <div className="card"><div className="muted">Orders</div><div className="value">{orders}</div></div>
    </div>
    <div className="card" style={{marginTop:14}}><div className="page-title" style={{marginBottom:12}}><div><h2 style={{margin:0,fontSize:18}}>Quick actions</h2><p>Common tasks, one tap away.</p></div></div>
      <div className="quick-grid"><Link className="quick" href="/stocks">Buy or sell<span>Browse market</span></Link><Link className="quick" href="/wallet">Fund wallet<span>Deposit or withdraw</span></Link><Link className="quick" href="/portfolio">View portfolio<span>See your positions</span></Link><Link className="quick" href="/transactions">Activity<span>Review transactions</span></Link></div>
    </div>
    <div className="card" style={{marginTop:14}}><h2 style={{marginTop:0,fontSize:18}}>Market data</h2><p className="muted">Stock prices currently shown by this platform are demo/seed data until a live market feed is connected. Do not treat them as real-time quotes.</p></div>
  </>;
}