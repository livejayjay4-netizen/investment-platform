import {getAdminUser} from "../../lib/admin-auth";
import Link from "next/link";

export default async function AdminLayout({children}:{children:React.ReactNode}){
  const u=await getAdminUser();
  return <div className="admin-shell">{u?<><header className="admin-top"><div><span className="eyebrow">Admin workspace</span><strong>Investment Platform Admin</strong></div><div><span className="badge good">{u.role}</span> <Link className="btn secondary" href="/api/admin/logout">Sign out</Link></div></header><main className="admin-content">{children}</main></>:children}</div>;
}