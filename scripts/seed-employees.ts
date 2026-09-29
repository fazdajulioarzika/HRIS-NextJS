import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DUMMY_PASSWORD = "Password123!";
const TOTAL_EMPLOYEES = 100;

// Sesuaikan kalau pemetaan department->position kamu berbeda dari asumsi ini
const positionDepartmentMap: Record<string, string> = {
  "HR Manager": "Human Resources",
  "General Affair": "General",
  "Staff General Affairs": "General",
  "Utility Staff": "General",
  "Marketing Officer": "Marketing",
  "Operator Production": "Operational",
  "Safety Officer": "Operational",
  "HSE Supervisor": "Operational",
  "Finance Staff": "Finance",
  "Werehouse Staff": "Inventory",
  "IT Support": "Information Technology",
  "Backend Developer": "Information Technology",
  "IT Manager": "Information Technology",
  "Frontend Developer": "Information Technology",
};

const managerPositions = new Set([
  "HR Manager",
  "IT Manager",
  "HSE Supervisor",
]);

const firstNames = [
  "Budi",
  "Siti",
  "Andi",
  "Dewi",
  "Rudi",
  "Ani",
  "Agus",
  "Rina",
  "Dedi",
  "Yuni",
  "Hendra",
  "Wati",
  "Bambang",
  "Lina",
  "Joko",
  "Fitri",
  "Eko",
  "Sri",
  "Ahmad",
  "Tuti",
  "Wawan",
  "Nita",
  "Iwan",
  "Ika",
  "Sigit",
  "Ratna",
  "Yusuf",
  "Diah",
  "Fajar",
  "Wulan",
  "Dony",
  "Maya",
  "Rizki",
  "Putri",
  "Arif",
  "Sari",
  "Bayu",
  "Indah",
  "Anton",
  "Lia",
];

const lastNames = [
  "Santoso",
  "Aminah",
  "Wijaya",
  "Lestari",
  "Hartono",
  "Permata",
  "Saputra",
  "Fitriani",
  "Kurniawan",
  "Susanti",
  "Setiawan",
  "Rahayu",
  "Nugroho",
  "Wardani",
  "Pratama",
  "Handayani",
  "Purnomo",
  "Astuti",
  "Firmansyah",
  "Yuliana",
  "Gunawan",
  "Puspita",
  "Iskandar",
  "Melati",
  "Suryadi",
  "Anggraini",
  "Kusuma",
  "Wahyuni",
  "Halim",
  "Safitri",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(index: number) {
  const first = randomFrom(firstNames);
  const last = randomFrom(lastNames);
  return {
    full_name: `${first} ${last}`,
    slug: `${first}.${last}.${index}`.toLowerCase(),
  };
}

async function main() {
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name");
  const { data: positions } = await supabase
    .from("positions")
    .select("id, name, department_id");

  if (!departments || !positions) {
    console.error("Gagal ambil departments/positions.");
    return;
  }

  const positionEntries = Object.entries(positionDepartmentMap);
  const managerIdByDepartment = new Map<string, string>();
  let created = 0;

  for (let i = 1; i <= TOTAL_EMPLOYEES; i++) {
    const [positionName, departmentName] = randomFrom(positionEntries);

    const dept = departments.find((d) => d.name === departmentName);
    const pos = positions.find(
      (p) => p.name === positionName && p.department_id === dept?.id
    );

    if (!dept || !pos) {
      console.error(
        `Skip #${i}: "${positionName}" / "${departmentName}" tidak ketemu di DB`
      );
      continue;
    }

    const { full_name, slug } = generateName(i);
    const email = `${slug}@hris.local`;
    const role = managerPositions.has(positionName) ? "manager" : "employee";

    const { data: userCreated, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: DUMMY_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (createError || !userCreated.user) {
      console.error(`Gagal buat user ${email}:`, createError?.message);
      continue;
    }

    await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userCreated.user.id);

    const managerId = managerIdByDepartment.get(dept.id) ?? null;

    const { data: employee, error: empError } = await supabase
      .from("employees")
      .insert({
        profile_id: userCreated.user.id,
        nik: `32${String(1000000000 + i).slice(0, 14)}`,
        join_date: new Date().toISOString().slice(0, 10),
        department_id: dept.id,
        position_id: pos.id,
        manager_id: role === "manager" ? null : managerId,
        basic_salary: role === "manager" ? 12_000_000 : 5_000_000,
        employment_status: "active",
      })
      .select("id")
      .single();

    if (empError) {
      console.error(`Gagal insert employee ${email}:`, empError.message);
      continue;
    }

    // Simpan manager pertama yang ditemukan per departemen, untuk jadi atasan yang lain
    if (role === "manager" && !managerIdByDepartment.has(dept.id)) {
      managerIdByDepartment.set(dept.id, employee.id);
    }

    created++;
    if (created % 10 === 0)
      console.log(`Progress: ${created}/${TOTAL_EMPLOYEES}`);
  }

  console.log(
    `\nSelesai. ${created} employee dibuat. Password semua: ${DUMMY_PASSWORD}`
  );
}

main();
