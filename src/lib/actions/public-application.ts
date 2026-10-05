"use server";

import { createClient } from "@/lib/supabase/server";
import {
  applicationSchema,
  type ApplicationInput,
} from "@/lib/validations/recruitment";

export async function submitApplication(
  vacancyId: string,
  input: ApplicationInput,
  cvPath: string
) {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  const supabase = await createClient();

  const { error } = await supabase.from("candidates").insert({
    job_vacancy_id: vacancyId,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    source: parsed.data.source || null,
    cv_path: cvPath,
    status: "applied",
  });

  if (error) return { error: error.message };
  return { success: true };
}
