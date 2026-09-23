import { prisma } from "@/lib/prisma";
import SiteControl from "./SiteControl";

type SiteSectionRow = {
  id: string;
  key: string;
  icon: string;
  name: string;
  color: string;
  order: number;
  visible: boolean;
  fields: unknown;
};

export default async function SiteControlPage() {
  const rows = await prisma.siteSection.findMany({ orderBy: { order: "asc" } });
  const sections = (rows as SiteSectionRow[]).map((r) => ({
    id: r.id,
    key: r.key,
    icon: r.icon,
    name: r.name,
    color: r.color,
    order: r.order,
    visible: r.visible,
    fields: r.fields as Record<string, string>,
  }));

  return (
    <>
      <div className="topbar">
        <h1>
          Süper Admin · Site Kontrolü
          <small>Canlı sitedeki (rectra-site.vercel.app) bölümleri buradan düzenlersiniz — kaydettiğiniz değişiklik birkaç saniye içinde sitede görünür.</small>
        </h1>
      </div>
      <div className="sa-hint">
        <span className="fmt">🟢 Yayında: {sections.filter((s) => s.visible).length}</span>
        <span className="fmt">⚪ Gizli: {sections.filter((s) => !s.visible).length}</span>
      </div>
      <SiteControl initialSections={sections} />
    </>
  );
}
