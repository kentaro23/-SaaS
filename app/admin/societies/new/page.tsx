import Link from "next/link";
import { createSocietyAction } from "@/lib/actions";
import { Card, PageTitle, InputRow, SelectRow, Button } from "@/components/ui";
import { societyStatusOptions } from "@/lib/labels";

export default function NewSocietyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
      <PageTitle title="学会新規作成" action={<Link href="/admin/societies" className="text-sm">一覧へ戻る</Link>} />
      <Card>
        <form action={createSocietyAction} className="grid gap-4 md:grid-cols-2">
          <InputRow label="学会名" name="name" required />
          <InputRow label="略称" name="shortName" required />
          <InputRow label="連絡先メール" name="contactEmail" type="email" required />
          <InputRow label="請求先メール" name="billingEmail" type="email" required />
          <InputRow label="会費体系" name="feeSystem" placeholder="例: 正会員10,000円 / 学生5,000円" />
          <InputRow label="委員会頻度" name="committeeFrequency" placeholder="例: 月1回 / 四半期1回" />
          <InputRow label="担当者名" name="liaisonName" />
          <InputRow label="担当者メール" name="liaisonEmail" type="email" />
          <InputRow label="担当者電話" name="liaisonPhone" />
          <SelectRow label="状態" name="status" defaultValue="ACTIVE" options={societyStatusOptions} />
          <div className="md:col-span-2"><Button>作成</Button></div>
        </form>
      </Card>
    </div>
  );
}
