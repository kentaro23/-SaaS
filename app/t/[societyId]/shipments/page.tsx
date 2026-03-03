import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { createShipmentBatchAction } from "@/lib/actions";
import { Card, PageTitle, Table, Th, Td, Button, StatusBadge } from "@/components/ui";
import { shipmentTypeLabel, shipmentTypeOptions } from "@/lib/labels";
import { formatDateTime } from "@/lib/utils";

export default async function ShipmentsPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const batches = await repo.listShipmentBatches();

  return (
    <div className="space-y-5">
      <PageTitle title="発送履歴" subtitle="発送バッチ / 宛名リストCSV / ステータス管理" />
      <Card>
        <h2 className="mb-3 font-semibold">発送バッチ作成</h2>
        <form action={createShipmentBatchAction.bind(null, societyId)} className="grid gap-3 md:grid-cols-[220px,1fr,auto]">
          <label className="grid gap-1 text-sm"><span>種別</span><select name="type">{shipmentTypeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
          <label className="grid gap-1 text-sm"><span>タイトル（任意）</span><input name="title" placeholder="学会誌 Vol.12 発送" /></label>
          <div className="self-end"><Button>作成（有効会員を対象）</Button></div>
        </form>
      </Card>
      <Card>
        <Table>
          <thead><tr><Th>作成日時</Th><Th>種別</Th><Th>タイトル</Th><Th>作成者</Th><Th>対象</Th><Th>進捗</Th><Th>操作</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {batches.map((b) => {
              const sent = b.recipients.filter((r) => r.status === 'SENT').length;
              const returned = b.recipients.filter((r) => r.status === 'RETURNED').length;
              return (
                <tr key={b.id}>
                  <Td>{formatDateTime(b.createdAt)}</Td>
                  <Td>{shipmentTypeLabel(b.type)}</Td>
                  <Td>{b.title || '-'}</Td>
                  <Td>{b.createdBy.name}</Td>
                  <Td>{b._count.recipients}</Td>
                  <Td><StatusBadge tone="blue">発送済み {sent}</StatusBadge> <StatusBadge tone="red">返送 {returned}</StatusBadge></Td>
                  <Td className="text-right"><Link href={`/t/${societyId}/shipments/${b.id}`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">詳細</Link></Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
