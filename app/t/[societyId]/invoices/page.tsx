import { getTenantContext } from "@/lib/tenant";
import { generateAnnualInvoicesAction, generateReceiptAction, updateInvoiceAction, upsertEmailTemplateAction } from "@/lib/actions";
import { PageTitle, Card, Table, Th, Td, Button, StatusBadge } from "@/components/ui";
import { invoiceStatusLabel, invoiceStatusOptions, paymentMethodOptions } from "@/lib/labels";
import { presetsByCategory } from "@/lib/email-template-presets";
import { formatCurrencyJPY, formatDate } from "@/lib/utils";

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

  const [invoices, templates] = await Promise.all([repo.listInvoices({ fiscalYear, status }), repo.listEmailTemplates()]);
  const annualAction = generateAnnualInvoicesAction.bind(null, societyId);
  const invoiceAction = updateInvoiceAction.bind(null, societyId);
  const presetTemplates = presetsByCategory("invoice");
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
      .filter((t) => t.key.startsWith("invoice_") && !presetTemplates.some((p) => p.key === t.key))
      .map((t) => ({ id: t.id, key: t.key, name: t.name, subject: t.subject, body: t.body })),
  ];

  return (
    <div className="space-y-5">
      <PageTitle title="請求管理" subtitle="年会費請求 / ステータス更新 / 領収書発行" />

      <Card>
        <h2 className="mb-3 font-semibold">年会費一括生成</h2>
        <form action={annualAction} className="grid gap-3 md:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
          <label className="grid min-w-0 gap-1 text-sm">
            <span>年度</span>
            <input className="w-full min-w-0" name="fiscalYear" type="number" defaultValue={new Date().getFullYear()} required />
          </label>
          <label className="grid min-w-0 gap-1 text-sm">
            <span>金額</span>
            <input className="w-full min-w-0" name="amount" type="number" defaultValue={10000} required />
          </label>
          <label className="grid min-w-0 gap-1 text-sm">
            <span>支払期限</span>
            <input className="w-full min-w-0" name="dueDate" type="date" required />
          </label>
          <div className="md:col-span-2 lg:col-span-1 lg:self-end">
            <Button className="w-full lg:w-auto">一括生成</Button>
          </div>
        </form>
      </Card>

      <Card>
        <form className="mb-4 grid gap-3 md:grid-cols-[160px,180px,auto]">
          <input type="number" name="fiscalYear" defaultValue={sp.fiscalYear ?? ""} placeholder="年度" />
          <select name="status" defaultValue={status}>
            <option value="ALL">全状態</option>
            {invoiceStatusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                  <StatusBadge tone={inv.status === "PAID" ? "green" : inv.status === "OVERDUE" ? "red" : inv.status === "SENT" ? "blue" : "yellow"}>{invoiceStatusLabel(inv.status)}</StatusBadge>
                </Td>
                <Td>
                  <form action={invoiceAction} className="grid gap-2">
                    <input type="hidden" name="invoiceId" value={inv.id} />
                    <select name="status" defaultValue={inv.status} className="text-xs">
                      {invoiceStatusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select name="paymentMethod" defaultValue={inv.paymentMethod ?? ""} className="text-xs">
                      <option value="">-</option>
                      {paymentMethodOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
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

      <Card>
        <h2 className="mb-3 font-semibold">テンプレート管理（請求）</h2>
        <form action={upsertEmailTemplateAction.bind(null, societyId)} className="mb-4 grid gap-2 rounded-xl border border-dashed border-slate-300 p-3">
          <h3 className="text-sm font-medium">新規テンプレート追加</h3>
          <label className="grid gap-1 text-sm"><span>テンプレートキー（`invoice_` で開始）</span><input name="key" placeholder="invoice_annual_notice" required /></label>
          <label className="grid gap-1 text-sm"><span>表示名</span><input name="name" placeholder="年会費請求案内" required /></label>
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
