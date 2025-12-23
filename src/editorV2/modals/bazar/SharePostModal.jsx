import React from "react";

export default function SharePostModal({ open, post, onClose }) {
  if (!open || !post) return null;

  const shareUrl = post.shareUrl || window.location.origin + "/bazar/" + post.id;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
  }

  return (
    <div className="dm-modal dm-modal--bazar-share">
      <div className="dm-modal__backdrop" onClick={onClose} />
      <div className="dm-modal__content">
        <h2 className="dm-modal__title">Поделиться</h2>
        <p className="dm-modal__subtitle">{post.title}</p>

        <div className="dm-share-link">
          <input value={shareUrl} readOnly />
          <button
            type="button"
            className="dm-btn dm-btn--primary"
            onClick={handleCopy}
          >
            Копировать
          </button>
        </div>

        {/* Кнопки соцсетей сделаешь потом, когда определишь список */}

        <div className="dm-modal__actions">
          <button
            type="button"
            className="dm-btn dm-btn--ghost"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
