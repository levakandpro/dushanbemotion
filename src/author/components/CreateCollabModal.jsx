import React, { useState, useEffect, useRef } from "react";
import "./CreateServiceModal.css";
import { createCollab } from "../../services/collabService";
import { uploadServiceCover } from "../../services/coverService";
import { supabase } from "../../lib/supabaseClient";
import Loader from "../../components/ui/Loader";

export default function CreateCollabModal({ isOpen, onClose, onCreated, currentUserId }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    partnerSearch: "",
    partnerId: null,
    partnerName: "",
    myShare: 50
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [coverUrl, setCoverUrl] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        description: "",
        partnerSearch: "",
        partnerId: null,
        partnerName: "",
        myShare: 50
      });
      setErrors({});
      setSearchResults([]);
      setCoverUrl(null);
      setCoverPreview(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Поиск партнёра
  useEffect(() => {
    const searchPartner = async () => {
      const query = formData.partnerSearch.trim();
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
          .neq('id', currentUserId)
          .limit(5);

        if (!error && data) {
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchPartner, 300);
    return () => clearTimeout(debounce);
  }, [formData.partnerSearch, currentUserId]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Введите название коллаба";
    }

    if (!formData.partnerId) {
      newErrors.partner = "Выберите партнёра";
    }

    if (formData.myShare < 1 || formData.myShare > 99) {
      newErrors.share = "Доля должна быть от 1% до 99%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, cover: "Файл слишком большой (макс 5MB)" }));
      return;
    }

    // Показываем превью сразу
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploadingCover(true);
    try {
      const url = await uploadServiceCover(file, currentUserId);
      setCoverUrl(url);
      setErrors(prev => ({ ...prev, cover: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, cover: "Ошибка загрузки: " + err.message }));
      setCoverPreview(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const removeCover = () => {
    setCoverUrl(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      console.log('Creating collab with coverUrl:', coverUrl);
      await createCollab(currentUserId, {
        partnerId: formData.partnerId,
        title: formData.title,
        description: formData.description,
        author1Share: formData.myShare,
        coverUrl: coverUrl
      });
      onCreated();
    } catch (err) {
      console.error("Error creating collab:", err);
      setErrors({ submit: err.message || "Ошибка создания коллаба" });
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

  const selectPartner = (partner) => {
    setFormData(prev => ({
      ...prev,
      partnerId: partner.id,
      partnerName: partner.display_name || partner.username,
      partnerSearch: ""
    }));
    setSearchResults([]);
    setErrors(prev => ({ ...prev, partner: null }));
  };

  const clearPartner = () => {
    setFormData(prev => ({
      ...prev,
      partnerId: null,
      partnerName: "",
      partnerSearch: ""
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="csm-overlay" onClick={onClose}>
      <div className="csm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="csm-close" onClick={onClose}>✕</button>

        <h2 className="csm-title">Создание коллаба</h2>
        <p className="csm-subtitle">
          Коллаб - двусторонний контракт. Партнёр должен подтвердить участие.
        </p>

        {errors.submit && (
          <div className="csm-error-banner">{errors.submit}</div>
        )}

        <div className="csm-form">
          {/* Название */}
          <div className="csm-field">
            <label className="csm-label">
              Название коллаба <span className="csm-required">*</span>
            </label>
            <input
              type="text"
              className={`csm-input ${errors.title ? 'csm-input--error' : ''}`}
              placeholder="Например: Совместный пак эффектов"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
            {errors.title && <span className="csm-error">{errors.title}</span>}
          </div>

          {/* Описание */}
          <div className="csm-field">
            <label className="csm-label">Описание (опционально)</label>
            <textarea
              className="csm-textarea"
              placeholder="Опишите цель коллаба..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          {/* Обложка */}
          <div className="csm-field">
            <label className="csm-label">Обложка коллаба</label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              style={{ display: "none" }}
            />
            {coverPreview ? (
              <div className="csm-cover-preview">
                <img src={coverPreview} alt="Preview" />
                <button type="button" className="csm-cover-remove" onClick={removeCover}>✕</button>
                {uploadingCover && (
                  <div className="csm-cover-loading">
                    <Loader fullscreen={false} inline size="minimal" showText={false} />
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="csm-cover-upload"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
              >
                {uploadingCover ? (
                  <Loader fullscreen={false} inline size="minimal" showText={false} />
                ) : (
                  <>
                    <span className="csm-cover-icon">📷</span>
                    <span>Загрузить обложку</span>
                  </>
                )}
              </button>
            )}
            {errors.cover && <span className="csm-error">{errors.cover}</span>}
          </div>

          {/* Партнёр */}
          <div className="csm-field">
            <label className="csm-label">
              Партнёр <span className="csm-required">*</span>
            </label>
            
            {formData.partnerId ? (
              <div className="csm-partner-selected">
                <span>{formData.partnerName}</span>
                <button type="button" onClick={clearPartner} className="csm-partner-clear">✕</button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  className={`csm-input ${errors.partner ? 'csm-input--error' : ''}`}
                  placeholder="Поиск по имени или username..."
                  value={formData.partnerSearch}
                  onChange={(e) => handleChange("partnerSearch", e.target.value)}
                />
                {searching && <div className="csm-hint">Поиск...</div>}
                {searchResults.length > 0 && (
                  <div className="csm-search-results">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        className="csm-search-item"
                        onClick={() => selectPartner(user)}
                      >
                        {user.avatar_url && (
                          <img src={user.avatar_url} alt="" className="csm-search-avatar" />
                        )}
                        <span>{user.display_name || user.username}</span>
                        {user.username && <span className="csm-search-username">@{user.username}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {errors.partner && <span className="csm-error">{errors.partner}</span>}
          </div>

          {/* Распределение дохода */}
          <div className="csm-field">
            <label className="csm-label">
              Распределение дохода <span className="csm-required">*</span>
            </label>
            <div className="csm-share-row">
              <div className="csm-share-item">
                <span>Вы</span>
                <input
                  type="number"
                  className={`csm-input csm-input--small ${errors.share ? 'csm-input--error' : ''}`}
                  value={formData.myShare}
                  onChange={(e) => handleChange("myShare", parseInt(e.target.value) || 0)}
                  min="1"
                  max="99"
                />
                <span>%</span>
              </div>
              <div className="csm-share-divider">:</div>
              <div className="csm-share-item">
                <span>Партнёр</span>
                <input
                  type="number"
                  className="csm-input csm-input--small"
                  value={100 - formData.myShare}
                  disabled
                />
                <span>%</span>
              </div>
            </div>
            {errors.share && <span className="csm-error">{errors.share}</span>}
            <div className="csm-hint">
              Проценты фиксируются при создании. Изменение требует подтверждения обеих сторон.
            </div>
          </div>
        </div>

        {/* Информация */}
        <div className="csm-system-info">
          <div className="csm-system-item">🤝 Партнёр получит приглашение</div>
          <div className="csm-system-item">✅ Коллаб активируется после подтверждения</div>
          <div className="csm-system-item">🔒 Все действия требуют согласия обеих сторон</div>
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
            {submitting ? "Создание..." : "Отправить приглашение"}
          </button>
        </div>
      </div>
    </div>
  );
}
