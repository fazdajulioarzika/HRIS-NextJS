import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase/server";
import { ProfileProvider, type Profile } from "@/contexts/profile-context";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name, role, employees ( photo_url )")
    .eq("id", user.id)
    .single();

  const initialProfile: Profile = {
    id: user.id,
    full_name: profileRow?.full_name ?? null,
    email: user.email ?? "",
    role: profileRow?.role ?? "employee",
    photo_url: (profileRow as any)?.employees?.photo_url ?? null,
  };

  return (
    <ProfileProvider initialProfile={initialProfile}>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
          <header className="flex h-16 items-center gap-4 border-b px-4">
            <SidebarTrigger className="" />

            <div>
              <h1 className="font-semibold">
                Human Resource Information System
              </h1>
            </div>
          </header>

          <main className="p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProfileProvider>
  );
}
