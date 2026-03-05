import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function JoinCompletedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await prisma.publicMemberForm.findUnique({
    where: { slug },
    include: {
      society: {
        select: {
          name: true,
          bankName: true,
          bankBranch: true,
          bankAccountType: true,
          bankAccountNumber: true,
          bankAccountHolder: true,
          bankNote: true,
          admissionFee: true,
          annualFee: true,
        },
      },
    },
  });

  if (!form || !form.enabled) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6 md:p-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card md:p-8 space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">お申し込みありがとうございました</h1>
        <p className="text-sm text-slate-700">{form.society.name} の申込受付が完了しました。以下の振込先をご確認ください。</p>

        <section className="rounded-xl border border-slate-200 p-4 text-sm">
          <h2 className="mb-2 font-semibold">振込先口座</h2>
          <p>銀行名: {form.society.bankName || "未設定"}</p>
          <p>支店名: {form.society.bankBranch || "未設定"}</p>
          <p>口座種別: {form.society.bankAccountType || "未設定"}</p>
          <p>口座番号: {form.society.bankAccountNumber || "未設定"}</p>
          <p>口座名義: {form.society.bankAccountHolder || "未設定"}</p>
          {form.society.bankNote ? <p className="mt-2 whitespace-pre-wrap">備考: {form.society.bankNote}</p> : null}
        </section>

        <section className="rounded-xl border border-slate-200 p-4 text-sm">
          <h2 className="mb-2 font-semibold">会費目安</h2>
          <p>入会金: {form.society.admissionFee != null ? `${form.society.admissionFee.toLocaleString("ja-JP")} 円` : "未設定"}</p>
          <p>年会費: {form.society.annualFee != null ? `${form.society.annualFee.toLocaleString("ja-JP")} 円` : "未設定"}</p>
        </section>

        <Link href={`/join/${slug}`} className="text-sm underline">申込フォームに戻る</Link>
      </div>
    </main>
  );
}
