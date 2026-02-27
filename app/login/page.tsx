import { loginAction } from "@/lib/auth-actions";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-teal-50 via-white to-amber-50 p-4">
      <form action={loginAction} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h1 className="text-xl font-semibold text-slate-900">学会事務局OS ログイン</h1>
        <p className="mt-1 text-sm text-slate-600">運営スタッフ用アカウントでログインしてください。</p>
        <div className="mt-5 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input name="email" type="email" required defaultValue="owner@example.com" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Password</span>
            <input name="password" type="password" required defaultValue="password123" />
          </label>
          <input type="hidden" name="redirectTo" value="/" />
          <button className="mt-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">ログイン</button>
        </div>
      </form>
    </div>
  );
}
