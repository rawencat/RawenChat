export default function ModalOverlay({
  isOpen,
  onClose, 
  children,
}: {
  isOpen: boolean;
  onClose: () => void; 
  children?: React.ReactNode; 
}) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {

    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={handleOverlayClick} 
    >
      <div
        className="bg-[#18181b] border border-[#3f3f46] p-8 rounded-lg shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()} 
      >
        {children}
      </div>
    </div>
  );
}
