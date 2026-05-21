import React from "react";

interface InvoiceModalProps {
  pdfUrl: string;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ pdfUrl, onClose }) => {
  return (
    <div className="invoice-modal-overlay">
      <div className="invoice-modal-content">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <iframe src={pdfUrl} title="Invoice PDF" width="100%" height="600" />
      </div>
    </div>
  );
};

export default InvoiceModal;
