"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState} from "react";

const items=[
  ["Dashboard","/dashboard","⌂"],
  ["Wallet","/wallet","▣"],
  ["Investments","/investments","↗"],
  ["Stocks","/stocks","▥"],
  ["Portfolio","/portfolio","◔"],
  ["Transactions","/transactions","⇄"],
  ["Investment Dashboard","/investment-dashboard","▥"],
  ["Inventory","/inventory","▱"],
  ["Orders","/orders","▤"],
  ["Account","/account","♙"],
  ["Support","/support","?"],
];

export default function MobileNavigation({name,email}:{name:string;email:string}){
  const [open,setOpen]=useState(false);
  const pathname=usePathname();
  const active=(href:string)=>pathname===href||pathname.startsWith(href+"/");
  return <>
    <button className="mobile-menu-button" onClick={()=>setOpen(true)} aria-label="Open navigation">☰</button>
    {open&&<button className="mobile-nav-backdrop" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
    <aside className={"mobile-drawer"+(open?" open":"")} aria-label="Mobile navigation">
      <div className="mobile-drawer-head">
        <Link href="/dashboard" className="app-brand" onClick={()=>setOpen(false)}>
          <span className="app-mark">IP</span><span>Investment<br/><small>Platform</small></span>
        </Link>
        <button className="mobile-drawer-close" onClick={()=>setOpen(false)} aria-label="Close navigation">×</button>
      </div>
      <div className="mobile-profile">
        <div className="avatar">{name.slice(0,1).toUpperCase()}</div>
        <div><strong>{name}</strong><span>{email}</span></div>
      </div>
      <nav className="mobile-drawer-nav">
        {items.map(([label,href,icon])=><Link key={href} href={href} className={active(href)?"active":""} onClick={()=>setOpen(false)}><span>{icon}</span>{label}</Link>)}
      </nav>
      <a className="mobile-drawer-logout" href="/api/auth/logout">Logout <span>↪</span></a>
    </aside>
  </>;
}