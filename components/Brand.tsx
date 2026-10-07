import Link from "next/link";

export default function Brand({href="/dashboard", compact=false}:{href?:string;compact?:boolean}){
  return <Link href={href} className={"elite-brand"+(compact?" elite-brand-compact":"")} aria-label="Elite Auto Investment">
    <span className="elite-mark" aria-hidden="true"><span>EA</span></span>
    <span className="elite-brand-copy"><strong>Elite Auto Investment</strong>{!compact&&<small>Private capital & automotive assets</small>}</span>
  </Link>;
}