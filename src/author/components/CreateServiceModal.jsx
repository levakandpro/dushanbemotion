import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { uploadServiceCover, uploadServiceImage } from "../../services/coverService";
import Loader from "../../components/ui/Loader";
import "./CreateServiceModal.css";

const PLATFORM_COMMISSION = 30;
const MAX_IMAGES = 5; // Премиум до 10
const STORAGE_KEY = "csm_draft";

// Варианты количества правок
const REVISIONS_OPTIONS = [
  { value: 1, label: "1 правка", hint: "Базовый" },
  { value: 2, label: "2 правки", hint: "Стандарт" },
  { value: 3, label: "3 правки", hint: "Комфорт" },
  { value: 5, label: "5 правок", hint: "Премиум" },
  { value: -1, label: "Безлимит", hint: "VIP" }
];

export default function CreateServiceModal({ isOpen, onClose, onCreateService, isPremium = false }) {
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const editorRef = useRef(null);
  const maxImages = isPremium ? 10 : MAX_IMAGES;
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    deliveryDays: "",
    youtubeUrl: "",
    revisions: 2
  });
  const [coverImage, setCoverImage] = useState(null);
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Загрузка черновика из localStorage при открытии
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setFormData({
            title: draft.title || "",
            description: draft.description || "",
            price: draft.price || "",
            deliveryDays: draft.deliveryDays || "",
            youtubeUrl: draft.youtubeUrl || "",
            revisions: draft.revisions || 2
          });
          setCoverImage(draft.coverImage || null);
          setImages(draft.images || []);
          // Восстанавливаем контент редактора
          if (editorRef.current && draft.editorHtml) {
            editorRef.current.innerHTML = draft.editorHtml;
          }
        } catch (e) {
          console.error("Error loading draft:", e);
        }
      } else {
        // Сброс формы если нет черновика
        setFormData({
          title: "",
          description: "",
          price: "",
          deliveryDays: "",
          youtubeUrl: "",
          revisions: 2
        });
        setCoverImage(null);
        setImages([]);
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
      }
      setErrors({});
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

  // Автосохранение в localStorage
  useEffect(() => {
    if (!isOpen) return;
    const draft = {
      ...formData,
      coverImage,
      images,
      editorHtml: editorRef.current?.innerHTML || ""
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [formData, coverImage, images, isOpen]);

  // Очистка черновика после успешного создания
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

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
      await onCreateService({
        ...formData,
        price: parseFloat(formData.price),
        deliveryDays: parseInt(formData.deliveryDays),
        revisions: formData.revisions,
        coverImage: coverImage,
        images: images
      });
      clearDraft(); // Очищаем черновик после успешного создания
      onClose();
    } catch (err) {
      console.error("Error creating service:", err);
      setErrors({ submit: err.message || "Ошибка создания услуги" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setErrors({ images: `Максимум ${maxImages} изображений` });
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setUploadingImages(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      const uploadedUrls = [];

      for (const file of filesToUpload) {
        // Проверка размера (5MB)
        if (file.size > 5 * 1024 * 1024) {
          setErrors({ images: "Файл слишком большой (макс 5MB)" });
          continue;
        }

        try {
          // Загружаем в R2 через worker
          const publicUrl = await uploadServiceImage(file, user.id);
          uploadedUrls.push(publicUrl);
        } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
          continue;
        }
      }

      setImages(prev => [...prev, ...uploadedUrls]);
      setErrors(prev => ({ ...prev, images: null }));
    } catch (err) {
      console.error("Error uploading images:", err);
      setErrors({ images: "Ошибка загрузки изображений" });
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Загрузка обложки в R2
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, cover: "Файл слишком большой (макс 5MB)" }));
      return;
    }

    setUploadingCover(true);
    setErrors(prev => ({ ...prev, cover: null }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrors(prev => ({ ...prev, cover: "Не авторизован" }));
        return;
      }

      // Загружаем в R2 через worker
      const publicUrl = await uploadServiceCover(file, user.id, coverImage);
      console.log("Cover uploaded to R2:", publicUrl);
      setCoverImage(publicUrl);
    } catch (err) {
      console.error("Error uploading cover:", err);
      setErrors(prev => ({ ...prev, cover: err.message || "Ошибка загрузки" }));
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const removeCover = () => {
    setCoverImage(null);
  };

  // Drag & Drop для изображений
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (!files.length) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setErrors({ images: `Максимум ${maxImages} изображений` });
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setUploadingImages(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      const uploadedUrls = [];

      for (const file of filesToUpload) {
        if (file.size > 5 * 1024 * 1024) continue;

        try {
          // Загружаем в R2 через worker
          const publicUrl = await uploadServiceImage(file, user.id);
          uploadedUrls.push(publicUrl);
        } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
          continue;
        }
      }

      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error("Error uploading images:", err);
    } finally {
      setUploadingImages(false);
    }
  };

  // Сортировка изображений перетаскиванием
  const handleImageDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleImageDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
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

  // Функции для WYSIWYG редактора
  const applyFormat = (format) => {
    switch (format) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        document.execCommand('italic', false, null);
        break;
      case 'underline':
        document.execCommand('underline', false, null);
        break;
      case 'strike':
        document.execCommand('strikeThrough', false, null);
        break;
      case 'list':
        document.execCommand('insertUnorderedList', false, null);
        break;
    }
    editorRef.current?.focus();
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || "";
      handleChange("description", text);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  if (!isOpen) return null;

  const embedUrl = getYoutubeEmbedUrl(formData.youtubeUrl);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="csm-overlay" onClick={handleOverlayClick}>
      <div className="csm-modal">
        <button className="csm-close" onClick={onClose}>✕</button>

        <h2 className="csm-title">Создание услуги</h2>
        <p className="csm-subtitle">Опишите услугу для публикации в BAZAR</p>

        {errors.submit && (
          <div className="csm-error-banner">{errors.submit}</div>
        )}

        <div className="csm-form">
          {/* Название */}
          <div className="csm-field">
            <label className="csm-label">
              Название услуги <span className="csm-required">*</span>
            </label>
            <input
              type="text"
              className={`csm-input ${errors.title ? 'csm-input--error' : ''}`}
              placeholder="Например: Создание анимированного логотипа"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
            {errors.title && <span className="csm-error">{errors.title}</span>}
          </div>

          {/* Описание */}
          <div className="csm-field">
            <label className="csm-label">
              Описание <span className="csm-required">*</span>
            </label>
            <div className="csm-editor">
              <div className="csm-editor__toolbar">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }} title="Жирный">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
                </button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }} title="Курсив">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
                </button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }} title="Подчеркнутый">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
                </button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('strike'); }} title="Зачеркнутый">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>
                </button>
                <span className="csm-editor__divider" />
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('list'); }} title="Список">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
                </button>
              </div>
              <div
                ref={editorRef}
                className={`csm-editor__content ${errors.description ? 'csm-editor__content--error' : ''}`}
                contentEditable
                onInput={handleEditorInput}
                onPaste={handlePaste}
                data-placeholder="Подробно опишите что входит в услугу, сроки, форматы..."
              />
            </div>
            <div className="csm-hint">
              Минимум 50 символов. Текущий: {formData.description.length}
            </div>
            {errors.description && <span className="csm-error">{errors.description}</span>}
          </div>

          {/* Цена и срок */}
          <div className="csm-row">
            <div className="csm-field csm-field--half">
              <label className="csm-label">
                Цена (TJS / сомони) <span className="csm-required">*</span>
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
                  Вы получите: <strong>{calculateAuthorEarnings()} DMC</strong>
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

          {/* Количество правок */}
          <div className="csm-field">
            <label className="csm-label">
              Бесплатные правки
            </label>
            <div className="csm-revisions">
              {REVISIONS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`csm-revision-btn ${formData.revisions === opt.value ? 'csm-revision-btn--active' : ''}`}
                  onClick={() => handleChange("revisions", opt.value)}
                >
                  <span className="csm-revision-label">{opt.label}</span>
                  <span className="csm-revision-hint">{opt.hint}</span>
                </button>
              ))}
            </div>
            <div className="csm-hint">
              Чем больше правок - тем привлекательнее услуга для клиента
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

          {/* Обложка услуги */}
          <div className="csm-field">
            <label className="csm-label">
              Обложка услуги
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              style={{ display: "none" }}
            />
            
            {coverImage ? (
              <div className="csm-cover">
                <img src={coverImage} alt="Обложка" />
                <button 
                  type="button"
                  className="csm-cover-remove"
                  onClick={removeCover}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="csm-cover-add"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
              >
                {uploadingCover ? (
                  <Loader fullscreen={false} inline size="minimal" showText={false} />
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Загрузить обложку</span>
                  </>
                )}
              </button>
            )}
            {errors.cover && <span className="csm-error">{errors.cover}</span>}
            <div className="csm-hint">
              Главное изображение услуги. Удалится после закрытия заказа.
            </div>
          </div>

          {/* Изображения */}
          <div className="csm-field">
            <label className="csm-label">
              Примеры работ (до {maxImages} изображений)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
            
            <div 
              className={`csm-dropzone ${dragOver ? 'csm-dropzone--active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {images.length === 0 ? (
                <div className="csm-dropzone__empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Перетащите изображения сюда</span>
                  <span className="csm-dropzone__or">или</span>
                  <button
                    type="button"
                    className="csm-dropzone__btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Выберите файлы
                  </button>
                </div>
              ) : (
                <div className="csm-images">
                  {images.map((url, index) => (
                    <div 
                      key={index} 
                      className={`csm-image-item ${draggedIndex === index ? 'csm-image-item--dragging' : ''}`}
                      draggable
                      onDragStart={() => handleImageDragStart(index)}
                      onDragOver={(e) => handleImageDragOver(e, index)}
                      onDragEnd={handleImageDragEnd}
                    >
                      <img src={url} alt="" />
                      <div className="csm-image-order">{index + 1}</div>
                      <button 
                        type="button"
                        className="csm-image-remove"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {images.length < maxImages && (
                    <button
                      type="button"
                      className="csm-image-add"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages}
                    >
                      {uploadingImages ? (
                        <Loader fullscreen={false} inline size="minimal" showText={false} />
                      ) : (
                        <>
                          <span className="csm-image-plus">+</span>
                          <span className="csm-image-text">Ещё</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {errors.images && <span className="csm-error">{errors.images}</span>}
            <div className="csm-hint">
              JPG, PNG до 5MB. Перетаскивайте для сортировки. {isPremium ? "Премиум: до 10" : "До 5"} изображений.
            </div>
          </div>
        </div>

        {/* Системная информация */}
        <div className="csm-system-info">
          <div className="csm-system-item">💳 Оплата через TJ-кошельки</div>
          <div className="csm-system-item">📊 Комиссия платформы - {PLATFORM_COMMISSION}%</div>
          <div className="csm-system-item">🔒 Контакт с клиентом после оформления заказа</div>
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
            {submitting ? "Создание..." : "Создать услугу"}
          </button>
        </div>
      </div>
    </div>
  );
}
