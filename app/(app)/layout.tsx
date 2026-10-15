"use client";
import { useRouter } from "next/navigation";
import { Fragment, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { api } from "@/lib/api";
import { setAccount, useAccount } from "@/lib/auth";
import { useSettings } from "@/lib/settings";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const account = useAccount();
  const router = useRouter();
  const { timeFormat } = useSettings();

  useEffect(() => {
    if (account === null) router.replace("/");
  }, [account, router]);

  // The cached account may be stale (expired session, role changed): confirm it with the server.
  // A 401 clears it in the API client, which sends us back to login.
  const accountId = account?.id;
  useEffect(() => {
    if (accountId === undefined) return;
    api.me().then(setAccount).catch(() => { /* offline: keep the cached account */ });
  }, [accountId]);

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
