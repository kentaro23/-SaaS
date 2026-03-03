import { getTenantContext } from "@/lib/tenant";
import { approveEmailApprovalAction, createEmailApprovalAction, sendApprovedEmailAction, upsertEmailTemplateAction } from "@/lib/actions";
import { Card, PageTitle, Button, StatusBadge } from "@/components/ui";
import { emailApprovalStatusLabel, emailSendStatusLabel, invoiceStatusOptions } from "@/lib/labels";
import { presetsByCategory } from "@/lib/email-template-presets";
import { formatDateTime } from "@/lib/utils";

export default async function MailingsPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const [templates, approvals] = await Promise.all([repo.listEmailTemplates(), repo.listEmailApprovals()]);
  const presets = presetsByCategory("mailing");
  const presetKeys = new Set(presets.map((p) => p.key));
  const templateByKey = new Map(templates.map((t) => [t.key, t]));
  const targetApprovals = approvals.filter((a) => presetKeys.has(a.templateKey));

  return (
    <div className="space-y-5">
      <PageTitle title="メール送信" subtitle="請求案内メールのプレビュー / 承認 / 送信" />

      <Card>
        <h2 className="mb-3 font-semibold">送信承認フロー作成</h2>
        <form action={createEmailApprovalAction.bind(null, societyId)} className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm"><span>タイトル</span><input name="title" placeholder="2026年度 年会費請求案内" required /></label>
          <label className="grid gap-1 text-sm">
            <span>テンプレート</span>
            <select name="templateKey" defaultValue="annual_invoice">
              {presets.map((p) => <option key={p.key} value={p.key}>{templateByKey.get(p.key)?.name ?? p.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm"><span>年度（任意）</span><input name="fiscalYear" type="number" placeholder="2026" /></label>
          <label className="grid gap-1 text-sm"><span>請求状態（任意）</span><select name="invoiceStatus" defaultValue=""><option value="">指定なし</option>{invoiceStatusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input name="overdueOnly" type="checkbox" className="h-4 w-4" />期限超過のみ抽出</label>
          <div className="md:col-span-2"><Button>プレビュー作成（承認依頼起票）</Button></div>
        </form>
        <p className="mt-3 text-xs text-slate-500">承認済みでないと送信できません。送信元は「設定: メール送信」の学会別設定が使われます。</p>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">承認依頼一覧（請求案内）</h2>
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
        <h2 className="mb-3 font-semibold">テンプレート編集（請求案内）</h2>
        <div className="grid gap-4">
          {presets.map((p) => {
            const current = templateByKey.get(p.key);
            return (
              <form key={p.key} action={upsertEmailTemplateAction.bind(null, societyId)} className="grid gap-2 rounded-xl border border-slate-200 p-3">
                <input type="hidden" name="key" value={p.key} />
                <label className="grid gap-1 text-sm"><span>表示名</span><input name="name" defaultValue={current?.name ?? p.name} required /></label>
                <label className="grid gap-1 text-sm"><span>件名</span><input name="subject" defaultValue={current?.subject ?? p.subject} required /></label>
                <label className="grid gap-1 text-sm"><span>本文</span><textarea name="body" rows={6} defaultValue={current?.body ?? p.body} required /></label>
                <div><Button variant="secondary">テンプレート保存</Button></div>
              </form>
            );
          })}
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
