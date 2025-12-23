// src/pricing/PaymentScreen.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { uploadPaymentScreenshot } from '../services/coverService';
import { createAdminNotification } from '../admin/api/adminApi';
import './PaymentScreen.css';

export default function PaymentScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [rotatingTextIndex, setRotatingTextIndex] = useState(0);

  const rotatingTexts = [
    '60+ млн фонов - Таджикские и Персидские стили',
    '17+ млн стикеров - Таджикистан и Персия',
    '1000+ шаблонов - Исторические мотивы',
    'Переходы и эффекты - Восточная эстетика',
    'Культурные ассеты - Таджикская история',
    'Авторский контент - Персидские орнаменты',
    'Премиум визуалы - Центральная Азия',
    'Дизайн и шаблоны - Таджикские мотивы',
    'Фоны и стикеры - Персидский стиль',
    'Контент для проектов - Коммерческое использование',
    'Таджикские фоны - Премиум',
    'Персидские орнаменты - Ассеты',
    'Исторические визуалы - D Motion',
    'Культура Востока - Коммерция',
    'Центральная Азия - Дизайн',
  ];

  // Ротация текста
  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

  // Разрешаем прокрутку страницы
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    
    html.style.overflowY = 'auto';
    html.style.overflowX = 'hidden';
    html.style.height = 'auto';
    body.style.overflowY = 'auto';
    body.style.overflowX = 'hidden';
    body.style.height = 'auto';
    if (root) {
      root.style.overflowY = 'auto';
      root.style.overflowX = 'hidden';
      root.style.height = 'auto';
    }

    return () => {
      html.style.overflowY = '';
      html.style.overflowX = '';
      html.style.height = '';
      body.style.overflowY = '';
      body.style.overflowX = '';
      body.style.height = '';
      if (root) {
        root.style.overflowY = '';
        root.style.overflowX = '';
        root.style.height = '';
      }
    };
  }, []);

  // Редирект если не авторизован
  useEffect(() => {
    if (!loading && !user) {
      navigate('/pricing');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (location.state?.plan) {
      setSelectedPlan(location.state.plan);
    }
    // Если зашли напрямую на /payment без выбора тарифа, используем premium по умолчанию
  }, [location.state]);

  const planData = {
    premium: {
      name: 'PREMIUM',
      amount: '160',
      period: 'месяц',
    },
    premium_plus: {
      name: 'PREMIUM+',
      amount: '1100',
      period: 'год',
    },
  };

  const currentPlan = planData[selectedPlan] || planData.premium;

  const paymentMethods = [
    { id: 'dcity', name: 'D City', logo: '/assets/qr/dcity.png' },
    { id: 'spitamenpay', name: 'Спитамен Pay', logo: '/assets/qr/spitamenpay.png' },
    { id: 'vasl', name: 'Vasl', logo: '/assets/qr/vasl.png' },
    { id: 'alif', name: 'Алиф', logo: '/assets/qr/alif.png' },
    { id: 'eshata', name: 'Эсхата', logo: '/assets/qr/eshata.png' },
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!selectedFile) return;
    if (!selectedMethod) {
      alert('Выберите способ оплаты');
      return;
    }

    try {
      setSubmitting(true);

      const requestId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `req-${Date.now()}-${Math.random().toString(16).slice(2)}`

      // Загружаем скриншот в R2
      const screenshotUrl = await uploadPaymentScreenshot(selectedFile, requestId);

      // Создаём уведомление админке (его поймает realtime + звук)
      await createAdminNotification(
        'premium_payment',
        'Оплата PREMIUM',
        `Пользователь ${user.email || user.id.slice(0, 8)} отправил скрин оплаты (${selectedPlan})`,
        {
          user_id: user.id,
          plan_id: selectedPlan,
          payment_method: selectedMethod,
          payment_screenshot: screenshotUrl,
          request_id: requestId
        }
      );

      setIsSubmitted(true);
    } catch (e) {
      console.error('Payment submit error:', e);
      alert(e?.message || 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  // Не показываем состояние отправки на весь экран, оно будет в блоке загрузки

  return (
    <div className="dm-payment-page">
      <div className="dm-payment-container">
        <button
          type="button"
          className="dm-payment-back-btn"
          onClick={() => navigate('/pricing')}
        >
          <svg className="dm-payment-back-btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          НАЗАД
        </button>
        
        <header className="dm-payment-header">
          <h1 className="dm-payment-title">Оплата тарифа</h1>
          <p className="dm-payment-subtitle">
            Выберите удобный способ оплаты и загрузите скрин перевода
          </p>
          <div className="dm-payment-rotating-text">
            <span key={rotatingTextIndex} className="dm-payment-rotating-text__item">
              {rotatingTexts[rotatingTextIndex]}
            </span>
          </div>
        </header>

        {/* Выбранный тариф */}
        <div className="dm-payment-plan-info">
          <div className="dm-payment-plan-info__row">
            <span className="dm-payment-plan-info__label">Тариф:</span>
            <span className="dm-payment-plan-info__value">{currentPlan.name}</span>
          </div>
          <div className="dm-payment-plan-info__row">
            <span className="dm-payment-plan-info__label">Сумма:</span>
            <span className="dm-payment-plan-info__value">
              <span className="dm-payment-plan-info__amount-value">{currentPlan.amount} с</span>
            </span>
          </div>
          <div className="dm-payment-plan-info__row">
            <span className="dm-payment-plan-info__label">Доступ:</span>
            <span className="dm-payment-plan-info__value">Полный</span>
          </div>
        </div>

        {/* Оплата из Таджикистана */}
        <section className="dm-payment-section">
          <div className="dm-payment-section__header">
            <h2 className="dm-payment-section__title">Оплата из Таджикистана</h2>
            <p className="dm-payment-section__subtitle">
              Отсканируйте QR-код в одном из кошельков и оплатите указанную сумму
            </p>
          </div>

          <div className="dm-payment-methods">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                className={`dm-payment-method ${
                  selectedMethod === method.id ? 'dm-payment-method--active' : ''
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <div className="dm-payment-method__logo">
                  <img src={method.logo} alt={method.name} />
                </div>
                <span className="dm-payment-method__name">{method.name}</span>
              </button>
            ))}
          </div>

          {selectedMethod && (
            <div className="dm-payment-qr">
              <div 
                className="dm-payment-qr__code"
                onClick={() => setShowQrModal(true)}
                style={{ cursor: 'pointer' }}
              >
                <img 
                  src={`/assets/qr/${selectedMethod}.png`} 
                  alt={`QR-код ${paymentMethods.find(m => m.id === selectedMethod)?.name}`}
                  className="dm-payment-qr__image"
                />
              </div>
              <p className="dm-payment-qr__amount">
                Сумма: <span className="dm-payment-qr__amount-value">{currentPlan.amount} с</span>
              </p>
              <p className="dm-payment-qr__exact-amount">
                Оплачивайте точную сумму
              </p>
              <p className="dm-payment-qr__hint">
                В комментарии укажите email в D Motion
              </p>
            </div>
          )}
        </section>

        {/* Оплата из России */}
        <section className="dm-payment-section">
          <div className="dm-payment-section__header">
            <h2 className="dm-payment-section__title">Оплата из России</h2>
          </div>
          <div className="dm-payment-russia">
            <p className="dm-payment-russia__text">
              Оплата через кошельки Таджикистана D City ● Эсхата ● Спитаменпей ● Васл ● Алиф - подтверждение вручную по скрину.
            </p>
          </div>
        </section>

        {/* Загрузка скрина */}
        <section className="dm-payment-section">
          <div className="dm-payment-section__header">
            <h2 className="dm-payment-section__title">Скрин оплаты</h2>
          </div>
          
          {!isSubmitted ? (
            <div className="dm-payment-upload">
              {!selectedFile ? (
                <>
                  <label className="dm-payment-upload__label">
                    <input
                      type="file"
                      className="dm-payment-upload__input"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                    <span className="dm-payment-upload__btn">
                      Загрузить скрин оплаты
                    </span>
                  </label>
                  <p className="dm-payment-upload__hint">
                    Поддерживаются изображения PNG и JPG.
                  </p>
                </>
              ) : (
                <>
                  <div className="dm-payment-upload__file">
                    <span className="dm-payment-upload__filename-label">Выбран файл:</span>
                    <span className="dm-payment-upload__filename">{selectedFile.name}</span>
                  </div>
                  <button
                    type="button"
                    className="dm-payment-upload__submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Отправляем...' : 'Отправить на проверку'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="dm-payment-submitted">
              <div className="dm-payment-submitted__icon"></div>
              <h3 className="dm-payment-submitted__title">Платёж отправлен на проверку</h3>
              <p className="dm-payment-submitted__text">
                Мы проверим скрин вручную и включим тариф после подтверждения.
              </p>
              <div className="dm-payment-submitted__social">
                <h4 className="dm-payment-submitted__social-title">Спасибо, что поддерживаете D Motion</h4>
                <p className="dm-payment-submitted__social-text">
                  Подписывайтесь на наши соцсети.<br />
                  Все акции и подарки доступны только там.
                </p>
                <div className="dm-payment-submitted__social-icons">
                  <a
                    href="https://t.me/dushanbemotion"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dm-payment-submitted__social-icon"
                    title="Telegram"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="currentColor"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/dushanbemotion"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dm-payment-submitted__social-icon"
                    title="Instagram"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.youtube.com/@dushanbemotion"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dm-payment-submitted__social-icon"
                    title="YouTube"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="currentColor"/>
                    </svg>
                  </a>
                </div>
                <p className="dm-payment-submitted__social-note">
                  Ваша подписка - лучшая поддержка проекта.
                </p>
              </div>
              <button
                type="button"
                className="dm-payment-submitted__btn"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                Вернуться на главную
              </button>
            </div>
          )}
        </section>

        {/* Что происходит после оплаты */}
        <section className="dm-payment-after-payment">
          <h2 className="dm-payment-after-payment__title">Что происходит после оплаты</h2>
          <ul className="dm-payment-after-payment__list">
            <li>Вы оплачиваете тариф и загружаете скрин перевода</li>
            <li>Мы вручную сверяем платёж с выпиской банка</li>
            <li>В течение 30 минут тариф активируется</li>
            <li>Статус появится в личном кабинете</li>
            <li>Вы получите уведомление в интерфейсе D Motion</li>
          </ul>
        </section>

        {/* Жёсткие финансовые правила */}
        <div className="dm-payment-financial-warning">
          <div className="dm-payment-financial-warning__icon"></div>
          <div className="dm-payment-financial-warning__content">
            <h3 className="dm-payment-financial-warning__title">Важные условия оплаты</h3>
            <ul className="dm-payment-financial-warning__list">
              <li>Сумма перевода должна быть точной</li>
              <li>Если сумма меньше - тариф не активируется</li>
              <li>Возврат средств не производится</li>
              <li>Если сумма больше стоимости тарифа - разница считается добровольной поддержкой проекта</li>
              <li>Дополнительные средства не переносятся и не компенсируются</li>
            </ul>
          </div>
        </div>

        {/* Анти-фрод */}
        <section className="dm-payment-antifraud">
          <h2 className="dm-payment-antifraud__title">Защита от мошенничества</h2>
          <p className="dm-payment-antifraud__text">
            Мы проверяем все платежи вручную. Сверяется сумма, время перевода, банк и получатель. Скрины, созданные с помощью ИИ или подделанные изображения, не принимаются. Любая попытка обмана приведёт к пожизненной блокировке аккаунта.
          </p>
          <p className="dm-payment-antifraud__subtext">
            Блокировка производится по аккаунту, устройству и внутреннему ID.
          </p>
        </section>

        {/* Юридическое предупреждение */}
        <div className="dm-payment-legal-warning">
          <p className="dm-payment-legal-warning__text">
            Мошеннические действия, связанные с банковскими переводами и подделкой платёжных документов, могут подпадать под ответственность в соответствии с законодательством Республики Таджикистан. Мы оставляем за собой право передавать информацию банкам и платёжным системам.
          </p>
        </div>

        {/* Нет нужного способа оплаты */}
        <section className="dm-payment-alternative">
          <h2 className="dm-payment-alternative__title">Другой банк или другая страна?</h2>
          <p className="dm-payment-alternative__text">
            Если вы находитесь в другой стране или у вас нет подходящего способа оплаты - напишите нам в Telegram, мы найдём решение и подключим вас максимально быстро.
          </p>
          <a
            href="https://t.me/dushanbemotion"
            target="_blank"
            rel="noopener noreferrer"
            className="dm-payment-alternative__btn"
          >
            Написать в Telegram
          </a>
        </section>

        {/* Важно */}
        <div className="dm-payment-info">
          <div className="dm-payment-info__icon">i</div>
          <p className="dm-payment-info__text">
            Убедитесь, что сумма перевода и email указаны правильно - без этого мы не сможем подтвердить оплату.
          </p>
        </div>

        {/* Финальная подпись */}
        <p className="dm-payment-footer">
          Оплата подтверждается вручную. Все действия фиксируются. Любые попытки обхода системы приводят к блокировке.
        </p>
        <p className="dm-payment-footer-confirmation">
          Подтверждение до 30 минут
        </p>
      </div>

      {/* Модальное окно для QR-кода */}
      {showQrModal && selectedMethod && (
        <div 
          className="dm-payment-qr-modal"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="dm-payment-qr-modal__content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="dm-payment-qr-modal__close"
              onClick={() => setShowQrModal(false)}
            >
              Г-
            </button>
            <div className="dm-payment-qr-modal__qr">
              <img 
                src={`/assets/qr/${selectedMethod}.png`} 
                alt={`QR-код ${paymentMethods.find(m => m.id === selectedMethod)?.name}`}
              />
            </div>
            <p className="dm-payment-qr-modal__amount">
              Сумма: <span className="dm-payment-qr-modal__amount-value">{currentPlan.amount} с</span>
            </p>
            <p className="dm-payment-qr-modal__exact-amount">
              Оплачивайте точную сумму
            </p>
            <p className="dm-payment-qr-modal__hint">
              В комментарии укажите email в D Motion
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

