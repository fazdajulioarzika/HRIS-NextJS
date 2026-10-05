"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VacancyCard {
  id: string;
  position: string;
  department: string;
  location: string;
  employment_type: string;
  created_at: string;
}

const employmentTypeLabel: Record<string, string> = {
  full_time: "Full Time",
  contract: "Contract",
  internship: "Internship",
  part_time: "Part Time",
};

function formatPostedDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CareersList({ vacancies }: { vacancies: VacancyCard[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => setPage(1), [search]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vacancies;
    return vacancies.filter(
      (v) =>
        v.position.toLowerCase().includes(query) ||
        v.department.toLowerCase().includes(query) ||
        v.location.toLowerCase().includes(query)
    );
  }, [vacancies, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  return (
    <div className="space-y-6">
      <div className="relative mx-auto max-w-md">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Cari posisi, departemen, atau lokasi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {paginated.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground">
            {search
              ? "Tidak ada lowongan yang cocok."
              : "Belum ada lowongan dibuka saat ini."}
          </p>
        ) : (
          paginated.map((v) => (
            <Link
              key={v.id}
              href={`/careers/${v.id}`}
              className="block w-full border p-4 transition-colors hover:border-foreground"
            >
              <h2 className="font-semibold">{v.position}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {v.department} ·{" "}
                {employmentTypeLabel[v.employment_type] ?? v.employment_type}
              </p>
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                {v.location}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Diposting {formatPostedDate(v.created_at)}
              </p>
            </Link>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
