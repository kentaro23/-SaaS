import { getTenantContext } from "@/lib/tenant";
import { saveSocietyMailSettingsAction } from "@/lib/actions";
import { Card, PageTitle, Button, SelectRow } from "@/components/ui";

export default async function MailSettingsPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const { repo, society } = await getTenantContext(societyId, "READ_ONLY");
  const settings = await repo.getSocietyMailSettings();
  const action = saveSocietyMailSettingsAction.bind(null, societyId);

  return (
    <div className="space-y-5">
      <PageTitle title="メール送信設定" subtitle={`${society.name} 専用の送信設定（学会ごと）`} />
      <Card>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <SelectRow
            label="送信プロバイダ"
            name="mailProvider"
            defaultValue={settings?.mailProvider ?? "smtp"}
            options={[
              { value: "smtp", label: "smtp" },
              { value: "gmail_api", label: "gmail_api(準備中)" },
              { value: "console", label: "console(dev)" },
            ]}
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
    </div>
  );
}
