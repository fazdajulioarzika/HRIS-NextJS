"use server";

import { createClient } from "@/lib/supabase/server";
import {
  applicationSchema,
  type ApplicationInput,
} from "@/lib/validations/recruitment";
import { sendEmail } from "@/lib/email/send-email";
import { renderTemplate } from "@/lib/email/render-template";

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

  // Kirim email "Terima Kasih Melamar" — kegagalan di sini tidak membatalkan submission
  try {
    const { data: vacancy } = await supabase
      .from("job_vacancies")
      .select("positions ( name )")
      .eq("id", vacancyId)
      .single();

    const { data: template } = await supabase
      .from("email_templates")
      .select("subject, body")
      .eq("status_key", "applied")
      .single();

    if (template) {
      const positionRel = Array.isArray(vacancy?.positions)
        ? vacancy.positions[0]
        : vacancy?.positions;
      const variables = {
        candidate_name: parsed.data.full_name,
        position: positionRel?.name ?? "-",
      };

      await sendEmail({
        to: parsed.data.email,
        subject: renderTemplate(template.subject, variables),
        html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">${renderTemplate(
          template.body,
          variables
        )}</div>`,
      });
    }
  } catch (emailError) {
    console.error("Gagal mengirim email terima kasih melamar:", emailError);
  }

  return { success: true };
}
