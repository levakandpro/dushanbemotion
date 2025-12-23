import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";
import Loader from "../components/ui/Loader";
import { getServiceById } from "../services/authorServiceService";
import { createOrder, getServiceStats, getServiceRecommendations } from "../services/orderService";
import { getCurrentUser } from "../services/userService";
import { uploadPaymentScreenshot } from "../services/coverService";
import "./ServiceViewPage.css";

const PLATFORM_COMMISSION = 20;
const defaultAva = "https://pub-b69ef7c5697c44e2ab311a83cae5c18a.r2.dev/default-avatar.png";

// Форматирование описания с поддержкой markdown-подобного синтаксиса
const formatDescription = (text) => {
  if (!text) return "";
  
  let html = text
    // Экранируем HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Жирный текст **text**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Курсив *text*
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Подчёркнутый __text__
    .replace(/__(.+?)__/g, "<u>$1</u>")
    // Зачёркнутый ~~text~~
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    // Списки - item
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Переносы строк
    .replace(/\n/g, "<br>");
  
  // Оборачиваем списки
  html = html.replace(/(<li>.*<\/li>)+/g, "<ul>$&</ul>");
  
  return html;
};

export default function ServiceViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [author, setAuthor] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({ ordersCount: 0, recommendationsCount: 0, avgRating: 0 });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  
  // Оплата заказа
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  
  const paymentMethods = [
    { id: 'dcity', name: 'D City', logo: '/assets/qr/dcity.png' },
    { id: 'spitamenpay', name: 'Спитамен Pay', logo: '/assets/qr/spitamenpay.png' },
    { id: 'vasl', name: 'Vasl', logo: '/assets/qr/vasl.png' },
    { id: 'alif', name: 'Алиф', logo: '/assets/qr/alif.png' },
    { id: 'eshata', name: 'Эсхата', logo: '/assets/qr/eshata.png' },
  ];

  useEffect(() => {
    loadService();
    loadCurrentUser();
  }, [id]);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.log("Not logged in");
    }
  };

  const loadService = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getServiceById(id);
      if (!data) {
        setError("Услуга не найдена");
        return;
      }
      setService(data);

      // Загружаем данные автора
      const { data: authorData } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, is_author")
        .eq("id", data.author_id)
        .single();
      
      if (authorData) {
        setAuthor(authorData);
      }

      // Загружаем статистику и рекомендации
      const [serviceStats, serviceRecs] = await Promise.all([
        getServiceStats(id),
        getServiceRecommendations(id)
      ]);
      
      setStats(serviceStats);
      setRecommendations(serviceRecs);
    } catch (err) {
      console.error("Error loading service:", err);
      setError("Ошибка загрузки услуги");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!currentUser) {
      navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    if (currentUser.id === service.author_id) {
      alert("Нельзя заказать свою услугу");
      return;
    }

    // Закрываем модалку заказа и открываем модалку оплаты
    setShowOrderModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentScreenshot(file);
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentScreenshot || !selectedPaymentMethod) {
      alert("Выберите способ оплаты и загрузите скрин");
      return;
    }

    try {
      setPaymentSubmitting(true);
      
      // Сначала создаём заказ чтобы получить ID
      const order = await createOrder(currentUser.id, service.id, orderMessage, {
        paymentMethod: selectedPaymentMethod,
        paymentScreenshot: null // Пока без скриншота
      });
      
      // Загружаем скриншот в R2 (папка payments/YYYY-MM-DD/)
      let screenshotUrl = null;
      try {
        screenshotUrl = await uploadPaymentScreenshot(paymentScreenshot, order.id);
        
        // Обновляем заказ с URL скриншота
        await supabase
          .from('service_orders')
          .update({ payment_screenshot: screenshotUrl })
          .eq('id', order.id);
      } catch (uploadErr) {
        console.error("Error uploading screenshot:", uploadErr);
        // Заказ уже создан, просто не загрузился скриншот
      }
      
      setCreatedOrderId(order.id);
      setPaymentSubmitted(true);
      
    } catch (err) {
      console.error("Error creating order:", err);
      alert(err.message || "Ошибка создания заказа");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    setPaymentScreenshot(null);
    setPaymentSubmitted(false);
    setOrderMessage("");
  };

  const handleGoToOrder = () => {
    setShowSuccessModal(false);
    navigate(`/order/${createdOrderId}`);
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? match[1] : null;
  };

  if (loading) {
    return <Loader />;
  }

  if (error || !service) {
    return (
      <div className="sv-page">
        <div className="sv-error">
          <h2>{error || "Услуга не найдена"}</h2>
          <button className="sv-btn" onClick={() => navigate("/bazar")}>
            Вернуться в BAZAR
          </button>
        </div>
      </div>
    );
  }

  const youtubeId = extractYouTubeId(service.youtube_url);
  const isOwnService = currentUser?.id === service.author_id;

  return (
    <div className="sv-page">
      <div className="sv-container">
        {/* Кнопка назад */}
        <button className="sv-back" onClick={() => navigate(-1)}>
          ← Назад
        </button>

        <div className="sv-layout">
          {/* Левая колонка - основной контент */}
          <div className="sv-main">
            {/* Заголовок */}
            <div className="sv-header">
              <h1 className="sv-title">
                {service.title}
              </h1>
              <div className="sv-meta">
                <span className="sv-rating">
                  ⭐ {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "-"}
                </span>
                <span className="sv-orders">{stats.ordersCount} заказов</span>
                {stats.recommendationsCount > 0 && (
                  <span className="sv-recommendations">🏆 {stats.recommendationsCount} МАЛАДЭС</span>
                )}
              </div>
            </div>

            {/* YouTube видео */}
            {youtubeId && (
              <div className="sv-video">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Описание */}
            <div className="sv-section">
              <h2 className="sv-section-title">Описание</h2>
              <div 
                className="sv-description"
                dangerouslySetInnerHTML={{ __html: formatDescription(service.description) }}
              />
            </div>

            {/* Галерея изображений */}
            {service.images && service.images.length > 0 && (
              <div className="sv-section">
                <h2 className="sv-section-title">Примеры работ</h2>
                <div className="sv-gallery">
                  {service.images.map((img, i) => (
                    <div key={i} className="sv-gallery__item" onClick={() => setSelectedImage(img)}>
                      <img src={img} alt="" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Рекомендации МАЛАДЭС */}
            {recommendations.length > 0 && (
              <div className="sv-section">
                <h2 className="sv-section-title">🏆 Рекомендации</h2>
                <div className="sv-recommendations-list">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="sv-recommendation">
                      <div className="sv-recommendation__header">
                        <img 
                          src={rec.client?.avatar_url || defaultAva} 
                          alt="" 
                          className="sv-recommendation__avatar"
                        />
                        <span className="sv-recommendation__name">
                          {rec.client?.display_name || rec.client?.username || "Клиент"}
                        </span>
                        <span className="sv-recommendation__badge">МАЛАДЭС</span>
                      </div>
                      {rec.comment && (
                        <p className="sv-recommendation__comment">{rec.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка - сайдбар */}
          <div className="sv-sidebar">
            {/* Карточка автора */}
            {author && (
              <div className="sv-author-card">
                <Link to={`/u/${author.username}`} className="sv-author-link">
                  <img 
                    src={author.avatar_url || defaultAva} 
                    alt="" 
                    className="sv-author-avatar"
                  />
                  <div className="sv-author-info">
                    <span className="sv-author-name">
                      {author.display_name || author.username}
                    </span>
                    {author.is_author && (
                      <span className="sv-author-badge">Автор</span>
                    )}
                  </div>
                </Link>
              </div>
            )}

            {/* Цена и заказ */}
            <div className="sv-order-card">
              <div className="sv-price-row">
                <span className="sv-price-label">Цена</span>
                <span className="sv-price-value">{service.price} DMC</span>
              </div>
              <div className="sv-delivery-row">
                <span className="sv-delivery-label">Срок выполнения</span>
                <span className="sv-delivery-value">{service.delivery_days} дней</span>
              </div>

              {isOwnService ? (
                <button className="sv-order-btn sv-order-btn--disabled" disabled>
                  Это ваша услуга
                </button>
              ) : (
                <button 
                  className="sv-order-btn"
                  onClick={() => setShowOrderModal(true)}
                >
                  Заказать услугу
                </button>
              )}

              <div className="sv-safe-deal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Safe Deal - деньги у платформы до выполнения</span>
              </div>
            </div>

            {/* Информация */}
            <div className="sv-info-card">
              <div className="sv-info-row">
                <span>💳</span>
                <span>Оплата через DMC</span>
              </div>
              <div className="sv-info-row">
                <span>🔒</span>
                <span>Безопасная сделка</span>
              </div>
              <div className="sv-info-row">
                <span>💬</span>
                <span>Чат с автором после оплаты</span>
              </div>
              <div className="sv-info-row">
                <span>↩️</span>
                <span>Возврат если не выполнено</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка заказа */}
      {showOrderModal && (
        <div className="sv-modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="sv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sv-modal__header">
              <h3>Заказать услугу</h3>
              <button className="sv-modal__close" onClick={() => setShowOrderModal(false)}>
                ×
              </button>
            </div>
            <div className="sv-modal__body">
              <div className="sv-modal__service">
                <span className="sv-modal__title">{service.title}</span>
              </div>
              <div className="sv-modal__price">
                <span>К оплате:</span>
                <strong>{service.price} DMC</strong>
              </div>
              <div className="sv-modal__field">
                <label>Сообщение автору (опционально)</label>
                <textarea
                  value={orderMessage}
                  onChange={(e) => setOrderMessage(e.target.value)}
                  placeholder="Опишите что именно вам нужно..."
                  rows={4}
                />
              </div>
              <div className="sv-modal__info">
                <p>После создания заказа вам нужно будет оплатить его.</p>
                <p>Деньги будут заморожены до выполнения работы.</p>
              </div>
            </div>
            <div className="sv-modal__footer">
              <button 
                className="sv-modal__cancel" 
                onClick={() => setShowOrderModal(false)}
              >
                Отмена
              </button>
              <button 
                className="sv-modal__submit"
                onClick={handleCreateOrder}
                disabled={orderLoading}
              >
                {orderLoading ? "Создание..." : "Создать заказ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка успешного создания заказа */}
      {showSuccessModal && (
        <div className="sv-success-overlay">
          <div className="sv-success-modal">
            <div className="sv-success__icon">
              <svg viewBox="0 0 52 52" className="sv-success__checkmark">
                <circle className="sv-success__circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="sv-success__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <h2 className="sv-success__title">Заказ создан!</h2>
            <p className="sv-success__text">
              Ваш заказ успешно создан. Теперь оплатите его, чтобы автор начал работу.
            </p>
            <div className="sv-success__info">
              <div className="sv-success__row">
                <span>Услуга</span>
                <span>{service?.title}</span>
              </div>
              <div className="sv-success__row">
                <span>Цена</span>
                <span className="sv-success__price">{service?.price} DMC</span>
              </div>
              <div className="sv-success__row">
                <span>Срок</span>
                <span>{service?.delivery_days} дней</span>
              </div>
            </div>
            <button className="sv-success__btn" onClick={handleGoToOrder}>
              Перейти к заказу
            </button>
          </div>
        </div>
      )}

      {/* Модалка просмотра изображения */}
      {selectedImage && (
        <div className="sv-image-overlay" onClick={() => setSelectedImage(null)}>
          <button className="sv-image-close" onClick={() => setSelectedImage(null)}>×</button>
          <img src={selectedImage} alt="" className="sv-image-full" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Модалка оплаты заказа */}
      {showPaymentModal && (
        <div className="sv-payment-overlay" onClick={handleClosePaymentModal}>
          <div className="sv-payment-modal" onClick={(e) => e.stopPropagation()}>
            {!paymentSubmitted ? (
              <>
                <div className="sv-payment__header">
                  <h2>Оплата заказа</h2>
                  <button className="sv-payment__close" onClick={handleClosePaymentModal}>×</button>
                </div>
                
                <div className="sv-payment__info">
                  <div className="sv-payment__row">
                    <span>Услуга:</span>
                    <strong>{service?.title}</strong>
                  </div>
                  <div className="sv-payment__row sv-payment__row--total">
                    <span>К оплате:</span>
                    <strong>{service?.price} сомони</strong>
                  </div>
                </div>

                <div className="sv-payment__methods">
                  <h3>Выберите способ оплаты</h3>
                  <div className="sv-payment__methods-grid">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        className={`sv-payment__method ${selectedPaymentMethod === method.id ? 'sv-payment__method--active' : ''}`}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <img src={method.logo} alt={method.name} />
                        <span>{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedPaymentMethod && (
                  <div className="sv-payment__qr">
                    <img 
                      src={`/assets/qr/${selectedPaymentMethod}.png`} 
                      alt="QR код для оплаты"
                      className="sv-payment__qr-image"
                    />
                    <p className="sv-payment__qr-amount">
                      Сумма: <strong>{service?.price} сомони</strong>
                    </p>
                    <p className="sv-payment__qr-hint">
                      Отсканируйте QR-код и оплатите точную сумму
                    </p>
                  </div>
                )}

                <div className="sv-payment__upload">
                  <h3>Загрузите скрин оплаты</h3>
                  {!paymentScreenshot ? (
                    <label className="sv-payment__upload-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentScreenshot}
                        style={{ display: 'none' }}
                      />
                      <span className="sv-payment__upload-btn">
                        📷 Выбрать скриншот
                      </span>
                    </label>
                  ) : (
                    <div className="sv-payment__upload-file">
                      <span>✓ {paymentScreenshot.name}</span>
                      <button onClick={() => setPaymentScreenshot(null)}>×</button>
                    </div>
                  )}
                </div>

                <div className="sv-payment__warning">
                  <p>⚠️ После отправки заказ будет создан со статусом "Ожидает подтверждения оплаты".</p>
                  <p>Администратор проверит платёж и подтвердит заказ.</p>
                </div>

                <div className="sv-payment__actions">
                  <button 
                    className="sv-payment__cancel" 
                    onClick={handleClosePaymentModal}
                  >
                    Отмена
                  </button>
                  <button 
                    className="sv-payment__submit"
                    onClick={handleSubmitPayment}
                    disabled={!paymentScreenshot || !selectedPaymentMethod || paymentSubmitting}
                  >
                    {paymentSubmitting ? "Отправка..." : "Отправить на проверку"}
                  </button>
                </div>
              </>
            ) : (
              <div className="sv-payment__success">
                <div className="sv-payment__success-icon">✓</div>
                <h2>Заказ отправлен на проверку!</h2>
                <p>Мы проверим ваш платёж и подтвердим заказ в течение 30 минут.</p>
                <p>После подтверждения автор начнёт работу над вашим заказом.</p>
                <div className="sv-payment__success-info">
                  <div className="sv-payment__row">
                    <span>Услуга:</span>
                    <strong>{service?.title}</strong>
                  </div>
                  <div className="sv-payment__row">
                    <span>Сумма:</span>
                    <strong>{service?.price} сомони</strong>
                  </div>
                  <div className="sv-payment__row">
                    <span>Срок выполнения:</span>
                    <strong>{service?.delivery_days} дней</strong>
                  </div>
                </div>
                <button 
                  className="sv-payment__success-btn"
                  onClick={() => {
                    handleClosePaymentModal();
                    if (createdOrderId) {
                      navigate(`/order/${createdOrderId}`);
                    }
                  }}
                >
                  Перейти к заказу
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
