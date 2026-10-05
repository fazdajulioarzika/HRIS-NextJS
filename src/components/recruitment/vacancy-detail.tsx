"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { createClient } from "@/lib/supabase/client";
import {
  updateCandidateStatus,
  updateVacancyStatus,
} from "@/lib/actions/recruitment";
import { candidateStatusValues } from "@/lib/validations/recruitment";
import { ConvertToEmployeeDialog } from "./convert-to-employee-dialog";

const candidateStatusLabel: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  technical_test: "Technical Test",
  offering: "Offering",
  hired: "Hired",
  rejected: "Rejected",
};

const vacancyStatusLabel: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  archived: "Archived",
};

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  source: string | null;
  status: string;
  cv_path: string;
  applied_at: string;
}

export function VacancyDetail({
  vacancy,
  candidates,
}: {
  vacancy: {
    id: string;
    position: string;
    positionId: string;
    departmentId: string;
    department: string;
    location: string;
    status: string;
  };
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [convertTarget, setConvertTarget] = useState<Candidate | null>(null);

  function handleVacancyStatusChange(status: string) {
    startTransition(async () => {
      await updateVacancyStatus(vacancy.id, status as any);
      router.refresh();
    });
  }

  function handleCandidateStatusChange(candidateId: string, status: string) {
    startTransition(async () => {
      await updateCandidateStatus(candidateId, status);
      router.refresh();
    });
  }

  async function handleDownloadCV(cvPath: string, fileName: string) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("candidate-cvs")
      .createSignedUrl(cvPath, 60);
    if (data) window.open(data.signedUrl, "_blank");
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{vacancy.position}</h1>
          <p className="text-muted-foreground">
            {vacancy.department} · {vacancy.location}
          </p>
        </div>

        <Select
          value={vacancy.status}
          onValueChange={(v) => v && handleVacancyStatusChange(v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue>{vacancyStatusLabel[vacancy.status]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>CV</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Belum ada kandidat melamar.
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <div>{c.email}</div>
                    <div>{c.phone}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.source ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadCV(c.cv_path, c.full_name)}
                    >
                      <Download className="size-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={c.status}
                      onValueChange={(v) =>
                        v && handleCandidateStatusChange(c.id, v)
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue>
                          {candidateStatusLabel[c.status]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {candidateStatusValues.map((s) => (
                          <SelectItem key={s} value={s}>
                            {candidateStatusLabel[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {(c.status === "offering" || c.status === "hired") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConvertTarget(c)}
                      >
                        Convert
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {convertTarget && (
        <ConvertToEmployeeDialog
          candidate={convertTarget}
          defaultPositionId={vacancy.positionId}
          defaultDepartmentId={vacancy.departmentId}
          open={!!convertTarget}
          onOpenChange={(open) => !open && setConvertTarget(null)}
        />
      )}
    </>
  );
}
