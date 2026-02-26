import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { addAttendanceAction, addDecisionAction, addMeetingDocumentAction, addTaskAction, saveMeetingAction, saveMinutesAction, updateTaskStatusAction } from "@/lib/actions";
import { Card, PageTitle, Button, Table, Th, Td, StatusBadge } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function MeetingDetailPage({ params }: { params: Promise<{ societyId: string; meetingId: string }> }) {
  const { societyId, meetingId } = await params;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const [meeting, members] = await Promise.all([
    repo.getMeeting(meetingId),
    prisma.member.findMany({ where: { societyId, status: "ACTIVE" }, orderBy: { memberNo: "asc" } }),
  ]);
  if (!meeting) notFound();

  return (
    <div className="space-y-5">
      <PageTitle title={meeting.title} subtitle={`${meeting.type} / ${formatDateTime(meeting.scheduledAt)}`} />

      <Card>
        <h2 className="mb-3 font-semibold">会議基本情報</h2>
        <form action={saveMeetingAction.bind(null, societyId)} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={meeting.id} />
          <label className="grid gap-1 text-sm"><span>タイトル</span><input name="title" defaultValue={meeting.title} required /></label>
          <label className="grid gap-1 text-sm"><span>種別</span><select name="type" defaultValue={meeting.type}><option value="BOARD">board</option><option value="COMMITTEE">committee</option><option value="OTHER">other</option></select></label>
          <label className="grid gap-1 text-sm"><span>開催日時</span><input name="scheduledAt" type="datetime-local" defaultValue={new Date(meeting.scheduledAt).toISOString().slice(0,16)} required /></label>
          <label className="grid gap-1 text-sm"><span>状態</span><select name="status" defaultValue={meeting.status}><option value="DRAFT">draft</option><option value="SCHEDULED">scheduled</option><option value="DONE">done</option></select></label>
          <label className="grid gap-1 text-sm"><span>場所</span><input name="location" defaultValue={meeting.location ?? ""} /></label>
          <label className="grid gap-1 text-sm"><span>オンラインURL</span><input name="onlineUrl" defaultValue={meeting.onlineUrl ?? ""} /></label>
          <label className="md:col-span-2 grid gap-1 text-sm"><span>議題</span><textarea name="agenda" rows={5} defaultValue={meeting.agenda ?? ""} /></label>
          <div className="md:col-span-2"><Button>更新</Button></div>
        </form>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">出欠</h2>
          <form action={addAttendanceAction.bind(null, societyId, meeting.id)} className="mb-3 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm"><span>会員（任意）</span><select name="memberId" defaultValue=""><option value="">選択なし</option>{members.map((m) => <option key={m.id} value={m.id}>{m.memberNo} {m.name}</option>)}</select></label>
            <label className="grid gap-1 text-sm"><span>外部参加者名（任意）</span><input name="externalName" /></label>
            <label className="grid gap-1 text-sm"><span>回答</span><select name="status" defaultValue="YES"><option value="YES">yes</option><option value="NO">no</option><option value="MAYBE">maybe</option></select></label>
            <label className="grid gap-1 text-sm"><span>備考</span><input name="note" /></label>
            <div className="md:col-span-2"><Button>追加</Button></div>
          </form>
          <Table>
            <thead><tr><Th>対象</Th><Th>回答</Th><Th>備考</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">{meeting.attendances.map((a) => <tr key={a.id}><Td>{a.member ? `${a.member.memberNo} ${a.member.name}` : a.externalName}</Td><Td>{a.status}</Td><Td>{a.note || '-'}</Td></tr>)}</tbody>
          </Table>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">資料（版管理）</h2>
          <form action={addMeetingDocumentAction.bind(null, societyId, meeting.id)} className="mb-3 grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm"><span>タイトル</span><input name="title" required /></label>
            <label className="grid gap-1 text-sm"><span>Version</span><input name="version" type="number" defaultValue={1} min={1} required /></label>
            <label className="grid gap-1 text-sm"><span>fileUrl</span><input name="fileUrl" placeholder="/uploads/..." required /></label>
            <div className="md:col-span-3"><Button>登録</Button></div>
          </form>
          <form action="/api/upload" method="post" encType="multipart/form-data" className="mb-3 grid gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm">
            <input type="hidden" name="societyId" value={societyId} />
            <input type="hidden" name="subdir" value="meeting-docs" />
            <label className="grid gap-1"><span>PDFアップロード（アップロード後に返却URLをコピーして上に貼り付け）</span><input name="file" type="file" accept="application/pdf" /></label>
            <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm" type="submit">アップロード</button>
          </form>
          <Table>
            <thead><tr><Th>タイトル</Th><Th>版</Th><Th>URL</Th><Th>登録者</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">{meeting.documents.map((d) => <tr key={d.id}><Td>{d.title}</Td><Td>v{d.version}</Td><Td><a href={d.fileUrl} target="_blank">{d.fileUrl}</a></Td><Td>{d.uploadedBy.name}</Td></tr>)}</tbody>
          </Table>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">議事録</h2>
          <form action={saveMinutesAction.bind(null, societyId, meeting.id)} className="grid gap-3">
            <textarea name="minutesText" rows={10} defaultValue={meeting.minutes?.minutesText ?? ''} required />
            <div><Button>保存</Button></div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">ToDo</h2>
          <form action={addTaskAction.bind(null, societyId, meeting.id)} className="mb-3 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm"><span>タイトル</span><input name="title" required /></label>
            <label className="grid gap-1 text-sm"><span>担当</span><input name="assignee" /></label>
            <label className="grid gap-1 text-sm"><span>期限</span><input name="dueDate" type="date" /></label>
            <label className="grid gap-1 text-sm"><span>状態</span><select name="status" defaultValue="OPEN"><option value="OPEN">open</option><option value="DONE">done</option></select></label>
            <div className="md:col-span-2"><Button>追加</Button></div>
          </form>
          <div className="space-y-2">
            {meeting.tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-slate-500">担当: {t.assignee || '-'} / 期限: {formatDate(t.dueDate)}</div>
                </div>
                <form action={updateTaskStatusAction.bind(null, societyId, meeting.id)} className="flex items-center gap-2">
                  <input type="hidden" name="taskId" value={t.id} />
                  <select name="status" defaultValue={t.status}><option value="OPEN">open</option><option value="DONE">done</option></select>
                  <Button variant="secondary">更新</Button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">決定事項ログ</h2>
        <form action={addDecisionAction.bind(null, societyId, meeting.id)} className="mb-3 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm"><span>タイトル</span><input name="title" required /></label>
          <label className="grid gap-1 text-sm"><span>決定者</span><input name="decidedBy" /></label>
          <label className="grid gap-1 text-sm"><span>決定日時</span><input name="decidedAt" type="datetime-local" required /></label>
          <label className="md:col-span-2 grid gap-1 text-sm"><span>詳細</span><textarea name="detail" rows={3} /></label>
          <div className="md:col-span-2"><Button>追加</Button></div>
        </form>
        <Table>
          <thead><tr><Th>日時</Th><Th>タイトル</Th><Th>詳細</Th><Th>決定者</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">{meeting.decisions.map((d) => <tr key={d.id}><Td>{formatDateTime(d.decidedAt)}</Td><Td>{d.title}</Td><Td>{d.detail || '-'}</Td><Td>{d.decidedBy || '-'}</Td></tr>)}</tbody>
        </Table>
      </Card>
    </div>
  );
}
