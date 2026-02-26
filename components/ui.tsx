import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-card", className)}>{children}</section>;
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const { className, variant = "primary", type = "submit", ...rest } = props;
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium",
        variant === "primary" && "bg-teal-700 text-white hover:bg-teal-800",
        variant === "secondary" && "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        className,
      )}
      {...rest}
    />
  );
}

export function InputRow({ label, name, type = "text", defaultValue, required, placeholder }: { label: string; name: string; type?: string; defaultValue?: string | number; required?: boolean; placeholder?: string; }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue as any} required={required} placeholder={placeholder} />
    </label>
  );
}

export function SelectRow({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string; options: Array<{ value: string; label: string }>; }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select name={name} defaultValue={defaultValue}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function CheckboxRow({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4" />
      <span>{label}</span>
    </label>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200"> <table className="min-w-full divide-y divide-slate-200 text-sm">{children}</table> </div>;
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="bg-slate-50 px-3 py-2 text-left font-medium text-slate-700">{children}</th>;
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2 align-top text-slate-800", className)}>{children}</td>;
}

export function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link href={href} className={cn("block rounded-lg px-3 py-2 text-sm", active ? "bg-teal-700 text-white hover:text-white" : "text-slate-700 hover:bg-slate-100")}>{label}</Link>
  );
}

export function StatusBadge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "yellow" | "red" | "blue" }) {
  const toneClass = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    blue: "bg-sky-100 text-sky-700",
  }[tone];
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", toneClass)}>{children}</span>;
}
