"use client";

export default function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        border: "1px solid #ddd4c2", background: "#3f6b3f", color: "#fff",
        padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
