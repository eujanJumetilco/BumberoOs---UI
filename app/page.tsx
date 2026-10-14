"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { setAccount, useAccount } from "@/lib/auth";

const input = "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500";

export default function Home() {
  const router = useRouter();
  const account = useAccount();
  // null = still checking; false = no admin exists yet, so offer account creation
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (account) router.replace("/dashboard");
  }, [account, router]);

  useEffect(() => {
    api.registered()
      .then((r) => setRegistered(r.registered))
      .catch((e) => { setError(errMsg(e)); setRegistered(true); });
  }, []);

  const creating = registered === false;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const acct = creating
        ? await api.signup({ email, password, displayName: displayName || undefined, role: "ADMIN" })
        : await api.signin(email, password);
      setAccount(acct);
      router.replace("/dashboard");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Image src="/Logo-login-V2.png" alt="BumberoOS Logo" width={220} height={143} className="mx-auto" />
          <p className="mt-2 text-sm text-gray-500">
            Volunteer Firefighting Brigade Management System
          </p>
        </div>

        {creating && (
          <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
            First run: no administrator exists yet. Create the admin account to continue.
          </p>
        )}

        <form className="space-y-5" onSubmit={submit}>
          {creating && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Display name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Admin" className={input} />
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" className={input} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required minLength={creating ? 8 : undefined} value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={creating ? "At least 8 characters" : "Enter your password"} className={input} />
          </div>

          {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={busy || registered === null}
            className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
            {busy ? "Please wait..." : creating ? "Create Admin Account" : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">BumberoOS © 2026</p>
      </div>
    </main>
  );
}
