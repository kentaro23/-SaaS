import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { updateShipmentRecipientStatusAction } from "@/lib/actions";
import { Card, PageTitle, Table, Th, Td, Button } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export default async function ShipmentBatchDetailPage({ params }: { params: Promise<{ societyId: string; batchId: string }> }) {
  const { societyId, batchId } = await params;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const batch = await repo.getShipmentBatch(batchId);
  if (!batch) notFound();

  return (
    <div className="space-y-5">
      <PageTitle title={`発送バッチ詳細`} subtitle={`${batch.type} / ${formatDateTime(batch.createdAt)} / ${batch.title || '-'}`} action={<a href={`/t/${societyId}/shipments/${batch.id}/export`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">CSVエクスポート</a>} />
      <Card>
        <div className="mb-3 text-sm text-slate-600">対象会員数: {batch.recipients.length}</div>
        <Table>
          <thead><tr><Th>会員番号</Th><Th>氏名</Th><Th>当時住所スナップショット</Th><Th>状態</Th><Th>更新</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {batch.recipients.map((r) => (
              <tr key={r.id}>
                <Td>{r.member.memberNo}</Td>
                <Td>{r.member.name}</Td>
                <Td className="whitespace-pre-wrap text-xs">{r.addressSnapshot}</Td>
                <Td>{r.status}</Td>
                <Td>
                  <form action={updateShipmentRecipientStatusAction.bind(null, societyId, batch.id)} className="flex items-center gap-2">
                    <input type="hidden" name="recipientId" value={r.id} />
                    <select name="status" defaultValue={r.status}><option value="QUEUED">queued</option><option value="SENT">sent</option><option value="RETURNED">returned</option></select>
                    <Button variant="secondary">更新</Button>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
