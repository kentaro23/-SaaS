import { notFound } from "next/navigation";
import { submitPublicMemberRegistrationAction } from "@/lib/actions";
import { prefectureOptions } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

const errorMessageMap: Record<string, string> = {
  unavailable: "この登録フォームは現在利用できません。",
  invalid: "入力内容に不備があります。必須項目を確認してください。",
};

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const form = await prisma.publicMemberForm.findUnique({
    where: { slug },
    include: {
      society: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  if (!form || !form.enabled || form.society.status !== "ACTIVE") {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6 md:p-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card md:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">{form.title}</h1>
        <p className="mt-2 text-sm text-slate-600">対象学会: {form.society.name}</p>
        {form.description ? <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{form.description}</p> : null}

        {sp.success ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            登録を受け付けました。ありがとうございました。
          </div>
        ) : null}
        {sp.error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessageMap[sp.error] ?? "登録に失敗しました。時間を置いて再度お試しください。"}
          </div>
        ) : null}

        <form action={submitPublicMemberRegistrationAction.bind(null, slug)} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">姓</span>
            <input name="familyName" required />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">名</span>
            <input name="givenName" required />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">かな</span>
            <input name="kana" required />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">所属</span>
            <input name="affiliation" required />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">メールアドレス</span>
            <input name="email" type="email" required />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">郵便番号（ハイフンあり）</span>
            <input name="postalCode" required placeholder="123-4567" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">都道府県</span>
            <select name="prefecture" required defaultValue="東京都">
              {prefectureOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">市区町村</span>
            <input name="city" required />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">番地</span>
            <input name="addressLine1" required />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">建物名・部屋番号（任意）</span>
            <input name="addressLine2" />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">電話番号（任意）</span>
            <input name="phone" />
          </label>
          {form.allowMemberTypeInput ? (
            <label className="grid gap-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">会員種別（任意）</span>
              <input name="memberType" placeholder={form.defaultMemberType} />
            </label>
          ) : (
            <div className="text-sm text-slate-600 md:col-span-2">
              会員種別: <span className="font-medium text-slate-900">{form.defaultMemberType}</span>
            </div>
          )}
          <div className="md:col-span-2">
            <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white">この内容で登録する</button>
          </div>
        </form>
      </div>
    </main>
  );
}
