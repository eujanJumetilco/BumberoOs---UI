"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setAccount } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/staff", label: "Staff" },
  { href: "/inventory", label: "Inventory" },
  { href: "/incidents", label: "Incidents" },
  { href: "/events", label: "Events" }, // <-- BAGONG LINYA
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  return (
    <aside className="flex w-56 flex-col border-r bg-white p-4">
      <Link href="/dashboard" className="mb-4 block">
        {/* Both stay lazy (no preload) so only the visible one is fetched. */}
        <Image
          src="/Logo-Home-V2.png"
          alt="BumberoOS Logo"
          width={200}
          height={80}
          className="logo-light mx-auto"
          style={{ width: "100%", height: "auto" }}
          fetchPriority="high"
        />
        <Image
          src="/Logo-Home-V2-dark.png"
          alt="BumberoOS Logo"
          width={200}
          height={80}
          className="logo-dark mx-auto"
          style={{ width: "100%", height: "auto" }}
          fetchPriority="high"
        />
      </Link>
      
      <button onClick={() => router.push("/dashboard?report=1")} className="mb-6 rounded bg-red-700 py-2 text-sm font-semibold text-white">
        Quick Dispatch
      </button>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded px-3 py-2 text-sm ${
              path.startsWith(l.href)
                ? "bg-red-700 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-col gap-1 text-sm text-gray-600">
        <Link href="/help" className="px-3 py-2">Help & Support</Link>
        <button
          onClick={async () => {
            try { await api.signout(); } catch { /* already signed out, or offline */ }
            setAccount(null);
            router.replace("/");
          }}
          className="px-3 py-2 text-left"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}