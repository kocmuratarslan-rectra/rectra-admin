// Admin paneli sürüm geçmişi. Her önemli değişiklik/deploy sonrası buraya yeni
// bir kayıt eklenir (en üste). Sidebar'daki versiyon etiketi ve Ayarlar
// sayfasındaki "Sürüm Geçmişi" kartı buradan besleniyor.

export type ChangelogEntry = {
  version: string;
  date: string; // YYYY-MM-DD
  notes: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.5.0",
    date: "2026-09-26",
    notes: [
      "Admin panelinden canlı web sitesine hızlı erişim linki eklendi (sidebar)",
      "Admin panelinde versiyon numarası ve sürüm geçmişi gösterimi eklendi (Ayarlar sayfası)",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-09-25",
    notes: [
      "RECTRA logosu web sitesinin nav ve footer bölümlerine eklendi",
      "Rectra Business School logosu dijital platformlar bölümüne ve giriş/üyelik moduline eklendi",
      "Admin panel sidebar'ındaki yazı logo, görsel RECTRA logosu ile değiştirildi",
      "Web sitesinde çalışmayan mobil hamburger menüsü tamamen işlevsel hale getirildi",
      "Admin panelinde mobil sidebar hamburger menüsü eklendi, KPI/tablo/üst bar taşma sorunları düzeltildi",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-09-24",
    notes: [
      "Pazar analizi otomasyonuna Apify reklam analizi, Canva kapak görseli, kaynak atıfları ve kapanış mesajı eklendi",
      "Vercel Blob ile kalıcı görsel barındırma kuruldu",
    ],
  },
];

export const APP_VERSION = CHANGELOG[0].version;
export const LAST_UPDATED = CHANGELOG[0].date;
export const LAST_UPDATE_SUMMARY = CHANGELOG[0].notes[0];
