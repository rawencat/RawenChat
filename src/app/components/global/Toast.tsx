"use client";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
}

export default function Toast({ message, type = "success" }: ToastProps) {
  const typeStyles = {
    success: "bg-[var(--success)] text-black",
    error: "bg-[var(--error)] text-white",
    info: "bg-[var(--accent)] text-[var(--accent-text)]",
  };

  return (
    <div
      className={`fixed bottom-5 right-5 ${typeStyles[type]} px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-slide-in z-50`}
    >
      {message}
    </div>
  );
}
