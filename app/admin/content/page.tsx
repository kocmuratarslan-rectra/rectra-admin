import ContentManager from "./ContentManager";

export default function ContentPage() {
  return (
    <>
      <div className="topbar">
        <h1>
          İçerik Yönetimi
          <small>Sitedeki hizmet kartları, referans ve SSS içerikleri</small>
        </h1>
      </div>
      <ContentManager />
    </>
  );
}
