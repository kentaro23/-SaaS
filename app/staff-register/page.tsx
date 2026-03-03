import Link from "next/link";
import { createStaffUserAction } from "@/lib/actions";
import { requireOwnerUser } from "@/lib/session";
import { Card, PageTitle, InputRow, Button } from "@/components/ui";

export default async function StaffRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  await requireOwnerUser();
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
      <PageTitle title="新規社員登録" subtitle="オーナーアカウントのみ登録可能" action={<Link href="/admin/societies" className="text-sm">管理画面へ戻る</Link>} />
      <Card>
        <form action={createStaffUserAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="redirectTo" value="/staff-register" />
          <InputRow label="氏名" name="name" required />
          <InputRow label="メールアドレス" name="email" type="email" required />
          <InputRow label="パスワード" name="password" type="text" required />
          <div className="md:col-span-2">
            <Button>社員アカウントを登録</Button>
          </div>
        </form>
        {sp.created === "1" ? <p className="mt-3 text-sm text-emerald-700">社員アカウントを登録しました。</p> : null}
      </Card>
    </div>
  );
}
