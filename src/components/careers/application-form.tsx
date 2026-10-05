"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createClient } from "@/lib/supabase/client";
import { submitApplication } from "@/lib/actions/public-application";

export function ApplicationForm({ vacancyId }: { vacancyId: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cvFile) {
      setError("CV wajib diupload");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const path = `${vacancyId}/${Date.now()}-${cvFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("candidate-cvs")
      .upload(path, cvFile);

    if (uploadError) {
      setSubmitting(false);
      setError(`Gagal upload CV: ${uploadError.message}`);
      return;
    }

    const result = await submitApplication(
      vacancyId,
      { full_name: fullName, email, phone, source },
      path
    );
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <p className="text-sm text-green-600">
        Lamaran Anda sudah terkirim. Tim HR akan menghubungi Anda jika memenuhi
        kualifikasi.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Source (opsional)</Label>
        <Input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g. LinkedIn, referral teman"
        />
      </div>
      <div className="space-y-2">
        <Label>CV (PDF)</Label>
        <Input
          type="file"
          accept=".pdf"
          onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Mengirim..." : "Submit Application"}
      </Button>
    </form>
  );
}
