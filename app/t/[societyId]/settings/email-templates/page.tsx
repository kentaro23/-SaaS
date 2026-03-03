import { getTenantContext } from "@/lib/tenant";
import { upsertEmailTemplateAction } from "@/lib/actions";
import { Card, PageTitle, Button } from "@/components/ui";
import { presetsByCategory } from "@/lib/email-template-presets";

export default async function EmailTemplatesPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const templates = await repo.listEmailTemplates();
  const byKey = new Map(templates.map((t) => [t.key, t]));
  const mailingTemplates = presetsByCategory("mailing");
  const reminderTemplates = presetsByCategory("reminder");

  return (
    <div className="space-y-5">
      <PageTitle title="メールテンプレート設定" subtitle="差し込み変数対応（{{memberName}}, {{fiscalYear}}, {{invoiceAmount}}, {{dueDate}}）" />
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">請求案内テンプレート</h2>
        <div className="grid gap-5">
          {mailingTemplates.map((d) => {
            const current = byKey.get(d.key);
            return (
              <Card key={d.key}>
                <form action={upsertEmailTemplateAction.bind(null, societyId)} className="grid gap-3">
                  <input type="hidden" name="key" value={d.key} />
                  <label className="grid gap-1 text-sm"><span>表示名</span><input name="name" defaultValue={current?.name ?? d.name} required /></label>
                  <label className="grid gap-1 text-sm"><span>件名</span><input name="subject" defaultValue={current?.subject ?? d.subject} required /></label>
                  <label className="grid gap-1 text-sm"><span>本文</span><textarea name="body" rows={7} defaultValue={current?.body ?? d.body} required /></label>
                  <div><Button>保存</Button></div>
                </form>
              </Card>
            );
          })}
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">督促テンプレート</h2>
        <div className="grid gap-5">
          {reminderTemplates.map((d) => {
            const current = byKey.get(d.key);
            return (
              <Card key={d.key}>
                <form action={upsertEmailTemplateAction.bind(null, societyId)} className="grid gap-3">
                  <input type="hidden" name="key" value={d.key} />
                  <label className="grid gap-1 text-sm"><span>表示名</span><input name="name" defaultValue={current?.name ?? d.name} required /></label>
                  <label className="grid gap-1 text-sm"><span>件名</span><input name="subject" defaultValue={current?.subject ?? d.subject} required /></label>
                  <label className="grid gap-1 text-sm"><span>本文</span><textarea name="body" rows={7} defaultValue={current?.body ?? d.body} required /></label>
                  <div><Button>保存</Button></div>
                </form>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
