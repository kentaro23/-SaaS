import { getTenantContext } from "@/lib/tenant";
import { Card, PageTitle } from "@/components/ui";
import { AuditLogPanel } from "@/components/AuditLogPanel";

export default async function TenantDashboardPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const { society, repo } = await getTenantContext(societyId, "READ_ONLY");
  await repo.ensureCurrentMonthReport();
  const [summary, logs, monthly] = await Promise.all([repo.dashboardSummary(), repo.latestAuditLogs(20), repo.listMonthlyReports(1)]);

  return (
    <div className="space-y-5">
      <PageTitle title={`${society.name} ダッシュボード`} subtitle={`現在テナント: ${society.shortName}`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><div className="text-xs text-slate-500">会員（有効）</div><div className="mt-2 text-2xl font-semibold">{summary.memberCount}</div></Card>
        <Card><div className="text-xs text-slate-500">未納/送信待ち請求</div><div className="mt-2 text-2xl font-semibold">{summary.unpaidInvoices}</div></Card>
        <Card><div className="text-xs text-slate-500">今後の会議</div><div className="mt-2 text-2xl font-semibold">{summary.meetingsUpcoming}</div></Card>
        <Card><div className="text-xs text-slate-500">発送バッチ累計</div><div className="mt-2 text-2xl font-semibold">{summary.shipmentCount}</div></Card>
      </div>
      {monthly[0] ? (
        <Card>
          <div className="text-sm font-semibold text-slate-900">最新月次レポート ({monthly[0].year}/{String(monthly[0].month).padStart(2, "0")})</div>
          <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
            <div>請求件数: {monthly[0].invoiceCount}</div>
            <div>未納件数: {monthly[0].unpaidCount}</div>
            <div>期限超過: {monthly[0].overdueCount}</div>
            <div>1次督促: {monthly[0].reminderFirstCount}</div>
            <div>2次督促: {monthly[0].reminderSecondCount}</div>
            <div>最終督促: {monthly[0].reminderFinalCount}</div>
          </div>
        </Card>
      ) : null}
      <AuditLogPanel logs={logs} />
    </div>
  );
}
