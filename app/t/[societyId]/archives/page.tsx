import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { createArchiveAction } from "@/lib/actions";
import { Card, PageTitle, Table, Th, Td, Button } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function ArchivesPage({
  params,
  searchParams,
}: {
  params: Promise<{ societyId: string }>;
  searchParams: Promise<{ q?: string; category?: string; issueNo?: string }>;
}) {
  const { societyId } = await params;
  const sp = await searchParams;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const archives = await repo.listArchives({ q: sp.q, category: sp.category, issueNo: sp.issueNo });

  return (
    <div className="space-y-5">
      <PageTitle title="文書・バックナンバー" subtitle="文書登録 / バックナンバー検索 / 発送への流用" action={<Link href={`/t/${societyId}/shipments`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">発送履歴へ</Link>} />
      <Card>
        <form className="mb-4 grid gap-3 md:grid-cols-[1fr,180px,180px,auto]">
          <input name="q" defaultValue={sp.q ?? ''} placeholder="title or tags" />
          <select name="category" defaultValue={sp.category ?? 'ALL'}><option value="ALL">全カテゴリ</option><option value="JOURNAL">journal</option><option value="NOTICE">notice</option><option value="OTHER">other</option></select>
          <input name="issueNo" defaultValue={sp.issueNo ?? ''} placeholder="issueNo" />
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">検索</button>
        </form>
        <Table>
          <thead><tr><Th>カテゴリ</Th><Th>タイトル</Th><Th>号数</Th><Th>公開日</Th><Th>タグ</Th><Th>ファイル</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">{archives.map((a) => <tr key={a.id}><Td>{a.category}</Td><Td>{a.title}</Td><Td>{a.issueNo || '-'}</Td><Td>{formatDate(a.publishedAt)}</Td><Td className="text-xs">{a.tags.join(', ')}</Td><Td><a href={a.fileUrl} target="_blank">開く</a></Td></tr>)}</tbody>
        </Table>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">文書登録</h2>
        <form action={createArchiveAction.bind(null, societyId)} className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm"><span>カテゴリ</span><select name="category"><option value="JOURNAL">journal</option><option value="NOTICE">notice</option><option value="OTHER">other</option></select></label>
          <label className="grid gap-1 text-sm"><span>タイトル</span><input name="title" required /></label>
          <label className="grid gap-1 text-sm"><span>号数</span><input name="issueNo" /></label>
          <label className="grid gap-1 text-sm"><span>公開日</span><input name="publishedAt" type="date" /></label>
          <label className="grid gap-1 text-sm md:col-span-2"><span>fileUrl</span><input name="fileUrl" placeholder="/uploads/..." required /></label>
          <label className="grid gap-1 text-sm md:col-span-2"><span>タグ（カンマ区切り）</span><input name="tags" placeholder="journal, 2026, vol1" /></label>
          <label className="grid gap-1 text-sm md:col-span-2"><span>メモ</span><textarea name="note" rows={3} /></label>
          <div className="md:col-span-2"><Button>登録</Button></div>
        </form>
        <form action="/api/upload" method="post" encType="multipart/form-data" className="mt-3 grid gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm">
          <input type="hidden" name="societyId" value={societyId} />
          <input type="hidden" name="subdir" value="archives" />
          <label className="grid gap-1"><span>PDFアップロード（返却URLを上の fileUrl に貼り付け）</span><input name="file" type="file" accept="application/pdf" /></label>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm" type="submit">アップロード</button>
        </form>
      </Card>
    </div>
  );
}
