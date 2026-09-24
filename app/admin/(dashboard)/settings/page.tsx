import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PasswordForm from "./PasswordForm";

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
    </>
  );
}
