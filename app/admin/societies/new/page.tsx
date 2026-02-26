import Link from "next/link";
import { createSocietyAction } from "@/lib/actions";
import { Card, PageTitle, InputRow, SelectRow, Button } from "@/components/ui";

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
          <SelectRow label="状態" name="status" defaultValue="ACTIVE" options={[{ value: "ACTIVE", label: "active" }, { value: "INACTIVE", label: "inactive" }]} />
          <div className="md:col-span-2"><Button>作成</Button></div>
        </form>
      </Card>
    </div>
  );
}
