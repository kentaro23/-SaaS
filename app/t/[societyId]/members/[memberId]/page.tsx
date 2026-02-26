import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { saveMemberAction } from "@/lib/actions";
import { PageTitle, Card, InputRow, SelectRow, Button, Table, Th, Td, StatusBadge } from "@/components/ui";
import { AuditLogPanel } from "@/components/AuditLogPanel";
import { formatCurrencyJPY, formatDate, toDateInput } from "@/lib/utils";

export default async function MemberDetailPage({ params }: { params: Promise<{ societyId: string; memberId: string }> }) {
  const { societyId, memberId } = await params;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const member = await repo.getMember(memberId);
  if (!member) notFound();
  const logs = (await repo.latestAuditLogs(50)).filter((l) => l.resourceType === "MEMBER" && l.resourceId === memberId).slice(0, 20);

  const action = saveMemberAction.bind(null, societyId);

  return (
    <div className="space-y-5">
      <PageTitle title={`会員詳細: ${member.name}`} subtitle={`会員番号 ${member.memberNo}`} />
      <Card>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={member.id} />
          <InputRow label="会員番号" name="memberNo" required defaultValue={member.memberNo} />
          <InputRow label="氏名" name="name" required defaultValue={member.name} />
          <InputRow label="かな" name="kana" defaultValue={member.kana ?? ""} />
          <InputRow label="所属" name="affiliation" required defaultValue={member.affiliation} />
          <InputRow label="メール" name="email" type="email" required defaultValue={member.email} />
          <InputRow label="電話" name="phone" defaultValue={member.phone ?? ""} />
          <InputRow label="会員種別" name="memberType" required defaultValue={member.memberType} />
          <InputRow label="役職" name="position" defaultValue={member.position ?? ""} />
          <SelectRow label="状態" name="status" defaultValue={member.status} options={[{ value: "ACTIVE", label: "active" }, { value: "INACTIVE", label: "inactive" }]} />
          <InputRow label="入会日" name="joinedAt" type="date" required defaultValue={toDateInput(member.joinedAt)} />
          <InputRow label="退会日" name="leftAt" type="date" defaultValue={toDateInput(member.leftAt)} />
          <label className="md:col-span-2 grid gap-1 text-sm"><span className="font-medium text-slate-700">住所</span><textarea name="address" rows={3} defaultValue={member.address} required /></label>
          <div className="md:col-span-2"><Button>更新</Button></div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">請求履歴</h3>
        <Table>
          <thead><tr><Th>年度</Th><Th>金額</Th><Th>期限</Th><Th>状態</Th><Th>領収書</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {member.invoices.map((inv) => (
              <tr key={inv.id}>
                <Td>{inv.fiscalYear}</Td>
                <Td>{formatCurrencyJPY(inv.amount)}</Td>
                <Td>{formatDate(inv.dueDate)}</Td>
                <Td><StatusBadge tone={inv.status === "PAID" ? "green" : inv.status === "OVERDUE" ? "red" : "yellow"}>{inv.status}</StatusBadge></Td>
                <Td>{inv.receipt ? <a href={inv.receipt.filePath} className="text-sm">ダウンロード</a> : "-"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <AuditLogPanel logs={logs} />
    </div>
  );
}
