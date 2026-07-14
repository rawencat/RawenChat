export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center animate-scale-in">
        <h1 className="text-5xl font-bold text-[var(--accent)] mb-3">404</h1>
        <p className="text-[var(--text-secondary)]">Página no encontrada</p>
      </div>
    </div>
  );
}
