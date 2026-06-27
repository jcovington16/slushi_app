import Link from "next/link";
import { CupSoda, ShieldCheck } from "lucide-react";

export function BrandHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
      <Link href="/" className="flex items-center gap-3 font-black text-ink">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-berry text-white shadow-soft">
          <CupSoda size={24} />
        </span>
        <span>
          <span className="block text-xl leading-none">Slushi Squad</span>
          <span className="block text-xs font-bold text-grape">Cold cups. Big dreams.</span>
        </span>
      </Link>
      <Link
        href="/admin"
        className="focus-ring inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-grape shadow-sm"
      >
        <ShieldCheck size={16} />
        Admin
      </Link>
    </header>
  );
}
