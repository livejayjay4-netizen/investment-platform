import { redirect } from "next/navigation";
import { getUser } from "../../lib/auth";

export default async function InvestmentDashboard() {
  if (!(await getUser())) redirect("/login");
  return (
    <>
      <h1>Investment Dashboard</h1>
      <div className="card">Performance and allocation dashboard.</div>
    </>
  );
}
