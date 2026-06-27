"use client";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
}

export default function Toast({ message, type = "success" }: ToastProps) {
  const typeStyles = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  };

  return (
    <div
      className={`fixed top-20 right-4 ${typeStyles[type]} text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in z-50`}
    >
      {message}
    </div>
  );
}
