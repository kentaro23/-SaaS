import { getTenantContext } from "@/lib/tenant";
import { savePlanAction } from "@/lib/actions";
import { Card, PageTitle, InputRow, CheckboxRow, Button } from "@/components/ui";
import { AuditLogPanel } from "@/components/AuditLogPanel";
import { toDateInput } from "@/lib/utils";

export default async function PlanSettingsPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const { repo, society } = await getTenantContext(societyId, "READ_ONLY");
  const [plan, logs] = await Promise.all([repo.getPlan(), repo.latestAuditLogs(20)]);
  const action = savePlanAction.bind(null, societyId);

  return (
    <div className="space-y-5">
      <PageTitle title="契約プラン設定" subtitle={`${society.name} のプラン / オプション`} />
      <Card>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <InputRow label="プラン名" name="planName" required defaultValue={plan?.planName ?? "Standard"} />
          <InputRow label="月額料金 (JPY)" name="monthlyFee" type="number" required defaultValue={plan?.monthlyFee ?? 0} />
          <InputRow label="開始日" name="startDate" type="date" required defaultValue={toDateInput(plan?.startDate)} />
          <InputRow label="終了日" name="endDate" type="date" defaultValue={toDateInput(plan?.endDate)} />
          <div className="md:col-span-2 grid gap-2 rounded-xl border border-slate-200 p-4">
            <CheckboxRow label="electionSupport" name="electionSupport" defaultChecked={plan?.electionSupport} />
            <CheckboxRow label="shipmentSupport" name="shipmentSupport" defaultChecked={plan?.shipmentSupport} />
            <CheckboxRow label="committeeSupport" name="committeeSupport" defaultChecked={plan?.committeeSupport} />
            <CheckboxRow label="accountingSupport" name="accountingSupport" defaultChecked={plan?.accountingSupport} />
          </div>
          <div className="md:col-span-2"><Button>保存</Button></div>
        </form>
      </Card>
      <AuditLogPanel logs={logs.filter((l) => l.resourceType === 'PLAN_CHANGE' || l.resourceType === 'SOCIETY_PLAN')} />
    </div>
  );
}
