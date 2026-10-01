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
    <div className="page-title"><div><div className="eyebrow" style={{color:"#155eef",background:"#eef4ff",borderColor:"#d7e4ff"}}>Private workspace</div><h1 style={{marginTop:12}}>Good to see you, {user.fullName.split(" ")[0]}</h1><p>Your capital, positions and activity in one command center.</p></div><Link href="/stocks" className="btn">Explore markets</Link></div>
    <div className="stat-strip">
      <div className="card"><div className="muted">Total balance</div><div className="value">{'$' + balance.toFixed(2)}</div><div className="muted" style={{marginTop:7}}>Recorded wallet value</div></div>
      <div className="card"><div className="muted">Available capital</div><div className="value">{'$' + available.toFixed(2)}</div><div className="muted" style={{marginTop:7}}>Ready for eligible orders</div></div>
      <div className="card"><div className="muted">Positions</div><div className="value">{holdings}</div><div className="muted" style={{marginTop:7}}>Active holdings</div></div>
      <div className="card"><div className="muted">Orders</div><div className="value">{orders}</div><div className="muted" style={{marginTop:7}}>Recorded orders</div></div>
    </div>
    <div className="card" style={{marginTop:16,background:"linear-gradient(135deg,#081525,#102846)",color:"#fff",border:"0",overflow:"hidden",position:"relative"}}>
      <div style={{position:"relative",zIndex:1,maxWidth:650}}><div style={{fontSize:11,fontWeight:800,letterSpacing:".12em",textTransform:"uppercase",color:"#83aefc"}}>Portfolio command center</div><h2 style={{font:"800 27px Manrope,sans-serif",letterSpacing:"-.04em",margin:"10px 0"}}>Make every financial decision from one place.</h2><p style={{color:"#9fb0c4",lineHeight:1.6,marginBottom:18}}>Review your positions, fund your wallet, inspect activity and move into the market without leaving your workspace.</p><Link href="/portfolio" className="btn">Open portfolio</Link></div>
      <div style={{position:"absolute",width:260,height:260,borderRadius:"50%",right:-80,top:-120,background:"rgba(21,94,239,.24)"}}/>
    </div>
    <div className="card" style={{marginTop:16}}><div className="page-title" style={{marginBottom:12}}><div><h2 style={{margin:0,fontSize:19}}>Quick actions</h2><p>High-value workflows, one tap away.</p></div></div>
      <div className="quick-grid"><Link className="quick" href="/stocks">Buy or sell<span>Browse available instruments</span></Link><Link className="quick" href="/wallet">Fund wallet<span>Deposit or withdraw funds</span></Link><Link className="quick" href="/portfolio">View portfolio<span>See positions and allocation</span></Link><Link className="quick" href="/transactions">Activity<span>Review your ledger history</span></Link></div>
    </div>
    <div className="grid" style={{marginTop:16}}>
      <div className="card" style={{gridColumn:"span 2"}}><div className="muted">Market intelligence</div><h2 style={{font:"800 21px Manrope,sans-serif",margin:"8px 0"}}>A clean view of the market.</h2><p className="muted" style={{lineHeight:1.6}}>The platform is prepared for live market feeds, portfolio charts and deeper analytics. Current stock prices are demo/seed data until a live provider is connected.</p><Link href="/stocks" className="btn secondary">Browse instruments</Link></div>
      <div className="card" style={{gridColumn:"span 2"}}><div className="muted">Account integrity</div><h2 style={{font:"800 21px Manrope,sans-serif",margin:"8px 0"}}>Know what is recorded.</h2><p className="muted" style={{lineHeight:1.6}}>Wallet requests, orders and account activity are represented explicitly instead of showing simulated settlement as completed money movement.</p><Link href="/transactions" className="btn secondary">Review activity</Link></div>
    </div>
  </>;
}