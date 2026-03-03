import { getTenantContext } from "@/lib/tenant";
import { savePlanAction } from "@/lib/actions";
import { Card, PageTitle, InputRow, Button } from "@/components/ui";
import { AuditLogPanel } from "@/components/AuditLogPanel";
import { corePlanOptions, optionDefinitions } from "@/lib/plan-catalog";
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
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">コアプラン</span>
            <select name="planName" defaultValue={plan?.planName ?? "Core-Standard"}>
              {corePlanOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <InputRow label="月額料金 (JPY)" name="monthlyFee" type="number" required defaultValue={plan?.monthlyFee ?? 0} />
          <InputRow label="開始日" name="startDate" type="date" required defaultValue={toDateInput(plan?.startDate)} />
          <InputRow label="終了日" name="endDate" type="date" defaultValue={toDateInput(plan?.endDate)} />

          <div className="md:col-span-2 rounded-xl border border-slate-200 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">コアプラン対応範囲（参考）</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {corePlanOptions.map((p) => (
                <div key={p.value} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-sm font-medium text-slate-900">{p.label}</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                    {p.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 grid gap-3 rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800">オプション契約</h3>
            {optionDefinitions.map((opt) => (
              <label key={opt.field} className="flex items-start gap-3 text-sm">
                <input
                  name={opt.field}
                  type="checkbox"
                  defaultChecked={(plan?.[opt.field as "electionSupport" | "shipmentSupport" | "committeeSupport" | "accountingSupport"] as boolean | undefined) ?? false}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block font-medium text-slate-800">{opt.label}</span>
                  <span className="block text-xs text-slate-500">{opt.description}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="md:col-span-2"><Button>保存</Button></div>
        </form>
      </Card>
      <AuditLogPanel logs={logs.filter((l) => l.resourceType === 'PLAN_CHANGE' || l.resourceType === 'SOCIETY_PLAN')} />
    </div>
  );
}
