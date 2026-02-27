"use server";

import { signIn, signOut } from "@/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");
  await signIn("credentials", { email, password, redirectTo });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
