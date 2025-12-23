import React from "react";

export default function ReportPostModal({ open, post, onClose, onSubmit }) {
  const [reason, setReason] = React.useState("spam");
  const [details, setDetails] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setReason("spam");
      setDetails("");
    }
  }, [open, post?.id]);

  if (!open || !post) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      postId: post.id,
      reason,
      details
    });
  }

  return (
    <div className="dm-modal dm-modal--bazar-report">
      <div className="dm-modal__backdrop" onClick={onClose} />
      <div className="dm-modal__content">
        <h2 className="dm-modal__title">Пожаловаться на работу</h2>
        <p className="dm-modal__subtitle">{post.title}</p>

        <form onSubmit={handleSubmit}>
          <div className="dm-form-field">
            <label>Причина</label>
            <select value={reason} onChange={e => setReason(e.target.value)}>
              <option value="spam">Спам</option>
              <option value="abuse">Оскорбление</option>
              <option value="nsfw">NSFW / неприемлемый контент</option>
              <option value="other">Другое</option>
            </select>
          </div>

          <div className="dm-form-field">
            <label>Комментарий (необязательно)</label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              rows={3}
            />
          </div>

          <div className="dm-modal__actions">
            <button
              type="button"
              className="dm-btn dm-btn--ghost"
              onClick={onClose}
            >
              Отмена
            </button>
            <button type="submit" className="dm-btn dm-btn--danger">
              Отправить жалобу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
