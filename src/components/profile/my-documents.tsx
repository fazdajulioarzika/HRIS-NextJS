"use client";

import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createClient } from "@/lib/supabase/client";

const documentTypeLabel: Record<string, string> = {
  ktp: "KTP",
  ijazah: "Ijazah",
  kontrak: "Kontrak Kerja",
  npwp: "NPWP",
  other: "Lainnya",
};

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

export function MyDocuments({ documents }: { documents: Document[] }) {
  async function handleDownload(doc: Document) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("employee-documents")
      .createSignedUrl(doc.file_path, 60);

    if (error || !data) return;
    window.open(data.signedUrl, "_blank");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>File name</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    Belum ada dokumen. Dokumen dikelola oleh HR.
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      {documentTypeLabel[doc.document_type] ??
                        doc.document_type}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      {doc.file_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(doc.uploaded_at).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
