import { saveMeetingAction } from "@/lib/actions";
import { Card, PageTitle, InputRow, SelectRow, Button } from "@/components/ui";

export default async function NewMeetingPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const action = saveMeetingAction.bind(null, societyId);
  return (
    <div className="space-y-5">
      <PageTitle title="会議作成" />
      <Card>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <InputRow label="タイトル" name="title" required />
          <SelectRow label="種別" name="type" defaultValue="BOARD" options={[{ value: "BOARD", label: "board" }, { value: "COMMITTEE", label: "committee" }, { value: "OTHER", label: "other" }]} />
          <label className="grid gap-1 text-sm"><span className="font-medium text-slate-700">開催日時</span><input name="scheduledAt" type="datetime-local" required /></label>
          <SelectRow label="状態" name="status" defaultValue="SCHEDULED" options={[{ value: "DRAFT", label: "draft" }, { value: "SCHEDULED", label: "scheduled" }, { value: "DONE", label: "done" }]} />
          <InputRow label="場所" name="location" />
          <InputRow label="オンラインURL" name="onlineUrl" />
          <label className="md:col-span-2 grid gap-1 text-sm"><span className="font-medium text-slate-700">議題</span><textarea name="agenda" rows={6} /></label>
          <div className="md:col-span-2"><Button>保存</Button></div>
        </form>
      </Card>
    </div>
  );
}
