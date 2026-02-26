import { redirect } from "next/navigation";
import { requireUser, getAccessibleSocieties } from "@/lib/session";

export default async function HomePage() {
  const user = await requireUser();
  const memberships = await getAccessibleSocieties(user.id);
  if (memberships[0]) {
    redirect(`/t/${memberships[0].societyId}`);
  }
  redirect("/admin/societies");
}
