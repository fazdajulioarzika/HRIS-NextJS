const statusMessage: Record<string, { subject: string; body: string }> = {
  screening: {
    subject: "Update Lamaran Anda — Sedang Direview",
    body: "Terima kasih telah melamar. Tim kami sedang meninjau lamaran Anda.",
  },
  interview: {
    subject: "Anda Lolos ke Tahap Interview",
    body: "Selamat! Lamaran Anda lolos tahap screening. Tim HR akan menghubungi Anda untuk penjadwalan interview.",
  },
  technical_test: {
    subject: "Anda Lanjut ke Tahap Technical Test",
    body: "Selamat! Anda lolos tahap interview dan akan melanjutkan ke tahap technical test. Informasi lebih lanjut akan dikirimkan menyusul.",
  },
  offering: {
    subject: "Selamat! Anda Mendapat Penawaran Kerja",
    body: "Kami dengan senang hati menginformasikan bahwa Anda lolos seluruh tahap seleksi. Tim HR akan menghubungi Anda terkait detail penawaran.",
  },
  hired: {
    subject: "Selamat Bergabung dengan Kami!",
    body: "Selamat! Anda resmi diterima bergabung dengan perusahaan kami. Informasi onboarding akan dikirimkan melalui email terpisah.",
  },
  rejected: {
    subject: "Update Lamaran Anda",
    body: "Terima kasih atas waktu dan minat Anda melamar di perusahaan kami. Setelah pertimbangan, kami memutuskan untuk melanjutkan dengan kandidat lain pada kesempatan ini. Kami menyimpan data Anda untuk kesempatan yang akan datang.",
  },
};

export function buildCandidateStatusEmail(
  candidateName: string,
  position: string,
  status: string
) {
  const template = statusMessage[status];
  if (!template) return null;

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <p>Halo ${candidateName},</p>
      <p>${template.body}</p>
      <p style="color: #666; font-size: 14px;">Posisi yang dilamar: <strong>${position}</strong></p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">Email ini dikirim otomatis, mohon tidak membalas.</p>
    </div>
  `;

  return { subject: template.subject, html };
}
