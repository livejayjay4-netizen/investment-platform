import {getAdminUser} from "../../lib/admin-auth";
import {db} from "../../lib/prisma";
import {redirect} from "next/navigation";

const money=(n:number)=>"USD "+n.toFixed(2);
const dayKey=(d:Date)=>d.toISOString().slice(0,10);

export default async function Admin(){
  const u=await getAdminUser();
  if(!u) redirect("/admin/login");

  const now=new Date();
  const year=now.getUTCFullYear(), month=now.getUTCMonth();
  const monthStart=new Date(Date.UTC(year,month,1));
  const monthEnd=new Date(Date.UTC(year,month+1,1));

  const [users,stocks,orders,tx,tickets,balances,recentTx,recentOrders,recentTickets,featuredStocks,monthTx,monthOrders]=await Promise.all([
    db.user.count(),
    db.stock.count({where:{active:true}}),
    db.order.count(),
    db.walletTransaction.count(),
    db.supportTicket.count({where:{status:"OPEN"}}),
    db.wallet.aggregate({_sum:{balance:true}}),
    db.walletTransaction.findMany({include:{user:true},orderBy:{createdAt:"desc"},take:8}),
    db.order.findMany({include:{user:true,stock:true},orderBy:{createdAt:"desc"},take:8}),
    db.supportTicket.findMany({include:{user:true},where:{status:"OPEN"},orderBy:{createdAt:"desc"},take:6}),
    db.stock.findMany({where:{active:true},orderBy:[{featured:"desc"},{symbol:"asc"}],take:10}),
    db.walletTransaction.findMany({where:{createdAt:{gte:monthStart,lt:monthEnd}},select:{createdAt:true}}),
    db.order.findMany({where:{createdAt:{gte:monthStart,lt:monthEnd}},select:{createdAt:true}})
  ]);

  const daysInMonth=new Date(Date.UTC(year,month+1,0)).getUTCDate();
  const firstWeekday=monthStart.getUTCDay();
  const activity=new Map<string,number>();
  [...monthTx,...monthOrders].forEach(x=>activity.set(dayKey(x.createdAt),(activity.get(dayKey(x.createdAt))||0)+1));
  const cells:Array<number|null>=[...Array(firstWeekday).fill(null)];
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  while(cells.length%7) cells.push(null);

  return <div>
    <nav style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
      <a className="btn secondary" href="/admin">Command center</a>
      <a className="btn secondary" href="/admin/users">Users & accounts</a>
      <a className="btn secondary" href="/admin/audit">Audit log</a>
    </nav>

    <div className="topbar">
      <div><p className="eyebrow">Admin workspace</p><h1>Admin command center</h1><p className="muted">Operational overview with live database-backed activity.</p></div>
      <span className="badge good">{u.role}</span>
    </div>

    <div className="grid">
      <a className="card stat" href="/admin/users"><span className="muted">Users</span><div className="value">{users}</div><small>Open accounts →</small></a>
      <div className="card stat"><span className="muted">Active stocks</span><div className="value">{stocks}</div><small>See current market list below</small></div>
      <div className="card stat"><span className="muted">Orders</span><div className="value">{orders}</div><small>{recentOrders.length} latest shown below</small></div>
      <div className="card stat"><span className="muted">Open tickets</span><div className="value">{tickets}</div><small>{recentTickets.length} latest shown below</small></div>
    </div>

    <div style={{height:16}}/>
    <div className="grid2">
      <section className="card">
        <h2>Operational calendar</h2>
        <p className="muted">{now.toLocaleString("en-US",{month:"long",year:"numeric",timeZone:"UTC"})} · transaction and order activity</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=><div key={x} className="muted" style={{fontSize:12,textAlign:"center"}}>{x}</div>)}
          {cells.map((d,i)=><div key={i} style={{minHeight:54,border:"1px solid var(--line)",borderRadius:8,padding:6}}>
            {d&&<><b>{d}</b>{activity.get(dayKey(new Date(Date.UTC(year,month,d))))?<div className="badge good" style={{marginTop:5}}>{activity.get(dayKey(new Date(Date.UTC(year,month,d))))} events</div>:<div className="muted" style={{fontSize:11,marginTop:5}}>No activity</div>}</>}
          </div>)}
        </div>
      </section>

      <section className="card">
        <h2>Financial snapshot</h2>
        <div className="miniGrid">
          <div className="mini"><span className="muted">Recorded balances</span><br/><b>{money(Number(balances._sum.balance||0))}</b></div>
          <div className="mini"><span className="muted">Ledger transactions</span><br/><b>{tx}</b></div>
        </div>
        <p className="muted">Database ledger values. Payment settlement remains subject to payment processing and reconciliation.</p>
        <h3>Recent wallet activity</h3>
        {recentTx.length?recentTx.map(t=><div key={t.id} style={{padding:"8px 0",borderBottom:"1px solid var(--line)"}}><b>{t.type}</b> · {money(Number(t.amount))}<br/><span className="muted">{t.user.email} · {t.status} · {t.createdAt.toLocaleString()}</span></div>):<div className="empty">No wallet activity.</div>}
      </section>
    </div>

    <div style={{height:16}}/>
    <div className="grid2">
      <section className="card"><h2>Recent orders</h2>{recentOrders.length?recentOrders.map(o=><div key={o.id} style={{padding:"9px 0",borderBottom:"1px solid var(--line)"}}><b>{o.side} {o.stock.symbol}</b> · {o.quantity.toString()} shares<br/><span className="muted">{o.user.email} · {money(Number(o.total))} · {o.status} · {o.createdAt.toLocaleString()}</span></div>):<div className="empty">No orders recorded.</div>}</section>
      <section className="card"><h2>Open support tickets</h2>{recentTickets.length?recentTickets.map(t=><div key={t.id} style={{padding:"9px 0",borderBottom:"1px solid var(--line)"}}><b>{t.subject}</b><br/><span className="muted">{t.user.email} · {t.createdAt.toLocaleString()}</span><p style={{margin:"5px 0"}}>{t.message}</p></div>):<div className="empty">No open tickets.</div>}</section>
    </div>

    <div style={{height:16}}/>
    <section className="card"><h2>Active market</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
      {featuredStocks.map(s=><div key={s.id} className="mini"><b>{s.symbol}</b><br/>{s.name}<br/><strong>{money(Number(s.price))}</strong><br/><span className="muted">{Number(s.changePercent).toFixed(2)}% · volume {s.volume.toString()}</span></div>)}
    </div></section>
  </div>;
}
