import { useEffect, type ReactNode } from 'react';

type ModalProps = {
  onClose: () => void;
  title?: string;
  children: ReactNode;
  closeOnBackdrop?: boolean;
};

const Modal: React.FC<ModalProps> = ({
  onClose,
  title,
  children,
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-root">
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Închide"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <h2 className="modal__title" id="modal-title">
            {title}
          </h2>
        )}
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
