import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ count: departmentCount }, { count: positionCount }] =
    await Promise.all([
      supabase.from("departments").select("id", { count: "exact", head: true }),
      supabase.from("positions").select("id", { count: "exact", head: true }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company&apos;s settings and configurations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{departmentCount ?? 0}</p>
          </CardContent>
          <CardFooter>
            <Button>
              <Link href="/settings/departments">
                <span>Manage Departments</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{positionCount ?? 0}</p>
          </CardContent>
          <CardFooter>
            <Button>
              <Link href="/settings/positions">
                <span>Manage Positions</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
