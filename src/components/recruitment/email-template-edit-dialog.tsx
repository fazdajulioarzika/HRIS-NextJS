"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { updateEmailTemplate } from "@/lib/actions/email-templates";

const AVAILABLE_VARIABLES = [
  "{{candidate_name}}",
  "{{position}}",
  "{{interview_date}}",
  "{{interview_time}}",
  "{{interview_link}}",
];

export function EmailTemplateEditDialog({
  template,
  open,
  onOpenChange,
}: {
  template: { status_key: string; subject: string; body: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!open) return;
    setSubject(template.subject);
    setBody(template.body);
    setError(null);
  }, [open, template]);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await updateEmailTemplate(template.status_key, {
        subject,
        body,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Email Template</DialogTitle>
          <DialogDescription>
            Gunakan variabel berikut untuk menyisipkan data otomatis:{" "}
            {AVAILABLE_VARIABLES.join(", ")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Body (HTML)</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
            />
            <p className="text-xs text-muted-foreground">
              Bisa pakai tag HTML dasar seperti &lt;br&gt; dan &lt;strong&gt;.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !subject.trim() || !body.trim()}
          >
            {isPending ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
