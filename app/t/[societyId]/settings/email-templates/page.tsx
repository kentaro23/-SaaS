import { redirect } from "next/navigation";

export default async function LegacyEmailTemplatesPage({ params }: { params: Promise<{ societyId: string }> }) {
  const { societyId } = await params;
  redirect(`/t/${societyId}/invoices`);
}
