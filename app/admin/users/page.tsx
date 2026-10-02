"use client";
import {useEffect,useState} from "react";
import Link from "next/link";

type UserRow={id:string;fullName:string;email:string;role:string;status:string;totpEnabled:boolean;wallet?:{balance?:number|string|null;availableBalance?:number|string|null}|null};
type Counts={total:number;customers:number;admins:number};

export default function AdminUsers(){
 const[users,setUsers]=useState<UserRow[]>([]);
 const[counts,setCounts]=useState<Counts>({total:0,customers:0,admins:0});
 const[q,setQ]=useState("");
 const[status,setStatus]=useState("");
 const[role,setRole]=useState("");
 const[loading,setLoading]=useState(true);
 const[msg,setMsg]=useState("");
 const[viewer,setViewer]=useState("");
 async function load(){
   setLoading(true);setMsg("");
   try{
     const r=await fetch("/api/admin/users?q="+encodeURIComponent(q)+"&status="+encodeURIComponent(status)+"&role="+encodeURIComponent(role),{cache:"no-store"});
     const d=await r.json().catch(()=>({error:"Invalid server response."}));
     setUsers(Array.isArray(d.users)?d.users:[]);
     setCounts(d.counts||{total:0,customers:0,admins:0});
     setViewer(d.viewer?.role||"");
     if(!r.ok)setMsg(d.error||"Unable to load user accounts.");
   }catch{setMsg("Unable to reach the user-account service. Refresh and try again.")}
   finally{setLoading(false)}
 }
 useEffect(()=>{load()},[status,role]);
 return <><div className="topbar"><div><p className="eyebrow">Administration</p><h1>User accounts</h1><p className="muted">Search, inspect and manage authenticated customer accounts and administrator accounts.</p></div><Link className="btn secondary" href="/admin">Command center</Link></div>
 <div className="card" style={{marginBottom:16}}><div style={{display:"flex",gap:18,flexWrap:"wrap"}}><div><span className="muted">Total accounts</span><div style={{fontSize:24,fontWeight:700}}>{counts.total}</div></div><div><span className="muted">Customer accounts</span><div style={{fontSize:24,fontWeight:700}}>{counts.customers}</div></div><div><span className="muted">Administrators</span><div style={{fontSize:24,fontWeight:700}}>{counts.admins}</div></div><div><span className="muted">Signed in as</span><div style={{fontSize:24,fontWeight:700}}>{viewer||"—"}</div></div></div></div>
 <div className="card"><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><input className="input" style={{maxWidth:420}} placeholder="Search name or email" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")load()}}/><select className="input" style={{maxWidth:180}} value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option>ACTIVE</option><option>SUSPENDED</option><option>LOCKED</option></select><select className="input" style={{maxWidth:190}} value={role} onChange={e=>setRole(e.target.value)}><option value="">All roles</option><option value="USER">USER</option><option value="ADMIN">ADMIN</option><option value="FINANCE_ADMIN">FINANCE_ADMIN</option><option value="MARKET_ADMIN">MARKET_ADMIN</option><option value="SUPPORT_ADMIN">SUPPORT_ADMIN</option><option value="READ_WRITE_ADMIN">READ &amp; WRITE ADMIN</option></select><button className="btn" onClick={load}>Search</button><button className="btn secondary" onClick={load}>Refresh</button></div>
 {msg&&<div className="error" style={{marginTop:12}}>{msg}</div>}
 <div style={{overflowX:"auto",marginTop:18}}><table className="table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Balance</th><th>2FA</th><th></th></tr></thead><tbody>
 {loading?<tr><td colSpan={6}>Loading…</td></tr>:users.length===0?<tr><td colSpan={6}><div style={{padding:"28px 8px",textAlign:"center"}}><b>No accounts found</b><div className="muted" style={{marginTop:6}}>{counts.total===0?"The database currently has no user records. The seeded administrator should appear here after a successful deployment.":"No accounts match the current search or filters."}</div>{counts.total===0&&<button className="btn secondary" style={{marginTop:12}} onClick={load}>Refresh account list</button>}</div></td></tr>:users.map(u=><tr key={u.id}><td><b>{u.fullName}</b><br/><span className="muted">{u.email}</span></td><td>{u.role==="READ_WRITE_ADMIN"?"READ & WRITE ADMIN":u.role}</td><td>{u.status}</td><td>USD {Number(u.wallet?.balance||0).toFixed(2)}</td><td>{u.totpEnabled?"Enabled":"Off"}</td><td><Link className="btn secondary" href={"/admin/users/"+u.id}>Manage</Link></td></tr>)}
 </tbody></table></div></div></>
}