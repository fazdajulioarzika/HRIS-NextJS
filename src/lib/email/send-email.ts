export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // from: "HRIS Recruitment <onboarding@resend.dev>",
      from: "HR Arzikadev <recruitment@arzikadev.my.id>",
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    console.error("Gagal kirim email:", error);
    return { success: false, error: error?.message ?? "Unknown error" };
  }

  return { success: true };
}
