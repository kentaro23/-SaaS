import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { Card, PageTitle, Table, Th, Td, StatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export default async function MeetingsPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const meetings = await repo.listMeetings();

  return (
    <div className="space-y-5">
      <PageTitle title="会議一覧" subtitle="案内 / 資料 / 議事録 / ToDo / 決定事項" action={<Link href={`/t/${societyId}/meetings/new`} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white">会議作成</Link>} />
      <Card>
        <Table>
          <thead><tr><Th>タイトル</Th><Th>種別</Th><Th>開催日時</Th><Th>状態</Th><Th>件数</Th><Th></Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {meetings.map((m) => (
              <tr key={m.id}>
                <Td><div className="font-medium">{m.title}</div><div className="text-xs text-slate-500">{m.location || m.onlineUrl || "-"}</div></Td>
                <Td>{m.type}</Td>
                <Td>{formatDateTime(m.scheduledAt)}</Td>
                <Td><StatusBadge tone={m.status === "DONE" ? "green" : m.status === "SCHEDULED" ? "blue" : "yellow"}>{m.status}</StatusBadge></Td>
                <Td>
                  <div className="text-xs">出欠 {m._count.attendances}</div>
                  <div className="text-xs">資料 {m._count.documents}</div>
                  <div className="text-xs">Task {m._count.tasks}</div>
                </Td>
                <Td className="text-right"><Link href={`/t/${societyId}/meetings/${m.id}`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">詳細</Link></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
