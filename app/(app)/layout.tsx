"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useAccount } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const account = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (account === null) router.replace("/");
  }, [account, router]);

  if (!account) return null; // hydrating, or redirecting to login

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
