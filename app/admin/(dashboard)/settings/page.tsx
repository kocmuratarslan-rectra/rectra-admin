import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PasswordForm from "./PasswordForm";
import { CHANGELOG, APP_VERSION } from "@/app/version";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <div className="topbar">
        <h1>
          Ayarlar
          <small>Admin hesabınızın giriş bilgileri</small>
        </h1>
      </div>

      <div className="card" style={{ maxWidth: 480, padding: 24 }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Giriş E-postası
          </label>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{session?.user?.email}</div>
        </div>
        <PasswordForm />
      </div>

      <div className="note" style={{ marginTop: 18, maxWidth: 480 }}>
        Şifreni buradan değiştirdiğinde artık kalıcıdır — bir sonraki site güncellemesi/deploy'u şifreni sıfırlamaz.
      </div>

      <div className="card" style={{ maxWidth: 480, padding: 24, marginTop: 26 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <label style={{ fontFamily: "var(--font-m)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
              Sürüm
            </label>
            <div style={{ fontWeight: 700, fontSize: 20 }}>v{APP_VERSION}</div>
          </div>
          <span className="soon-badge" style={{ background: "#DCFCE7", color: "#166534" }}>Güncel</span>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          {CHANGELOG.map((entry) => (
            <div key={entry.version} style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                <b style={{ fontSize: 13.5 }}>v{entry.version}</b>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{formatDate(entry.date)}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                {entry.notes.map((n, i) => (
                  <li key={i} style={{ fontSize: 13, color: "var(--text)" }}>{n}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
