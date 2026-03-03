import { getTenantContext } from "@/lib/tenant";
import { approveEmailApprovalAction, createEmailApprovalAction, markOverdueAction, sendApprovedEmailAction, upsertEmailTemplateAction } from "@/lib/actions";
import { Card, PageTitle, Button, StatusBadge } from "@/components/ui";
import { emailApprovalStatusLabel, emailSendStatusLabel, invoiceStatusOptions } from "@/lib/labels";
import { presetsByCategory } from "@/lib/email-template-presets";
import { formatDateTime } from "@/lib/utils";

export default async function RemindersPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const [templates, approvals] = await Promise.all([repo.listEmailTemplates(), repo.listEmailApprovals()]);
  const presetTemplates = presetsByCategory("reminder");
  const templateByKey = new Map(templates.map((t) => [t.key, t]));
  const managedTemplates = [
    ...presetTemplates.map((p) => {
      const saved = templateByKey.get(p.key);
      return {
        id: saved?.id ?? `preset-${p.key}`,
        key: p.key,
        name: saved?.name ?? p.name,
        subject: saved?.subject ?? p.subject,
        body: saved?.body ?? p.body,
      };
    }),
    ...templates
      .filter((t) => t.key.startsWith("reminder_") && !presetTemplates.some((p) => p.key === t.key))
      .map((t) => ({ id: t.id, key: t.key, name: t.name, subject: t.subject, body: t.body })),
  ];
  const approvalTemplates = new Set(managedTemplates.map((t) => t.key));
  const targetApprovals = approvals.filter((a) => approvalTemplates.has(a.templateKey));

  return (
    <div className="space-y-5">
      <PageTitle title="督促" subtitle="期限超過判定 / 督促メールの承認送信" />

      <Card>
        <h2 className="mb-3 font-semibold">督促準備（期限超過判定）</h2>
        <form action={markOverdueAction.bind(null, societyId)}>
          <Button>期限超過を「期限超過」に更新</Button>
        </form>
        <p className="mt-2 text-xs text-slate-500">支払期限が今日より前、かつ状態が「承認済み/送信済み」の請求が対象です。</p>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">督促承認フロー作成</h2>
        <form action={createEmailApprovalAction.bind(null, societyId)} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="targetScope" value="INVOICE" />
          <label className="grid gap-1 text-sm"><span>タイトル</span><input name="title" placeholder="2026年度 督促1回目" required /></label>
          <label className="grid gap-1 text-sm">
            <span>テンプレート</span>
            <select name="templateKey" defaultValue={managedTemplates[0]?.key ?? "reminder_1"}>
              {managedTemplates.map((t) => <option key={t.id} value={t.key}>{t.name} ({t.key})</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm"><span>年度（任意）</span><input name="fiscalYear" type="number" placeholder="2026" /></label>
          <label className="grid gap-1 text-sm"><span>請求状態（任意）</span><select name="invoiceStatus" defaultValue="OVERDUE"><option value="">指定なし</option>{invoiceStatusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input name="overdueOnly" type="checkbox" className="h-4 w-4" defaultChecked />期限超過のみ抽出</label>
          <div className="md:col-span-2"><Button>プレビュー作成（承認依頼起票）</Button></div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">承認依頼一覧（督促）</h2>
        <div className="space-y-3">
          {targetApprovals.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium">{a.title}</div>
                <StatusBadge tone={a.status === "APPROVED" ? "green" : a.status === "SENT" ? "blue" : "yellow"}>{emailApprovalStatusLabel(a.status)}</StatusBadge>
                <span className="text-xs text-slate-500">{a.templateKey}</span>
                <span className="text-xs text-slate-400">{formatDateTime(a.createdAt)}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">対象件数: {a._count.recipients}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.status === "DRAFT" ? (
                  <form action={approveEmailApprovalAction.bind(null, societyId)}>
                    <input type="hidden" name="approvalId" value={a.id} />
                    <Button variant="secondary">承認</Button>
                  </form>
                ) : null}
                {a.status === "APPROVED" ? (
                  <form action={sendApprovedEmailAction.bind(null, societyId)}>
                    <input type="hidden" name="approvalId" value={a.id} />
                    <Button>送信実行</Button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
          {targetApprovals.length === 0 ? <p className="text-sm text-slate-500">承認依頼はまだありません。</p> : null}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">送信プレビュー（最新）</h2>
        {targetApprovals[0] ? (
          <EmailApprovalPreview societyId={societyId} approvalId={targetApprovals[0].id} />
        ) : (
          <p className="text-sm text-slate-500">承認依頼を作成するとここにプレビューが表示されます。</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">テンプレート管理（督促）</h2>
        <form action={upsertEmailTemplateAction.bind(null, societyId)} className="mb-4 grid gap-2 rounded-xl border border-dashed border-slate-300 p-3">
          <h3 className="text-sm font-medium">新規テンプレート追加</h3>
          <label className="grid gap-1 text-sm"><span>テンプレートキー（`reminder_` で開始）</span><input name="key" placeholder="reminder_2" required /></label>
          <label className="grid gap-1 text-sm"><span>表示名</span><input name="name" placeholder="督促2回目" required /></label>
          <label className="grid gap-1 text-sm"><span>件名</span><input name="subject" required /></label>
          <label className="grid gap-1 text-sm"><span>本文</span><textarea name="body" rows={4} required /></label>
          <div><Button variant="secondary">追加</Button></div>
        </form>
        <div className="grid gap-4">
          {managedTemplates.map((t) => (
            <form key={t.id} action={upsertEmailTemplateAction.bind(null, societyId)} className="grid gap-2 rounded-xl border border-slate-200 p-3">
              <input type="hidden" name="key" value={t.key} />
              <label className="grid gap-1 text-sm"><span>表示名</span><input name="name" defaultValue={t.name} required /></label>
              <label className="grid gap-1 text-sm"><span>件名</span><input name="subject" defaultValue={t.subject} required /></label>
              <label className="grid gap-1 text-sm"><span>本文</span><textarea name="body" rows={6} defaultValue={t.body} required /></label>
              <div className="text-xs text-slate-500">key: {t.key}</div>
              <div><Button variant="secondary">保存</Button></div>
            </form>
          ))}
        </div>
      </Card>
    </div>
  );
}

async function EmailApprovalPreview({ societyId, approvalId }: { societyId: string; approvalId: string }) {
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const approval = await repo.getEmailApproval(approvalId);
  if (!approval) return null;
  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600">{approval.title} / {emailApprovalStatusLabel(approval.status)}</div>
      <div className="max-h-96 space-y-3 overflow-auto pr-2">
        {approval.recipients.slice(0, 10).map((r) => (
          <div key={r.id} className="rounded-lg border border-slate-200 p-3">
            <div className="text-sm font-medium">宛先: {r.to}</div>
            <div className="mt-1 text-sm">件名: {r.subject}</div>
            <pre className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs text-slate-700">{r.bodyRendered}</pre>
            <div className="mt-2 text-xs text-slate-500">状態: {emailSendStatusLabel(r.status)}</div>
          </div>
        ))}
      </div>
      {approval.recipients.length > 10 ? <div className="text-xs text-slate-500">先頭10件のみ表示（全{approval.recipients.length}件）</div> : null}
    </div>
  );
}
