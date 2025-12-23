// src/admin/components/AdminConfirmDialog.jsx
import React from 'react';

export default function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="dm-admin-dialog-backdrop">
      <div className="dm-admin-dialog">
        <h3 className="dm-admin-dialog__title">{title}</h3>
        <p className="dm-admin-dialog__message">{message}</p>
        <div className="dm-admin-dialog__actions">
          <button
            type="button"
            className="dm-admin-btn dm-admin-btn--ghost"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="dm-admin-btn dm-admin-btn--primary"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
