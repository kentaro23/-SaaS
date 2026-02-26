import Link from "next/link";
import { saveMemberAction } from "@/lib/actions";
import { Card, PageTitle, InputRow, SelectRow, Button } from "@/components/ui";

export default async function NewMemberPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const action = saveMemberAction.bind(null, societyId);
  return (
    <div className="space-y-5">
      <PageTitle title="会員新規作成" action={<Link href={`/t/${societyId}/members`} className="text-sm">一覧へ戻る</Link>} />
      <Card>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <InputRow label="会員番号" name="memberNo" required />
          <InputRow label="氏名" name="name" required />
          <InputRow label="かな" name="kana" />
          <InputRow label="所属" name="affiliation" required />
          <InputRow label="メール" name="email" type="email" required />
          <InputRow label="電話" name="phone" />
          <InputRow label="会員種別" name="memberType" required placeholder="正会員" />
          <InputRow label="役職" name="position" />
          <SelectRow label="状態" name="status" defaultValue="ACTIVE" options={[{ value: "ACTIVE", label: "active" }, { value: "INACTIVE", label: "inactive" }]} />
          <InputRow label="入会日" name="joinedAt" type="date" required />
          <label className="md:col-span-2 grid gap-1 text-sm"><span className="font-medium text-slate-700">住所</span><textarea name="address" rows={3} required /></label>
          <div className="md:col-span-2"><Button>保存</Button></div>
        </form>
      </Card>
    </div>
  );
}
