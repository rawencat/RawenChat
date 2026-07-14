import { Dismiss20Regular, ArrowDownload20Regular, ArrowSync20Regular, Checkmark20Regular, ErrorCircle20Regular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";

interface UpdateInfo {
  version: string;
  files?: unknown[];
  path?: string;
  sha512?: string;
  releaseDate?: string;
  releaseName?: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateAvailable?: () => void;
}

export default function UpdateModal({ isOpen, onClose, onUpdateAvailable }: UpdateModalProps) {
  const [status, setStatus] = useState<string>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!window.electron) return;

    const unsubscribe = window.electron.onUpdateStatus((newStatus, data) => {
      setStatus(newStatus);
      
      switch (newStatus) {
        case "available":
          setUpdateInfo(data as UpdateInfo);
          if (onUpdateAvailable) {
            onUpdateAvailable();
          }
          break;
        case "downloading":
          setDownloadProgress(data as DownloadProgress);
          break;
        case "error":
          setErrorMessage(data as string);
          break;
        case "downloaded":
          setUpdateInfo(data as UpdateInfo);
          break;
        default:
          break;
      }
    });

    return unsubscribe;
  }, [onUpdateAvailable]);

  const handleCheckForUpdates = async () => {
    if (!window.electron) return;
    
    setErrorMessage(null);
    const result = await window.electron.checkForUpdates();
    if (!result.success && result.message) {
      setErrorMessage(result.message);
    }
  };

  const handleDownloadUpdate = async () => {
    if (!window.electron) return;
    
    setErrorMessage(null);
    const result = await window.electron.downloadUpdate();
    if (!result.success && result.message) {
      setErrorMessage(result.message);
    }
  };

  const handleInstallUpdate = async () => {
    if (!window.electron) return;
    
    const result = await window.electron.installUpdate();
    if (!result.success && result.message) {
      setErrorMessage(result.message);
    }
  };

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div
      className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="amoled-card p-6 w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Actualizaciones</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--elevated)] transition-colors"
            title="Cerrar"
          >
            <Dismiss20Regular className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {status === "idle" && (
            <div className="text-center py-6">
              <ArrowSync20Regular className="w-12 h-12 mx-auto mb-3 text-[var(--accent)]" />
              <p className="text-[var(--text-secondary)]">Verifica si hay actualizaciones disponibles</p>
            </div>
          )}

          {status === "checking" && (
            <div className="text-center py-6">
              <ArrowSync20Regular className="w-12 h-12 mx-auto mb-3 text-[var(--accent)] animate-spin" />
              <p className="text-[var(--text-secondary)]">Buscando actualizaciones...</p>
            </div>
          )}

          {status === "not-available" && (
            <div className="text-center py-6">
              <Checkmark20Regular className="w-12 h-12 mx-auto mb-3 text-[var(--success)]" />
              <p className="text-[var(--text-secondary)]">Tienes la versión más reciente</p>
            </div>
          )}

          {status === "available" && updateInfo && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[var(--elevated)] rounded-xl">
                <ArrowDownload20Regular className="w-8 h-8 text-[var(--accent)]" />
                <div>
                  <p className="font-semibold text-white">Nueva versión disponible</p>
                  <p className="text-sm text-[var(--text-muted)]">v{updateInfo.version}</p>
                </div>
              </div>
              <button
                onClick={handleDownloadUpdate}
                className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowDownload20Regular className="w-5 h-5" />
                Descargar actualización
              </button>
            </div>
          )}

          {status === "downloading" && downloadProgress && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Descargando...</span>
                  <span className="text-[var(--accent)] font-mono">{Math.round(downloadProgress.percent)}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--elevated)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${downloadProgress.percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[var(--text-muted)]">
                  <span>{formatBytes(downloadProgress.transferred)} / {formatBytes(downloadProgress.total)}</span>
                  <span>{formatBytes(downloadProgress.bytesPerSecond)}/s</span>
                </div>
              </div>
            </div>
          )}

          {status === "downloaded" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[var(--success-muted)] rounded-xl border border-[var(--success)]/30">
                <Checkmark20Regular className="w-8 h-8 text-[var(--success)]" />
                <div>
                  <p className="font-semibold text-[var(--success)]">Descarga completada</p>
                  <p className="text-sm text-[var(--text-muted)]">La actualización está lista para instalar</p>
                </div>
              </div>
              <button
                onClick={handleInstallUpdate}
                className="w-full py-3 bg-[var(--success)] hover:opacity-90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                Instalar y reiniciar
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[var(--error-muted)] rounded-xl border border-[var(--error)]/30">
                <ErrorCircle20Regular className="w-8 h-8 text-[var(--error)]" />
                <div>
                  <p className="font-semibold text-[var(--error)]">Error</p>
                  <p className="text-sm text-[var(--text-muted)]">{errorMessage || "Ocurrió un error"}</p>
                </div>
              </div>
            </div>
          )}

          {status !== "checking" && status !== "downloading" && (
            <button
              onClick={handleCheckForUpdates}
              className="w-full py-3 bg-[var(--elevated)] hover:bg-[var(--border)] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowSync20Regular className="w-5 h-5" />
              Buscar actualizaciones
            </button>
          )}
        </div>

        <p className="text-center mt-5 text-[var(--text-muted)] text-xs border-t border-[var(--border)] pt-4">
          Toca fuera para cerrar
        </p>
      </div>
    </div>
  );
}
