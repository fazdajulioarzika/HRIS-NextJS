import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { textAlign: "center", marginBottom: 20 },
  companyName: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  title: { fontSize: 12, marginTop: 8, textTransform: "uppercase" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: { color: "#555" },
  section: { marginTop: 16, borderTop: "1px solid #ddd", paddingTop: 10 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  divider: { borderTop: "1px solid #ddd", marginVertical: 8 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    fontWeight: 700,
  },
  footer: { marginTop: 30, fontSize: 8, color: "#888", textAlign: "center" },
});

function formatRupiah(n: number) {
  return "Rp " + new Intl.NumberFormat("id-ID").format(n);
}

interface PayslipData {
  companyName: string;
  periodName: string;
  employeeName: string;
  position: string;
  department: string;
  basicSalary: number;
  allowanceItems: { name: string; amount: number }[];
  overtimeAmount: number;
  bonusAmount: number;
  deductionItems: { name: string; amount: number }[];
  grossSalary: number;
  totalDeduction: number;
  netSalary: number;
}

export function PayslipDocument({ data }: { data: PayslipData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{data.companyName}</Text>
          <Text style={styles.title}>Slip Gaji — {data.periodName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Nama</Text>
          <Text>{data.employeeName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Jabatan</Text>
          <Text>{data.position}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Departemen</Text>
          <Text>{data.department}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pendapatan</Text>
          <View style={styles.row}>
            <Text>Gaji Pokok</Text>
            <Text>{formatRupiah(data.basicSalary)}</Text>
          </View>
          {data.allowanceItems.map((item, i) => (
            <View style={styles.row} key={i}>
              <Text>{item.name}</Text>
              <Text>{formatRupiah(item.amount)}</Text>
            </View>
          ))}
          {data.overtimeAmount > 0 && (
            <View style={styles.row}>
              <Text>Lembur</Text>
              <Text>{formatRupiah(data.overtimeAmount)}</Text>
            </View>
          )}
          {data.bonusAmount > 0 && (
            <View style={styles.row}>
              <Text>Bonus</Text>
              <Text>{formatRupiah(data.bonusAmount)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text>Gross Salary</Text>
            <Text>{formatRupiah(data.grossSalary)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Potongan</Text>
          {data.deductionItems.map((item, i) => (
            <View style={styles.row} key={i}>
              <Text>{item.name}</Text>
              <Text>-{formatRupiah(item.amount)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text>Total Potongan</Text>
            <Text>-{formatRupiah(data.totalDeduction)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text>TAKE HOME PAY</Text>
            <Text>{formatRupiah(data.netSalary)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Slip gaji ini dibuat otomatis oleh sistem HRIS. Simpan untuk keperluan
          administrasi Anda.
        </Text>
      </Page>
    </Document>
  );
}
