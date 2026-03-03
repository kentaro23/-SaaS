import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { saveSocietyStaffAction } from "@/lib/actions";
import { Card, PageTitle, Button, SelectRow, Table, Th, Td } from "@/components/ui";
import { roleLabel, roleOptions, userStatusLabel } from "@/lib/labels";

export default async function StaffSettingsPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  const { repo } = await getTenantContext(societyId, "READ_ONLY");
  const [memberships, users] = await Promise.all([repo.listSocietyStaff(), prisma.user.findMany({ orderBy: { name: "asc" } })]);

  return (
    <div className="space-y-5">
      <PageTitle title="運営メンバー管理" subtitle="テナント単位のRBAC（オーナー/管理者/担当/閲覧のみ）" />
      <Card>
        <form action={saveSocietyStaffAction.bind(null, societyId)} className="grid gap-3 md:grid-cols-[1fr,200px,auto]">
          <label className="grid gap-1 text-sm"><span>ユーザ</span><select name="userId">{users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}</select></label>
          <SelectRow label="権限" name="role" defaultValue="STAFF" options={roleOptions} />
          <div className="self-end"><Button>追加/更新</Button></div>
        </form>
      </Card>
      <Card>
        <Table>
          <thead><tr><Th>ユーザ</Th><Th>権限</Th><Th>状態</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {memberships.map((m) => (
              <tr key={m.id}><Td>{m.user.name}<div className="text-xs text-slate-500">{m.user.email}</div></Td><Td>{roleLabel(m.role)}</Td><Td>{userStatusLabel(m.user.status)}</Td></tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
