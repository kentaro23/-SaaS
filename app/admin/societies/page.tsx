import Link from "next/link";
import { requireUser } from "@/lib/session";
import { createSocietyAdminRepo } from "@/lib/repositories/society-admin-repo";
import { PageTitle, Card, Table, Th, Td, StatusBadge } from "@/components/ui";

export default async function AdminSocietiesPage() {
  const user = await requireUser();
  const repo = createSocietyAdminRepo(user.id);
  const societies = await repo.listSocieties();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 space-y-5">
      <PageTitle title="運営側テナント管理" subtitle="学会（Society）のCRUD / 契約プラン / 運営メンバー管理" action={<Link href="/admin/societies/new" className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white">学会を追加</Link>} />
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>学会</Th><Th>状態</Th><Th>連絡先</Th><Th>プラン</Th><Th>件数</Th><Th>導線</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {societies.map((s) => (
              <tr key={s.id}>
                <Td>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.shortName}</div>
                </Td>
                <Td><StatusBadge tone={s.status === "ACTIVE" ? "green" : "slate"}>{s.status}</StatusBadge></Td>
                <Td>
                  <div>{s.contactEmail}</div>
                  <div className="text-xs text-slate-500">請求: {s.billingEmail}</div>
                </Td>
                <Td>{s.plan ? `${s.plan.planName} / ${s.plan.monthlyFee.toLocaleString()}円` : "未設定"}</Td>
                <Td>
                  <div className="text-xs text-slate-600">会員 {s._count.members}</div>
                  <div className="text-xs text-slate-600">スタッフ {s._count.staff}</div>
                  <div className="text-xs text-slate-600">請求 {s._count.invoices}</div>
                </Td>
                <Td className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link href={`/t/${s.id}`} className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm text-white">運用画面</Link>
                    <Link href={`/t/${s.id}/members`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700">会員</Link>
                    <Link href={`/t/${s.id}/invoices`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700">請求</Link>
                    <Link href={`/admin/societies/${s.id}`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700">詳細</Link>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
