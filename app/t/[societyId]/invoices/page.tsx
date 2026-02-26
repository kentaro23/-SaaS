import { getTenantContext } from "@/lib/tenant";
import {
  approveEmailApprovalAction,
  createEmailApprovalAction,
  generateAnnualInvoicesAction,
  generateReceiptAction,
  markOverdueAction,
  sendApprovedEmailAction,
  updateInvoiceAction,
} from "@/lib/actions";
import { PageTitle, Card, Table, Th, Td, Button, StatusBadge } from "@/components/ui";
import { formatCurrencyJPY, formatDate, formatDateTime } from "@/lib/utils";

export default async function InvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ societyId: string }>;
  searchParams: Promise<{ fiscalYear?: string; status?: string }>;
}) {
  const { societyId } = await params;
  const sp = await searchParams;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const fiscalYear = sp.fiscalYear ? Number(sp.fiscalYear) : undefined;
  const status = sp.status ?? "ALL";

  const [invoices, templates, approvals] = await Promise.all([
    repo.listInvoices({ fiscalYear, status }),
    repo.listEmailTemplates(),
    repo.listEmailApprovals(),
  ]);

  const annualAction = generateAnnualInvoicesAction.bind(null, societyId);
  const invoiceAction = updateInvoiceAction.bind(null, societyId);
  const createApproval = createEmailApprovalAction.bind(null, societyId);
  const doMarkOverdue = markOverdueAction.bind(null, societyId);

  return (
    <div className="space-y-5">
      <PageTitle title="請求・督促" subtitle="年会費請求 / 一括メール承認フロー / 領収書" />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">年会費一括生成</h2>
          <form action={annualAction} className="grid gap-3 md:grid-cols-4">
            <label className="grid gap-1 text-sm"><span>年度</span><input name="fiscalYear" type="number" defaultValue={new Date().getFullYear()} required /></label>
            <label className="grid gap-1 text-sm"><span>金額</span><input name="amount" type="number" defaultValue={10000} required /></label>
            <label className="grid gap-1 text-sm"><span>支払期限</span><input name="dueDate" type="date" required /></label>
            <div className="self-end"><Button>一括生成</Button></div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">督促準備（期限超過判定）</h2>
          <form action={doMarkOverdue}>
            <Button>期限超過を OVERDUE に更新</Button>
          </form>
          <p className="mt-2 text-xs text-slate-500">`dueDate &lt; today` かつ `APPROVED/SENT` の請求が対象です。</p>
        </Card>
      </div>

      <Card>
        <form className="mb-4 grid gap-3 md:grid-cols-[160px,180px,auto]">
          <input type="number" name="fiscalYear" defaultValue={sp.fiscalYear ?? ""} placeholder="年度" />
          <select name="status" defaultValue={status}>
            <option value="ALL">全状態</option>
            <option value="DRAFT">DRAFT</option><option value="APPROVED">APPROVED</option><option value="SENT">SENT</option>
            <option value="PAID">PAID</option><option value="OVERDUE">OVERDUE</option><option value="CANCELLED">CANCELLED</option>
          </select>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">フィルタ</button>
        </form>

        <Table>
          <thead><tr><Th>会員</Th><Th>年度</Th><Th>金額</Th><Th>期限</Th><Th>状態</Th><Th>更新</Th><Th>領収書</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <Td><div className="font-medium">{inv.member.name}</div><div className="text-xs text-slate-500">{inv.member.memberNo} / {inv.member.email}</div></Td>
                <Td>{inv.fiscalYear}</Td>
                <Td>{formatCurrencyJPY(inv.amount)}</Td>
                <Td>{formatDate(inv.dueDate)}</Td>
                <Td>
                  <StatusBadge tone={inv.status === "PAID" ? "green" : inv.status === "OVERDUE" ? "red" : inv.status === "SENT" ? "blue" : "yellow"}>{inv.status}</StatusBadge>
                </Td>
                <Td>
                  <form action={invoiceAction} className="grid gap-2">
                    <input type="hidden" name="invoiceId" value={inv.id} />
                    <select name="status" defaultValue={inv.status} className="text-xs">
                      {['DRAFT','APPROVED','SENT','PAID','OVERDUE','CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select name="paymentMethod" defaultValue={inv.paymentMethod ?? ""} className="text-xs">
                      <option value="">-</option><option value="BANK_TRANSFER">bank_transfer</option><option value="CARD">card</option><option value="OTHER">other</option>
                    </select>
                    <input name="notes" placeholder="メモ" defaultValue={inv.notes ?? ""} className="text-xs" />
                    <Button variant="secondary">更新</Button>
                  </form>
                </Td>
                <Td>
                  {inv.receipt ? (
                    <a href={`/t/${societyId}/invoices/${inv.id}/receipt`} className="text-sm">PDF</a>
                  ) : (
                    <form action={generateReceiptAction.bind(null, societyId)}>
                      <input type="hidden" name="invoiceId" value={inv.id} />
                      <Button variant="secondary">発行</Button>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <h2 className="mb-3 font-semibold">一括メール送信（プレビュー→承認→送信）</h2>
          <form action={createApproval} className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm"><span>タイトル</span><input name="title" placeholder="2026年度 年会費請求メール" required /></label>
            <label className="grid gap-1 text-sm"><span>テンプレート</span><select name="templateKey">{templates.map((t) => <option key={t.id} value={t.key}>{t.key}</option>)}</select></label>
            <label className="grid gap-1 text-sm"><span>年度（任意）</span><input name="fiscalYear" type="number" placeholder="2026" /></label>
            <label className="grid gap-1 text-sm"><span>請求状態（任意）</span><select name="invoiceStatus" defaultValue=""><option value="">指定なし</option>{['DRAFT','APPROVED','SENT','PAID','OVERDUE','CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="flex items-center gap-2 text-sm md:col-span-2"><input name="overdueOnly" type="checkbox" className="h-4 w-4" />期限超過のみ抽出</label>
            <div className="md:col-span-2"><Button>プレビュー作成（承認依頼起票）</Button></div>
          </form>
          <p className="mt-3 text-xs text-slate-500">作成時に対象請求を抽出し、送信ログ（QUEUED）を生成します。Approved でないと送信できません。</p>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">承認依頼一覧</h2>
          <div className="space-y-3">
            {approvals.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium">{a.title}</div>
                  <StatusBadge tone={a.status === 'APPROVED' ? 'green' : a.status === 'SENT' ? 'blue' : 'yellow'}>{a.status}</StatusBadge>
                  <span className="text-xs text-slate-500">{a.templateKey}</span>
                  <span className="text-xs text-slate-400">{formatDateTime(a.createdAt)}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">対象件数: {a._count.recipients}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {a.status === 'DRAFT' ? (
                    <form action={approveEmailApprovalAction.bind(null, societyId)}>
                      <input type="hidden" name="approvalId" value={a.id} />
                      <Button variant="secondary">Approve</Button>
                    </form>
                  ) : null}
                  {a.status === 'APPROVED' ? (
                    <form action={sendApprovedEmailAction.bind(null, societyId)}>
                      <input type="hidden" name="approvalId" value={a.id} />
                      <Button>送信実行</Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
            {approvals.length === 0 ? <p className="text-sm text-slate-500">承認依頼はまだありません。</p> : null}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">送信プレビュー（最新承認依頼）</h2>
        {approvals[0] ? (
          <EmailApprovalPreview societyId={societyId} approvalId={approvals[0].id} />
        ) : (
          <p className="text-sm text-slate-500">承認依頼を作成するとここにプレビューが表示されます。</p>
        )}
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
      <div className="text-sm text-slate-600">{approval.title} / {approval.status}</div>
      <div className="max-h-96 space-y-3 overflow-auto pr-2">
        {approval.recipients.slice(0, 10).map((r) => (
          <div key={r.id} className="rounded-lg border border-slate-200 p-3">
            <div className="text-sm font-medium">To: {r.to}</div>
            <div className="mt-1 text-sm">Subject: {r.subject}</div>
            <pre className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs text-slate-700">{r.bodyRendered}</pre>
            <div className="mt-2 text-xs text-slate-500">status: {r.status}</div>
          </div>
        ))}
      </div>
      {approval.recipients.length > 10 ? <div className="text-xs text-slate-500">先頭10件のみ表示（全{approval.recipients.length}件）</div> : null}
    </div>
  );
}
