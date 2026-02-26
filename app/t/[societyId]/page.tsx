import { getTenantContext } from "@/lib/tenant";
import { Card, PageTitle } from "@/components/ui";
import { AuditLogPanel } from "@/components/AuditLogPanel";

export default async function TenantDashboardPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const { society, repo } = await getTenantContext(societyId, "READ_ONLY");
  const [summary, logs] = await Promise.all([repo.dashboardSummary(), repo.latestAuditLogs(20)]);

  return (
    <div className="space-y-5">
      <PageTitle title={`${society.name} ダッシュボード`} subtitle={`現在テナント: ${society.shortName}`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><div className="text-xs text-slate-500">会員（active）</div><div className="mt-2 text-2xl font-semibold">{summary.memberCount}</div></Card>
        <Card><div className="text-xs text-slate-500">未納/送信待ち請求</div><div className="mt-2 text-2xl font-semibold">{summary.unpaidInvoices}</div></Card>
        <Card><div className="text-xs text-slate-500">今後の会議</div><div className="mt-2 text-2xl font-semibold">{summary.meetingsUpcoming}</div></Card>
        <Card><div className="text-xs text-slate-500">発送バッチ累計</div><div className="mt-2 text-2xl font-semibold">{summary.shipmentCount}</div></Card>
      </div>
      <AuditLogPanel logs={logs} />
    </div>
  );
}
