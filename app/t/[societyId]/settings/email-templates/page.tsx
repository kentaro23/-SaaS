import { getTenantContext } from "@/lib/tenant";
import { upsertEmailTemplateAction } from "@/lib/actions";
import { Card, PageTitle, Button } from "@/components/ui";

const defaultTemplates = [
  {
    key: "annual_invoice",
    name: "年会費請求",
    subject: "{{fiscalYear}}年度 年会費のご請求（{{memberName}} 様）",
    body: "{{memberName}} 様\n\n{{fiscalYear}}年度 年会費 {{invoiceAmount}}円 のご請求です。\n支払期限: {{dueDate}}\n\nよろしくお願いいたします。",
  },
  {
    key: "reminder_1",
    name: "督促1回目",
    subject: "【ご確認】年会費のお支払い（{{memberName}} 様）",
    body: "{{memberName}} 様\n\n年会費 {{invoiceAmount}}円 が未納です。\n支払期限: {{dueDate}}\nご対応をお願いいたします。",
  },
];

export default async function EmailTemplatesPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const templates = await repo.listEmailTemplates();
  const byKey = new Map(templates.map((t) => [t.key, t]));

  return (
    <div className="space-y-5">
      <PageTitle title="メールテンプレート設定" subtitle="差し込み変数対応（{{memberName}}, {{fiscalYear}}, {{invoiceAmount}}, {{dueDate}}）" />
      <div className="grid gap-5">
        {defaultTemplates.map((d) => {
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
  );
}
