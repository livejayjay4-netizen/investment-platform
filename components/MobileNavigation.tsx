"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState} from "react";

const groups=[
  {title:"Workspace",items:[
    ["Dashboard","/dashboard","⌂"],
    ["Wallet","/wallet","$"],
    ["Transactions","/transactions","⇄"],
  ]},
  {title:"Invest & Portfolio",items:[
    ["Investments","/investments","◆"],
    ["Markets","/stocks","↗"],
    ["Portfolio","/portfolio","◔"],
    ["Analytics","/investment-dashboard","▥"],
  ]},
  {title:"Tesla Collection",items:[
    ["Browse Vehicles","/inventory","◇"],
    ["Purchases","/purchases","✓"],
    ["Orders","/orders","≡"],
  ]},
  {title:"Account",items:[
    ["Support","/support","?"],
    ["Account & Settings","/account","♙"],
  ]},
];

export default function MobileNavigation({name,email}:{name:string;email:string}){
  const [open,setOpen]=useState(false);
  const pathname=usePathname();
  const active=(href:string)=>pathname===href||pathname.startsWith(href+"/");
  return <>
    <button className={"mobile-menu-button"+(open?" is-open":"")} onClick={()=>setOpen(v=>!v)} aria-label={open?"Close navigation":"Open navigation"} aria-expanded={open}>
      <span></span><span></span><span></span>
    </button>
    {open&&<button className="mobile-nav-backdrop" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
    <aside className={"mobile-drawer"+(open?" open":"")} aria-label="Mobile navigation">
      <div className="mobile-drawer-head">
        <Link href="/dashboard" className="app-brand" onClick={()=>setOpen(false)}>
          <span className="app-mark">EA</span><span>Elite Auto<br/><small>Investment</small></span>
        </Link>
        <button className="mobile-drawer-close" onClick={()=>setOpen(false)} aria-label="Close navigation">×</button>
      </div>
      <div className="mobile-profile">
        <div className="avatar">{name.slice(0,1).toUpperCase()}</div>
        <div><strong>{name}</strong><span>{email}</span></div>
      </div>
      <nav className="mobile-drawer-nav">
        {groups.map(group=><div className="mobile-nav-group" key={group.title}>
          <div className="mobile-nav-group-title">{group.title}</div>
          {group.items.map(([label,href,icon])=><Link key={href} href={href} className={active(href)?"active":""} onClick={()=>setOpen(false)}>
            <span>{icon}</span>{label}{active(href)&&<i aria-hidden="true"/>}
          </Link>)}
        </div>)}
      </nav>
      <div className="mobile-drawer-footer">
        <a className="mobile-drawer-logout" href="/api/auth/logout">Logout <span>↪</span></a>
        <small>Elite Auto Investment · Private workspace</small>
      </div>
    </aside>
  </>;
}