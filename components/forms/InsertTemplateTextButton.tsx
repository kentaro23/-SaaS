"use client";

type Props = {
  targetId: string;
  text: string;
  label?: string;
};

export function InsertTemplateTextButton({ targetId, text, label = "振込案内を挿入" }: Props) {
  return (
    <button
      type="button"
      className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
      onClick={() => {
        const el = document.getElementById(targetId) as HTMLTextAreaElement | null;
        if (!el) return;
        const sep = el.value.trim().length ? "\n\n" : "";
        el.value = `${el.value}${sep}${text}`;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }}
    >
      {label}
    </button>
  );
}
