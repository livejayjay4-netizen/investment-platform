import {getAdminUser} from "../../lib/admin-auth";
import Link from "next/link";

export default async function AdminLayout({children}:{children:React.ReactNode}){
  const u=await getAdminUser();
  return <div className="admin-shell">{u?<><header className="admin-top"><div><span className="eyebrow">Admin workspace</span><strong>Investment Platform Admin</strong></div><div><span className="badge good">{u.role}</span> <nav style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}><Link className="btn secondary" href="/admin">Command center</Link><Link className="btn secondary" href="/admin/users">Users</Link><Link className="btn secondary" href="/admin/inventory">Inventory</Link><Link className="btn secondary" href="/admin/transactions">Transactions</Link><Link className="btn secondary" href="/admin/orders">Orders</Link><Link className="btn secondary" href="/admin/support">Support</Link><Link className="btn secondary" href="/admin/audit">Audit log</Link></nav> <Link className="btn secondary" href="/api/admin/logout">Sign out</Link></div></header><main className="admin-content">{children}</main></>:children}</div>;
}