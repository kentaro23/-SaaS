import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createSocietyAdminRepo } from "@/lib/repositories/society-admin-repo";
import { assignSocietyStaffAdminAction, removeSocietyStaffAdminAction, updateSocietyAction, createDemoUserAction } from "@/lib/actions";
import { Card, PageTitle, InputRow, SelectRow, Button, Table, Th, Td } from "@/components/ui";
import { AuditLogPanel } from "@/components/AuditLogPanel";

export default async function AdminSocietyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const repo = createSocietyAdminRepo(user.id);
  const [society, users, logs] = await Promise.all([
    repo.getSociety(id),
    repo.listUsers(),
    prisma.auditLog.findMany({ where: { societyId: id }, include: { actor: true }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  if (!society) notFound();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 space-y-5">
      <PageTitle title={`${society.name} (${society.shortName})`} subtitle="基本情報 / 運営メンバー割当 / 監査ログ" />

      <Card>
        <h2 className="mb-3 font-semibold">基本情報</h2>
        <form action={updateSocietyAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={society.id} />
          <InputRow label="学会名" name="name" required defaultValue={society.name} />
          <InputRow label="略称" name="shortName" required defaultValue={society.shortName} />
          <InputRow label="連絡先メール" name="contactEmail" type="email" required defaultValue={society.contactEmail} />
          <InputRow label="請求先メール" name="billingEmail" type="email" required defaultValue={society.billingEmail} />
          <SelectRow label="状態" name="status" defaultValue={society.status} options={[{ value: "ACTIVE", label: "active" }, { value: "INACTIVE", label: "inactive" }]} />
          <div className="md:col-span-2"><Button>更新</Button></div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">運営メンバー割当</h2>
        <form action={assignSocietyStaffAdminAction} className="mb-4 grid gap-3 md:grid-cols-[1fr,220px,auto]">
          <input type="hidden" name="societyId" value={society.id} />
          <label className="grid gap-1 text-sm"><span>ユーザ</span><select name="userId">{users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}</select></label>
          <SelectRow label="Role" name="role" defaultValue="STAFF" options={[{ value: "OWNER", label: "Owner" }, { value: "ADMIN", label: "Admin" }, { value: "STAFF", label: "Staff" }, { value: "READ_ONLY", label: "ReadOnly" }]} />
          <div className="self-end"><Button>割当/更新</Button></div>
        </form>
        <Table>
          <thead><tr><Th>ユーザ</Th><Th>Role</Th><Th></Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {society.staff.map((m) => (
              <tr key={m.id}>
                <Td><div className="font-medium">{m.user.name}</div><div className="text-xs text-slate-500">{m.user.email}</div></Td>
                <Td>{m.role}</Td>
                <Td className="text-right">
                  <form action={removeSocietyStaffAdminAction}>
                    <input type="hidden" name="societyId" value={society.id} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <Button variant="secondary">解除</Button>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">社内ユーザ追加（デモ用）</h2>
        <form action={createDemoUserAction} className="grid gap-3 md:grid-cols-3">
          <InputRow label="名前" name="name" required />
          <InputRow label="Email" name="email" type="email" required />
          <InputRow label="Password" name="password" type="text" required defaultValue="password123" />
          <div className="md:col-span-3"><Button>ユーザ作成</Button></div>
        </form>
      </Card>

      <AuditLogPanel logs={logs} />
    </div>
  );
}
