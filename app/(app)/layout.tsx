"use client";
import { useRouter } from "next/navigation";
import { Fragment, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useAccount } from "@/lib/auth";
import { useSettings } from "@/lib/settings";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const account = useAccount();
  const router = useRouter();
  const { timeFormat } = useSettings();

  useEffect(() => {
    if (account === null) router.replace("/");
  }, [account, router]);

  if (!account) return null; // hydrating, or redirecting to login

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Timestamps are formatted when rendered, so remount the page when the format changes. */}
          <Fragment key={timeFormat}>{children}</Fragment>
        </main>
      </div>
    </div>
  );
}
