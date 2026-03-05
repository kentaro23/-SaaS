import Link from "next/link";
import { saveMemberAction } from "@/lib/actions";
import { Card, PageTitle, InputRow, SelectRow, Button } from "@/components/ui";
import { AddressFields } from "@/components/forms/AddressFields";
import { societyStatusOptions } from "@/lib/labels";

export default async function NewMemberPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const action = saveMemberAction.bind(null, societyId);
  return (
    <div className="space-y-5">
      <PageTitle title="会員新規作成" action={<Link href={`/t/${societyId}/members`} className="text-sm">一覧へ戻る</Link>} />
      <Card>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <InputRow label="会員番号" name="memberNo" required />
          <InputRow label="姓" name="familyName" required />
          <InputRow label="名" name="givenName" required />
          <InputRow label="姓かな" name="kanaFamily" required />
          <InputRow label="名かな" name="kanaGiven" required />
          <InputRow label="所属" name="affiliation" required />
          <InputRow label="メール" name="email" type="email" required />
          <InputRow label="電話" name="phone" />
          <InputRow label="会員種別" name="memberType" required placeholder="正会員" />
          <InputRow label="役職" name="position" />
          <SelectRow label="状態" name="status" defaultValue="ACTIVE" options={societyStatusOptions} />
          <InputRow label="入会日" name="joinedAt" type="date" required />
          <AddressFields />
          <div className="md:col-span-2"><Button>保存</Button></div>
        </form>
      </Card>
    </div>
  );
}
