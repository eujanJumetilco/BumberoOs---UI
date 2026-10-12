"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/staff", label: "Staff" },
  { href: "/inventory", label: "Inventory" },
  { href: "/incidents", label: "Incidents" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="flex w-56 flex-col border-r bg-white p-4">
      <Link href="/dashboard" className="mb-4 block">
        <Image
          src="/Logo-Home-V2.png"
          alt="BumberoOS Logo"
          width={200}
          height={80}
          className="mx-auto"
          style={{ width: "100%", height: "auto" }}
          priority
        />
      </Link>
      

<button className="mb-6 rounded bg-red-700 py-2 text-sm font-semibold text-white">
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
        <button className="px-3 py-2 text-left">Log Out</button>
      </div>
    </aside>
  );
}