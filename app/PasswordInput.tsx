"use client";
import { useState } from "react";

type Props = {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  placeholder?: string;
};

// Tüm admin panelinde (giriş sayfası dahil) tek bir yerden yönetilen
// şifre göster/gizle bileşeni. Göz ikonuna tıklandığında input type
// "password" <-> "text" arasında değişir; state sadece bu bileşende
// tutulur, dışarıya sadece value/onChange ile bağlanır.
export default function PasswordInput({
  id,
  value,
  onChange,
  className,
  style,
  required,
  minLength,
  autoComplete,
  placeholder,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        style={{ ...style, paddingRight: 42, width: "100%" }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
        tabIndex={-1}
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          padding: 6,
          cursor: "pointer",
          color: "var(--muted, #5B6178)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.4 9.4 0 0112 5c5 0 9 4 10.5 7-.6 1.1-1.4 2.3-2.5 3.4M6.5 6.6C4.6 7.8 3 9.6 1.5 12c1.7 3.3 5.1 7 10.5 7 1.3 0 2.5-.2 3.6-.6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
          </svg>
        )}
      </button>
    </div>
  );
}
