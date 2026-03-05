import Link from "next/link";
import { headers } from "next/headers";
import { getTenantContext } from "@/lib/tenant";
import { importMembersCsvAction, savePublicMemberFormAction } from "@/lib/actions";
import { hasRole } from "@/lib/authz";
import { PageTitle, Card, Table, Th, Td, StatusBadge } from "@/components/ui";
import { memberStatusLabel } from "@/lib/labels";

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ societyId: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    importCreated?: string;
    importUpdated?: string;
    importSkipped?: string;
    publicFormSaved?: string;
    publicFormError?: string;
  }>;
}) {
  const { societyId } = await params;
  const sp = await searchParams;
  const { repo, society, membership } = await getTenantContext(societyId, "READ_ONLY");
  const members = await repo.listMembers({ q: sp.q, status: (sp.status as any) ?? "ALL" });
  const publicForm = await repo.getPublicMemberForm();
  const importCreated = Number(sp.importCreated ?? 0);
  const importUpdated = Number(sp.importUpdated ?? 0);
  const importSkipped = Number(sp.importSkipped ?? 0);
  const canEditPublicForm = hasRole(membership.role, "STAFF");
  const defaultSlug =
    society.shortName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || societyId.slice(0, 8);
  const publicJoinUrl = `/join/${publicForm?.slug ?? defaultSlug}`;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || (host ? `${proto}://${host}` : "");
  const publicJoinAbsoluteUrl = origin ? `${origin}${publicJoinUrl}` : publicJoinUrl;

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
      {sp.publicFormSaved ? (
        <Card>
          <p className="text-sm text-emerald-700">公開会員登録フォーム設定を保存しました。</p>
        </Card>
      ) : null}
      {sp.publicFormError === "slug" ? (
        <Card>
          <p className="text-sm text-rose-700">公開URLが他学会と重複しています。別のURLを指定してください。</p>
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
          Excelで編集後にCSV保存してアップロードしてください（姓/名/かな/郵便番号/都道府県/市区町村/番地は必須）。重複する会員番号は更新されます。
          <a href="/member-import-template.csv" className="ml-2 underline">テンプレートCSVをダウンロード</a>
        </p>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">公開会員登録フォーム（学会別URL）</h2>
        <p className="mb-3 text-sm text-slate-600">
          外部向けの新規会員登録フォームURLを発行できます。登録された会員はこの学会の会員一覧に自動反映されます。
        </p>
        <form action={savePublicMemberFormAction.bind(null, societyId)} className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">公開URL</span>
            <input name="slug" defaultValue={publicForm?.slug ?? defaultSlug} required />
            <span className="text-xs text-slate-500">利用URL: {publicJoinUrl}</span>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">フォームタイトル</span>
            <input name="title" defaultValue={publicForm?.title ?? `${society.name} 新規会員登録`} required />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">デフォルト会員種別</span>
            <input name="defaultMemberType" defaultValue={publicForm?.defaultMemberType ?? "正会員"} required />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">説明文（任意）</span>
            <textarea name="description" rows={3} defaultValue={publicForm?.description ?? ""} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input name="enabled" type="checkbox" className="h-4 w-4" defaultChecked={publicForm?.enabled ?? false} />
            <span>フォームを有効化する</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              name="allowMemberTypeInput"
              type="checkbox"
              className="h-4 w-4"
              defaultChecked={publicForm?.allowMemberTypeInput ?? false}
            />
            <span>登録者による会員種別入力を許可する</span>
          </label>
          <div className="md:col-span-2">
            {canEditPublicForm ? (
              <button className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white">公開フォーム設定を保存</button>
            ) : (
              <p className="text-sm text-slate-500">この設定は `Staff` 以上の権限で編集できます。</p>
            )}
          </div>
        </form>
        {publicForm?.enabled ? (
          <div className="mt-3 grid gap-1 text-xs text-slate-500">
            <span>公開中URL（学会HP掲載用）</span>
            <input readOnly value={publicJoinAbsoluteUrl} className="bg-slate-50 font-mono text-xs" />
            <a href={publicJoinUrl} target="_blank" rel="noreferrer" className="underline">
              別タブで公開フォームを開く
            </a>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">フォームを有効化すると公開URLが表示されます。</p>
        )}
      </Card>
      <Card>
        <Table>
          <thead><tr><Th>会員番号</Th><Th>氏名</Th><Th>種別/所属</Th><Th>連絡先</Th><Th>状態</Th><Th>操作</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <Td>{m.memberNo}</Td>
                <Td><div className="font-medium">{(m.familyName && m.givenName) ? `${m.familyName} ${m.givenName}` : m.name}</div><div className="text-xs text-slate-500">{m.kana || "-"}</div></Td>
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
