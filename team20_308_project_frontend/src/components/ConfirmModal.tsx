import React from "react";
import "../styles/Modal.css";

interface ConfirmModalProps {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title = "Please confirm",
  message,
  confirmLabel = "Yes",
  cancelLabel = "No",
  isOpen,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p>{message}</p>

        <div className="modal-actions">
          <button onClick={onClose}>{cancelLabel}</button>
          <button onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
