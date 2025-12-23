import React, { useState, useEffect } from "react";
import "./CreateServiceModal.css";

const PLATFORM_COMMISSION = 20;

export default function EditServiceModal({ isOpen, onClose, onSave, service }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    deliveryDays: "",
    youtubeUrl: "",
    emoji: ""
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const popularEmojis = [
    "🎨", "🎬", "🎵", "🎤", "📸", "✨", "💫", "🔥",
    "💎", "🎯", "🚀", "💡", "🎁", "👑", "⭐", "🌟",
    "🎭", "🎪", "🎹", "🎸", "🎺", "🎻", "🥁", "🎧",
    "📹", "🎥", "📷", "🖼️", "🎞️", "📺", "💻", "🖥️"
  ];

  useEffect(() => {
    if (isOpen && service) {
      // Заполняем форму данными услуги
      const titleMatch = service.title?.match(/^(\p{Emoji})\s*(.+)$/u);
      setFormData({
        title: titleMatch ? titleMatch[2] : (service.title || ""),
        description: service.description || "",
        price: service.price?.toString() || "",
        deliveryDays: service.deliveryDays?.toString() || "",
        youtubeUrl: service.youtubeUrl || "",
        emoji: titleMatch ? titleMatch[1] : ""
      });
      setErrors({});
    }
  }, [isOpen, service]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Введите название услуги";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Введите описание услуги";
    } else if (formData.description.trim().length < 50) {
      newErrors.description = "Описание должно быть не менее 50 символов";
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Введите корректную цену";
    }

    if (!formData.deliveryDays || parseInt(formData.deliveryDays) <= 0) {
      newErrors.deliveryDays = "Введите срок выполнения";
    }

    if (formData.youtubeUrl && !isValidYoutubeUrl(formData.youtubeUrl)) {
      newErrors.youtubeUrl = "Введите корректную ссылку на YouTube";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidYoutubeUrl = (url) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/;
    return pattern.test(url);
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onSave(service.id, {
        title: formData.emoji ? `${formData.emoji} ${formData.title}` : formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        deliveryDays: parseInt(formData.deliveryDays),
        youtubeUrl: formData.youtubeUrl || null
      });
      onClose();
    } catch (err) {
      console.error("Error updating service:", err);
      setErrors({ submit: err.message || "Ошибка сохранения" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const calculateAuthorEarnings = () => {
    const price = parseFloat(formData.price) || 0;
    return (price * (100 - PLATFORM_COMMISSION) / 100).toFixed(2);
  };

  if (!isOpen || !service) return null;

  const embedUrl = getYoutubeEmbedUrl(formData.youtubeUrl);

  return (
    <div className="csm-overlay" onClick={onClose}>
      <div className="csm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="csm-close" onClick={onClose}>✕</button>

        <h2 className="csm-title">Редактирование услуги</h2>
        <p className="csm-subtitle">Измените данные услуги</p>

        {errors.submit && (
          <div className="csm-error-banner">{errors.submit}</div>
        )}

        <div className="csm-form">
          {/* Название */}
          <div className="csm-field">
            <label className="csm-label">
              Название услуги <span className="csm-required">*</span>
            </label>
            <div className="csm-input-row">
              <button
                type="button"
                className="csm-emoji-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                {formData.emoji || "😀"}
              </button>
              <input
                type="text"
                className={`csm-input ${errors.title ? 'csm-input--error' : ''}`}
                placeholder="Например: Создание анимированного логотипа"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>
            {showEmojiPicker && (
              <div className="csm-emoji-picker">
                {popularEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="csm-emoji-option"
                    onClick={() => {
                      handleChange("emoji", emoji);
                      setShowEmojiPicker(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            {errors.title && <span className="csm-error">{errors.title}</span>}
          </div>

          {/* Описание */}
          <div className="csm-field">
            <label className="csm-label">
              Описание <span className="csm-required">*</span>
            </label>
            <textarea
              className={`csm-textarea ${errors.description ? 'csm-textarea--error' : ''}`}
              placeholder="Подробно опишите что входит в услугу, сроки, форматы..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={5}
            />
            <div className="csm-hint">
              Минимум 50 символов
            </div>
            {errors.description && <span className="csm-error">{errors.description}</span>}
          </div>

          {/* Цена и срок */}
          <div className="csm-row">
            <div className="csm-field csm-field--half">
              <label className="csm-label">
                Цена (D coin) <span className="csm-required">*</span>
              </label>
              <input
                type="number"
                className={`csm-input ${errors.price ? 'csm-input--error' : ''}`}
                placeholder="100"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                min="1"
              />
              {formData.price && (
                <div className="csm-earnings">
                  Вы получите: <strong>{calculateAuthorEarnings()} D</strong>
                </div>
              )}
              {errors.price && <span className="csm-error">{errors.price}</span>}
            </div>

            <div className="csm-field csm-field--half">
              <label className="csm-label">
                Срок выполнения (дни) <span className="csm-required">*</span>
              </label>
              <input
                type="number"
                className={`csm-input ${errors.deliveryDays ? 'csm-input--error' : ''}`}
                placeholder="7"
                value={formData.deliveryDays}
                onChange={(e) => handleChange("deliveryDays", e.target.value)}
                min="1"
              />
              {errors.deliveryDays && <span className="csm-error">{errors.deliveryDays}</span>}
            </div>
          </div>

          {/* YouTube видео */}
          <div className="csm-field">
            <label className="csm-label">YouTube видео (опционально)</label>
            <input
              type="url"
              className={`csm-input ${errors.youtubeUrl ? 'csm-input--error' : ''}`}
              placeholder="https://youtube.com/watch?v=..."
              value={formData.youtubeUrl}
              onChange={(e) => handleChange("youtubeUrl", e.target.value)}
            />
            {errors.youtubeUrl && <span className="csm-error">{errors.youtubeUrl}</span>}
            
            {embedUrl && (
              <div className="csm-video-preview">
                <iframe
                  src={embedUrl}
                  title="YouTube preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>

        {/* Кнопки */}
        <div className="csm-actions">
          <button
            className="csm-btn csm-btn--secondary"
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            className="csm-btn csm-btn--primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
