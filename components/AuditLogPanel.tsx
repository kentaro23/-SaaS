import { formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui";

export function AuditLogPanel({ logs }: { logs: Array<any> }) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">監査ログ（直近20件）</h3>
      <div className="space-y-2 text-sm">
        {logs.length === 0 ? <p className="text-slate-500">ログはありません。</p> : null}
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{log.resourceType}</span>
              <span className="text-slate-500">{log.action}</span>
              <span className="text-slate-400">{formatDateTime(log.createdAt)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">actor: {log.actor?.name ?? "system"} / resourceId: {log.resourceId}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
