import Link from "next/link";
import { logoutAction } from "@/lib/auth-actions";
import { NavLink } from "@/components/ui";
import { TenantSwitcher } from "@/components/TenantSwitcher";

export function AppShell({
  societyId,
  memberships,
  pathname,
  children,
}: {
  societyId: string;
  memberships: Array<any>;
  pathname: string;
  children: React.ReactNode;
}) {
  const base = `/t/${societyId}`;
  const items = [
    [base, "ダッシュボード"],
    [`${base}/members`, "会員"],
    [`${base}/invoices`, "請求・督促"],
    [`${base}/meetings`, "会議"],
    [`${base}/archives`, "文書・発送"],
    [`${base}/shipments`, "発送履歴"],
    [`${base}/settings/plan`, "設定: プラン"],
    [`${base}/settings/mail`, "設定: メール送信"],
    [`${base}/settings/email-templates`, "設定: テンプレ"],
    [`${base}/settings/members`, "設定: 運営メンバー"],
  ] as const;

  return (
    <div className="min-h-screen bg-slatebg">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-semibold text-slate-900">学会事務局OS</Link>
            <Link href="/admin/societies" className="text-sm text-slate-600">運営側テナント管理</Link>
          </div>
          <form action={logoutAction}><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">ログアウト</button></form>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[260px,1fr]">
        <aside className="space-y-4">
          <TenantSwitcher currentSocietyId={societyId} memberships={memberships} />
          <nav className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">メニュー</div>
            <div className="grid gap-1">
              {items.map(([href, label]) => (
                <NavLink key={href} href={href} label={label} active={pathname === href || pathname.startsWith(`${href}/`)} />
              ))}
            </div>
          </nav>
        </aside>
        <main className="space-y-5">{children}</main>
      </div>
    </div>
  );
}
