import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { importMembersCsvAction } from "@/lib/actions";
import { PageTitle, Card, Table, Th, Td, StatusBadge } from "@/components/ui";
import { memberStatusLabel } from "@/lib/labels";

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ societyId: string }>;
  searchParams: Promise<{ q?: string; status?: string; importCreated?: string; importUpdated?: string; importSkipped?: string }>;
}) {
  const { societyId } = await params;
  const sp = await searchParams;
  const { repo, society } = await getTenantContext(societyId, "READ_ONLY");
  const members = await repo.listMembers({ q: sp.q, status: (sp.status as any) ?? "ALL" });
  const importCreated = Number(sp.importCreated ?? 0);
  const importUpdated = Number(sp.importUpdated ?? 0);
  const importSkipped = Number(sp.importSkipped ?? 0);

  return (
    <div className="space-y-5">
      <PageTitle
        title="会員一覧"
        subtitle={`会員マスター検索・編集（${society.shortName}）`}
        action={
          <div className="flex gap-2">
            <a href={`/t/${societyId}/members/export`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">CSV出力</a>
            <Link href={`/t/${societyId}/members/new`} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white">会員追加</Link>
          </div>
        }
      />
      {(sp.importCreated || sp.importUpdated || sp.importSkipped) ? (
        <Card>
          <p className="text-sm text-slate-700">
            一括取込が完了しました。作成: <b>{importCreated}</b> / 更新: <b>{importUpdated}</b> / スキップ: <b>{importSkipped}</b>
          </p>
        </Card>
      ) : null}
      <Card>
        <form className="grid gap-3 md:grid-cols-[1fr,180px,auto]">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="氏名/会員番号/所属/メール" />
          <select name="status" defaultValue={sp.status ?? "ALL"}><option value="ALL">全て</option><option value="ACTIVE">有効</option><option value="INACTIVE">無効</option></select>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">検索</button>
        </form>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">会員一括登録（Excel/CSV）</h2>
        <form action={importMembersCsvAction.bind(null, societyId)} encType="multipart/form-data" className="grid gap-3 md:grid-cols-[1fr,auto]">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">CSVファイル</span>
            <input type="file" name="csvFile" accept=".csv,text/csv" required />
          </label>
          <div className="self-end">
            <button className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white">一括取込</button>
          </div>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Excelで編集後にCSV保存してアップロードしてください。重複する会員番号は更新されます。
          <a href="/member-import-template.csv" className="ml-2 underline">テンプレートCSVをダウンロード</a>
        </p>
      </Card>
      <Card>
        <Table>
          <thead><tr><Th>会員番号</Th><Th>氏名</Th><Th>種別/所属</Th><Th>連絡先</Th><Th>状態</Th><Th>操作</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <Td>{m.memberNo}</Td>
                <Td><div className="font-medium">{m.name}</div><div className="text-xs text-slate-500">{m.kana || "-"}</div></Td>
                <Td><div>{m.memberType}</div><div className="text-xs text-slate-500">{m.affiliation}</div></Td>
                <Td><div>{m.email}</div><div className="text-xs text-slate-500">{m.phone || "-"}</div></Td>
                <Td><StatusBadge tone={m.status === "ACTIVE" ? "green" : "slate"}>{memberStatusLabel(m.status)}</StatusBadge></Td>
                <Td className="align-middle text-right"><Link href={`/t/${societyId}/members/${m.id}`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">詳細</Link></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
