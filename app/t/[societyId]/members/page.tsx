import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { PageTitle, Card, Table, Th, Td, StatusBadge } from "@/components/ui";

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ societyId: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { societyId } = await params;
  const sp = await searchParams;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const members = await repo.listMembers({ q: sp.q, status: (sp.status as any) ?? "ALL" });

  return (
    <div className="space-y-5">
      <PageTitle title="会員一覧" subtitle="会員マスター検索・編集" action={<Link href={`/t/${societyId}/members/new`} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white">会員追加</Link>} />
      <Card>
        <form className="grid gap-3 md:grid-cols-[1fr,180px,auto]">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="氏名/会員番号/所属/メール" />
          <select name="status" defaultValue={sp.status ?? "ALL"}><option value="ALL">全て</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">検索</button>
        </form>
      </Card>
      <Card>
        <Table>
          <thead><tr><Th>会員番号</Th><Th>氏名</Th><Th>種別/所属</Th><Th>連絡先</Th><Th>状態</Th><Th></Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <Td>{m.memberNo}</Td>
                <Td><div className="font-medium">{m.name}</div><div className="text-xs text-slate-500">{m.kana || "-"}</div></Td>
                <Td><div>{m.memberType}</div><div className="text-xs text-slate-500">{m.affiliation}</div></Td>
                <Td><div>{m.email}</div><div className="text-xs text-slate-500">{m.phone || "-"}</div></Td>
                <Td><StatusBadge tone={m.status === "ACTIVE" ? "green" : "slate"}>{m.status}</StatusBadge></Td>
                <Td className="text-right"><Link href={`/t/${societyId}/members/${m.id}`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">詳細</Link></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
