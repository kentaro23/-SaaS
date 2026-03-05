import { getTenantContext } from "@/lib/tenant";
import {
  savePlanAction,
  saveSocietyMailSettingsAction,
  saveSocietySettingsAction,
  sendMailSettingsTestAction,
} from "@/lib/actions";
import { AuditLogPanel } from "@/components/AuditLogPanel";
import { Button, Card, InputRow, PageTitle, SelectRow } from "@/components/ui";
import { corePlanOptions, optionDefinitions } from "@/lib/plan-catalog";
import { mailProviderOptions, societyStatusOptions } from "@/lib/labels";
import { toDateInput } from "@/lib/utils";

export default async function SocietySettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ societyId: string }>;
  searchParams: Promise<{ mailTest?: string }>;
}) {
  const { societyId } = await params;
  const sp = await searchParams;
  const { repo, society } = await getTenantContext(societyId, "ADMIN");
  const [plan, settings, logs] = await Promise.all([
    repo.getPlan(),
    repo.getSocietyMailSettings(),
    repo.latestAuditLogs(20),
  ]);

  return (
    <div className="space-y-5">
      <PageTitle title="学会設定" subtitle="学会情報 / 費用 / 振込口座 / 契約プラン / メール設定" />

      <Card>
        <h2 className="mb-3 font-semibold">学会基本情報・料金・振込口座</h2>
        <form action={saveSocietySettingsAction.bind(null, societyId)} className="grid gap-4 md:grid-cols-2">
          <InputRow label="学会名" name="name" required defaultValue={society.name} />
          <InputRow label="略称" name="shortName" required defaultValue={society.shortName} />
          <InputRow label="連絡先メール" name="contactEmail" type="email" required defaultValue={society.contactEmail} />
          <InputRow label="請求先メール" name="billingEmail" type="email" required defaultValue={society.billingEmail} />
          <InputRow label="会費体系" name="feeSystem" defaultValue={society.feeSystem ?? ""} />
          <InputRow label="委員会頻度" name="committeeFrequency" defaultValue={society.committeeFrequency ?? ""} />
          <InputRow label="担当者名" name="liaisonName" defaultValue={society.liaisonName ?? ""} />
          <InputRow label="担当者メール" name="liaisonEmail" type="email" defaultValue={society.liaisonEmail ?? ""} />
          <InputRow label="担当者電話" name="liaisonPhone" defaultValue={society.liaisonPhone ?? ""} />
          <InputRow label="入会金 (JPY)" name="admissionFee" type="number" defaultValue={society.admissionFee ?? ""} />
          <InputRow label="年会費 (JPY)" name="annualFee" type="number" defaultValue={society.annualFee ?? ""} />
          <SelectRow label="状態" name="status" defaultValue={society.status} options={societyStatusOptions} />

          <div className="md:col-span-2 mt-1 border-t border-slate-200 pt-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">振込口座</h3>
          </div>
          <InputRow label="銀行名" name="bankName" defaultValue={society.bankName ?? ""} />
          <InputRow label="支店名" name="bankBranch" defaultValue={society.bankBranch ?? ""} />
          <InputRow label="口座種別" name="bankAccountType" defaultValue={society.bankAccountType ?? "普通"} />
          <InputRow label="口座番号" name="bankAccountNumber" defaultValue={society.bankAccountNumber ?? ""} />
          <InputRow label="口座名義" name="bankAccountHolder" defaultValue={society.bankAccountHolder ?? ""} />
          <label className="md:col-span-2 grid gap-1 text-sm">
            <span className="font-medium text-slate-700">振込備考</span>
            <textarea name="bankNote" rows={3} defaultValue={society.bankNote ?? ""} />
          </label>

          <div className="md:col-span-2"><Button>学会情報を保存</Button></div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">契約プラン</h2>
        <form action={savePlanAction.bind(null, societyId)} className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">コアプラン</span>
            <select name="planName" defaultValue={plan?.planName ?? "Core-Standard"}>
              {corePlanOptions.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <InputRow label="月額料金 (JPY)" name="monthlyFee" type="number" required defaultValue={plan?.monthlyFee ?? 0} />
          <InputRow label="開始日" name="startDate" type="date" required defaultValue={toDateInput(plan?.startDate)} />
          <InputRow label="終了日" name="endDate" type="date" defaultValue={toDateInput(plan?.endDate)} />

          <div className="md:col-span-2 grid gap-3 rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800">オプション契約</h3>
            {optionDefinitions.map((opt) => (
              <label key={opt.field} className="flex items-start gap-3 text-sm">
                <input
                  name={opt.field}
                  type="checkbox"
                  defaultChecked={(plan?.[opt.field as "electionSupport" | "shipmentSupport" | "committeeSupport" | "accountingSupport"] as boolean | undefined) ?? false}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block font-medium text-slate-800">{opt.label}</span>
                  <span className="block text-xs text-slate-500">{opt.description}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="md:col-span-2"><Button>プランを保存</Button></div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">メール送信設定</h2>
        <form action={saveSocietyMailSettingsAction.bind(null, societyId)} className="grid gap-4 md:grid-cols-2">
          <SelectRow label="送信プロバイダ" name="mailProvider" defaultValue={settings?.mailProvider ?? "smtp"} options={mailProviderOptions} />
          <InputRow label="送信元アドレス（From）" name="mailFrom" type="email" defaultValue={settings?.mailFrom ?? ""} />
          <InputRow label="SMTP Host" name="smtpHost" defaultValue={settings?.smtpHost ?? ""} />
          <InputRow label="SMTP Port" name="smtpPort" type="number" defaultValue={settings?.smtpPort ?? 587} />
          <InputRow label="SMTP User" name="smtpUser" defaultValue={settings?.smtpUser ?? ""} />
          <InputRow label="SMTP Password / App Password" name="smtpPass" type="password" defaultValue={settings?.smtpPass ?? ""} />
          <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
            <input type="checkbox" name="smtpSecure" className="h-4 w-4" defaultChecked={settings?.smtpSecure ?? false} />
            TLS/SSL を使用する
          </label>
          <InputRow label="Gmail API Sender（将来用）" name="gmailSender" type="email" defaultValue={settings?.gmailSender ?? ""} />
          <div className="md:col-span-2"><Button variant="secondary">メール設定を保存</Button></div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">テスト送信</h2>
        <form action={sendMailSettingsTestAction.bind(null, societyId)} className="grid gap-3 md:grid-cols-[1fr,auto]">
          <InputRow label="テスト送信先メールアドレス" name="testTo" type="email" required />
          <div className="self-end"><Button variant="secondary">テストメール送信</Button></div>
        </form>
        {sp.mailTest === "ok" ? <p className="mt-2 text-sm text-emerald-700">テスト送信に成功しました。</p> : null}
      </Card>

      <AuditLogPanel
        logs={logs.filter((l) => l.resourceType === "SOCIETY" || l.resourceType === "PLAN_CHANGE" || l.resourceType === "SOCIETY_PLAN")}
      />
    </div>
  );
}
