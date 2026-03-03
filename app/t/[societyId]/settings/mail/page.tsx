import { getTenantContext } from "@/lib/tenant";
import { saveSocietyMailSettingsAction, sendMailSettingsTestAction } from "@/lib/actions";
import { Card, PageTitle, Button, SelectRow } from "@/components/ui";
import { mailProviderOptions } from "@/lib/labels";

export default async function MailSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ societyId: string }>;
  searchParams: Promise<{ mailTest?: string }>;
}) {
  const { societyId } = await params;
  const sp = await searchParams;
  const { repo, society } = await getTenantContext(societyId, "READ_ONLY");
  const settings = await repo.getSocietyMailSettings();
  const action = saveSocietyMailSettingsAction.bind(null, societyId);
  const testAction = sendMailSettingsTestAction.bind(null, societyId);

  return (
    <div className="space-y-5">
      <PageTitle title="メール送信設定" subtitle={`${society.name} 専用の送信設定（学会ごと）`} />
      <Card>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <SelectRow
            label="送信プロバイダ"
            name="mailProvider"
            defaultValue={settings?.mailProvider ?? "smtp"}
            options={mailProviderOptions}
          />
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">送信元アドレス（From）</span>
            <input name="mailFrom" type="email" defaultValue={settings?.mailFrom ?? ""} placeholder="society-office@example.com" />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">SMTP Host</span>
            <input name="smtpHost" defaultValue={settings?.smtpHost ?? ""} placeholder="smtp.gmail.com" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">SMTP Port</span>
            <input name="smtpPort" type="number" defaultValue={settings?.smtpPort ?? 587} />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">SMTP User</span>
            <input name="smtpUser" defaultValue={settings?.smtpUser ?? ""} placeholder="gakkaidaiko@gmail.com" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">SMTP Password / App Password</span>
            <input name="smtpPass" type="password" defaultValue={settings?.smtpPass ?? ""} />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
            <input type="checkbox" name="smtpSecure" className="h-4 w-4" defaultChecked={settings?.smtpSecure ?? false} />
            TLS/SSL を使用する
          </label>

          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Gmail API Sender（将来用）</span>
            <input name="gmailSender" type="email" defaultValue={settings?.gmailSender ?? ""} placeholder="gakkaidaiko@gmail.com" />
          </label>

          <div className="md:col-span-2">
            <Button>保存</Button>
          </div>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          この設定は現在の学会（societyId）にのみ適用されます。他学会には影響しません。
        </p>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">テスト送信</h2>
        <form action={testAction} className="grid gap-3 md:grid-cols-[1fr,auto]">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">テスト送信先メールアドレス</span>
            <input name="testTo" type="email" required placeholder="you@example.com" />
          </label>
          <div className="self-end">
            <Button variant="secondary">テストメール送信</Button>
          </div>
        </form>
        {sp.mailTest === "ok" ? <p className="mt-2 text-sm text-emerald-700">テスト送信に成功しました。</p> : null}
      </Card>
    </div>
  );
}
