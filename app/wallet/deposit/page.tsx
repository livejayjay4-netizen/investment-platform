"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function Deposit() {
  const [amount,setAmount]=useState("");
  const [msg,setMsg]=useState("");
  useEffect(()=>{const q=new URLSearchParams(window.location.search);const s=q.get("status");if(s==="success")setMsg("Payment verified. Your wallet has been credited.");else if(s==="error")setMsg(q.get("message")||"Payment verification failed.");else if(s==="missing_reference")setMsg("Payment reference was missing.");},[]);
  async function submit(){
    setMsg("Connecting to secure Paystack checkout…");
    const r=await fetch("/api/wallet/deposit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount})});
    const d=await r.json();
    if(r.ok&&d.authorizationUrl){window.location.assign(d.authorizationUrl);return;}
    setMsg(d.error||"Could not initialize payment.");
  }
  return <><div className="topbar"><div><p className="eyebrow">Wallet</p><h1>Deposit funds</h1><p className="muted">Payments are processed securely by Paystack. Your wallet is credited only after server-side verification.</p></div><Link className="btn secondary" href="/wallet">Back to wallet</Link></div><div className="card form"><label className="label">Amount (NGN)</label><input className="input" type="number" min="50" step="1" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="5000"/>{msg&&<div className={msg.includes("credited")?"success":"error"}>{msg}</div>}<button className="btn" onClick={submit}>Pay with Paystack</button></div></>;
}
