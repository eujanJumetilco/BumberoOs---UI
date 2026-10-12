import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        
        {/* Logo / Title */}
      <div className="mb-8 text-center">
        <Image
          src="/Logo-login-V2.png"
          alt="BumberoOS Logo"
          width={220}
          height={143}
          className="mx-auto"
        />

          <p className="mt-2 text-sm text-gray-500">
            Volunteer Firefighting Brigade Management System
          </p>
        </div>

        {/* Login Form */}
        <form className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Login
          </button>

        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          BumberoOS © 2026
        </p>

      </div>
    </main>
  );
}