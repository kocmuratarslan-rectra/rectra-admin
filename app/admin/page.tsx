import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [totalLeads, newLeads, services] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.contentItem.count({ where: { type: "SERVICE" } }),
  ]);

  const stats = [
    { label: "Toplam Talep (Lead)", value: totalLeads },
    { label: "Yeni Talepler", value: newLeads },
    { label: "Aktif Hizmet Kartı", value: services },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Genel Bakış</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm p-6">
            <div className="text-3xl font-bold text-rectra-red">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
