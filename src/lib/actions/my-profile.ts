"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateMyContactInfo(input: {
  phone: string;
  address: string;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("employees")
    .update({ phone: input.phone || null, address: input.address || null })
    .eq("profile_id", auth.user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}

export async function updateMyPhoto(photoUrl: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("employees")
    .update({ photo_url: photoUrl })
    .eq("profile_id", auth.user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}
