import LeadsTable from "./LeadsTable";

export default function LeadsPage() {
  return (
    <>
      <div className="topbar">
        <h1>
          Talepler (CRM)
          <small>Site teklif formundan gelen tüm talepler — gerçek zamanlı</small>
        </h1>
      </div>
      <LeadsTable />
    </>
  );
}
