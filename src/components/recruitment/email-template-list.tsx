"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { EmailTemplateEditDialog } from "./email-template-edit-dialog";

interface Template {
  id: string;
  status_key: string;
  subject: string;
  body: string;
}

const statusLabel: Record<string, string> = {
  applied: "Terima Kasih Melamar",
  screening: "Screening",
  interview: "Interview",
  technical_test: "Technical Test",
  offering: "Offering",
  hired: "Hired",
  rejected: "Rejected",
};
function cleanPreview(html: string) {
  return html.replace(/\n+/g, " ").trim();
}

export function EmailTemplateList({ templates }: { templates: Template[] }) {
  const [editing, setEditing] = useState<Template | null>(null);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {statusLabel[t.status_key] ?? t.status_key}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setEditing(t)}>
                <Pencil className="size-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{t.subject}</p>
              <p
                className="mt-1 text-xs text-muted-foreground line-clamp-2"
                dangerouslySetInnerHTML={{ __html: cleanPreview(t.body) }}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <EmailTemplateEditDialog
          template={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </>
  );
}
