"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  vacancySchema,
  type VacancyInput,
} from "@/lib/validations/recruitment";
import { sendEmail } from "@/lib/email/send-email";
import { buildCandidateStatusEmail } from "@/lib/email/candidate-status-templates";
import { renderTemplate } from "@/lib/email/render-template";

async function requireHR() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false as const, error: "Not authenticated" };

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (caller?.role !== "hr")
    return {
      ok: false as const,
      error: "Hanya HR yang bisa melakukan aksi ini",
    };

  return { ok: true as const, supabase };
}

export async function createVacancy(input: VacancyInput) {
  const parsed = vacancySchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("job_vacancies")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/recruitment");
  return { success: true, vacancyId: data.id };
}

export async function updateVacancyStatus(
  id: string,
  status: "draft" | "published" | "closed" | "archived"
) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("job_vacancies")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/recruitment/${id}`);
  revalidatePath("/recruitment");
  return { success: true };
}

export async function updateCandidateStatus(
  candidateId: string,
  status: string,
  interviewDetails?: { date?: string; time?: string; link?: string }
) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("candidates")
    .update({ status })
    .eq("id", candidateId);
  if (error) return { error: error.message };

  try {
    const { data: candidate } = await auth.supabase
      .from("candidates")
      .select(`full_name, email, job_vacancies ( positions ( name ) )`)
      .eq("id", candidateId)
      .single();

    const { data: template } = await auth.supabase
      .from("email_templates")
      .select("subject, body")
      .eq("status_key", status)
      .single();

    if (candidate && template) {
      const positionRel = Array.isArray(candidate.job_vacancies)
        ? candidate.job_vacancies[0]
        : candidate.job_vacancies;
      const positionNameRel = Array.isArray(positionRel?.positions)
        ? positionRel.positions[0]
        : positionRel?.positions;
      const positionName = positionNameRel?.name ?? "-";

      const variables = {
        candidate_name: candidate.full_name,
        position: positionName,
        interview_date: interviewDetails?.date ?? "",
        interview_time: interviewDetails?.time ?? "",
        interview_link: interviewDetails?.link ?? "",
      };

      const subject = renderTemplate(template.subject, variables);
      const body = renderTemplate(template.body, variables);

      await sendEmail({
        to: candidate.email,
        subject,
        html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">${body}<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" /><p style="color: #999; font-size: 12px;">Email ini dikirim otomatis, mohon tidak membalas.</p></div>`,
      });
    }
  } catch (emailError) {
    console.error("Gagal mengirim notifikasi email kandidat:", emailError);
  }

  revalidatePath("/recruitment");
  return { success: true };
}

export async function convertCandidateToEmployee(
  candidateId: string,
  input: {
    nik: string;
    join_date: string;
    basic_salary: number;
    position_id: string;
    department_id: string;
  }
) {
  const auth = await requireHR();
  if (!auth.ok) return { error: auth.error };

  const { data: candidate } = await auth.supabase
    .from("candidates")
    .select("full_name, email, status")
    .eq("id", candidateId)
    .single();

  if (!candidate) return { error: "Kandidat tidak ditemukan" };
  if (candidate.status !== "offering" && candidate.status !== "hired") {
    return {
      error: "Kandidat harus berstatus Offering atau Hired untuk dikonversi",
    };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(candidate.email, {
      data: { full_name: candidate.full_name },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    });

  if (inviteError || !invited.user) {
    return {
      error: inviteError?.message.toLowerCase().includes("already registered")
        ? "Email ini sudah terdaftar sebagai user"
        : inviteError?.message ?? "Gagal mengundang kandidat",
    };
  }

  const { error: empError } = await auth.supabase.from("employees").insert({
    profile_id: invited.user.id,
    nik: input.nik,
    join_date: input.join_date,
    department_id: input.department_id,
    position_id: input.position_id,
    basic_salary: input.basic_salary,
    employment_status: "probation",
  });

  if (empError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    return {
      error:
        empError.code === "23505" ? "NIK sudah digunakan" : empError.message,
    };
  }

  await auth.supabase
    .from("candidates")
    .update({ status: "hired" })
    .eq("id", candidateId);

  revalidatePath("/recruitment");
  revalidatePath("/employees");
  return { success: true };
}
