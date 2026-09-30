import "./globals.css";
import Link from "next/link";
import { getUser } from "../lib/auth";
const primary = [["Dashboard","/dashboard","⌂"],["Invest","/stocks","↗"],["Wallet","/wallet","₦"],["Portfolio","/portfolio","◔"],["Orders","/orders","≡"],["Transactions","/transactions","↔"]];
const more = [["Investments","/investments"],["Analytics","/investment-dashboard"],["Support","/support"],["Account","/account"]];
export default async function Layout({children}:{children:React.ReactNode}) {
  const user=await getUser();
  if(!user) return <main className="auth-shell">{children}</main>;
  return <div className="app-shell">
    <aside className="side">
      <Link href="/dashboard" className="app-brand"><span className="app-mark">IP</span><span>Investment<br/><small>Platform</small></span></Link>
      <div className="side-section">Workspace</div>
      <nav className="side-nav">{primary.map(([label,href,icon])=><Link key={href} href={href}><span className="nav-icon">{icon}</span>{label}</Link>)}</nav>
      <div className="side-section">More</div>
      <nav className="side-nav">{more.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}{user.role!=="USER"&&<Link href="/admin">Admin Center</Link>}{user.role!=="USER"&&<Link href="/inventory">Inventory</Link>}</nav>
      <div className="side-user"><div className="avatar">{user.fullName.slice(0,1).toUpperCase()}</div><div className="side-user-copy"><strong>{user.fullName}</strong><span>{user.email}</span></div><Link href="/api/auth/logout" className="logout-link" aria-label="Sign out">↪</Link></div>
    </aside>
    <main className="main">
      <header className="mobile-topbar"><Link href="/dashboard" className="app-brand"><span className="app-mark">IP</span><span>Investment</span></Link><Link href="/account" className="avatar">{user.fullName.slice(0,1).toUpperCase()}</Link></header>
      <div className="page-wrap">{children}</div>
      <nav className="bottom-nav" aria-label="App navigation">{primary.slice(0,5).map(([label,href,icon])=><Link key={href} href={href}><span>{icon}</span><small>{label==="Dashboard"?"Home":label}</small></Link>)}</nav>
    </main>
  </div>;
}