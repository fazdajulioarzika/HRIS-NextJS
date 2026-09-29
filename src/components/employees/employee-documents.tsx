"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { createClient } from "@/lib/supabase/client";
import {
  addEmployeeDocument,
  deleteEmployeeDocument,
} from "@/lib/actions/employee-documents";

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

export function EmployeeDocuments({
  employeeId,
  initialDocuments,
}: {
  employeeId: string;
  initialDocuments: Document[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [docType, setDocType] = useState("ktp");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setUploading(true);

    const supabase = createClient();
    const path = `${employeeId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("employee-documents")
      .upload(path, file);

    if (uploadError) {
      setUploading(false);
      setError(`Gagal upload: ${uploadError.message}`);
      return;
    }

    startTransition(async () => {
      const result = await addEmployeeDocument({
        employee_id: employeeId,
        document_type: docType,
        file_name: file.name,
        file_path: path,
      });

      setUploading(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      setUploadOpen(false);
      setFile(null);
      setDocType("ktp");
      router.refresh();
    });
  }

  async function handleDownload(doc: Document) {
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage
      .from("employee-documents")
      .createSignedUrl(doc.file_path, 60); // link berlaku 60 detik

    if (signError || !data) return;
    window.open(data.signedUrl, "_blank");
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteEmployeeDocument(deleteTarget.id, deleteTarget.file_path);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documents</h2>
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="size-4" />
          Upload Document
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>File name</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialDocuments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  Belum ada dokumen.
                </TableCell>
              </TableRow>
            ) : (
              initialDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    {documentTypeLabel[doc.document_type] ?? doc.document_type}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    {doc.file_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(doc.uploaded_at).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(doc)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select
                value={docType}
                onValueChange={(v) => setDocType(v ?? "ktp")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{documentTypeLabel[docType]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading || isPending}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.file_name}&quot; akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
