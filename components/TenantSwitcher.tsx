import Link from "next/link";

export function TenantSwitcher({ currentSocietyId, memberships }: { currentSocietyId: string; memberships: Array<any> }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">学会切替</div>
      <div className="grid gap-2">
        {memberships.map((m) => (
          <Link
            key={m.societyId}
            href={`/t/${m.societyId}`}
            className={`rounded-lg px-3 py-2 text-sm ${m.societyId === currentSocietyId ? "bg-teal-700 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
          >
            <div className="font-medium">{m.society.shortName}</div>
            <div className={`text-xs ${m.societyId === currentSocietyId ? "text-teal-100" : "text-slate-500"}`}>{m.role}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
