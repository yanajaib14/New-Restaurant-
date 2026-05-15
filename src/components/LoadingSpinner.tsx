import { T } from "../types";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ size = 24, text, fullPage }: LoadingSpinnerProps) {
  const content = (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: fullPage ? 0 : 24,
    }}>
      <Loader2 size={size} color={T.gold} style={{ animation: "spin 1s linear infinite" }} />
      {text && (
        <p style={{
          fontFamily: "'Segoe UI', sans-serif",
          fontSize: 14,
          color: T.muted,
          margin: 0,
          fontWeight: 500,
        }}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(247, 247, 243, 0.9)",
        zIndex: 9999,
      }}>
        {content}
      </div>
    );
  }

  return content;
}

export function LoadingButton({
  children,
  loading,
  onClick,
  disabled,
  style,
}: {
  children: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "12px 24px",
        borderRadius: 12,
        border: `1px solid ${T.gold}`,
        background: loading ? T.champagne : T.gold,
        color: loading ? T.muted : "#FFF",
        fontSize: 13,
        fontWeight: 700,
        cursor: loading ? "wait" : disabled ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.7 : 1,
        minHeight: 44,
        transition: "all 0.2s",
        ...style,
      }}
    >
      {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
      {children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p style={{
      color: T.red,
      fontSize: 12,
      fontWeight: 600,
      margin: "4px 0 0",
      padding: "4px 8px",
      background: T.redLight,
      borderRadius: 6,
      border: `1px solid ${T.redBorder}`,
    }}>
      {message}
    </p>
  );
}