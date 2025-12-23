// src/pricing/PricingScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { getUserProfile } from '../services/userService';
import { getCurrentSubscription, getPlans, getPricingSettings } from '../services/billingService';
import Loader from '../components/ui/Loader';
import './PricingScreen.css';

export default function PricingScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [rotatingTextIndex, setRotatingTextIndex] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [pricingSettings, setPricingSettings] = useState(null);

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

  // Загрузка тарифов и настроек из базы
  useEffect(() => {
    async function loadData() {
      setPlansLoading(true);
      try {
        const [loadedPlans, loadedSettings] = await Promise.all([
          getPlans(),
          getPricingSettings()
        ]);
        setPlans(loadedPlans);
        setPricingSettings(loadedSettings);
      } catch (e) {
        console.error('Error loading data:', e);
      } finally {
        setPlansLoading(false);
      }
    }
    loadData();
  }, []);

  // Ротация текста
  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

  // Загружаем информацию о подписке
  useEffect(() => {
    if (user && !loading) {
      loadSubscriptionData();
    } else if (!user && !loading) {
      setSubscriptionLoading(false);
    }
  }, [user, loading]);

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

  const loadSubscriptionData = async () => {
    if (!user) return;
    try {
      setSubscriptionLoading(true);
      
      // Сначала загружаем профиль (он точно должен существовать)
      let profileData = null;
      try {
        profileData = await getUserProfile(user.id);
      } catch (err) {
        console.warn('Error loading profile:', err);
      }
      setProfile(profileData);
      
      // Затем пытаемся загрузить подписку (таблица может не существовать)
      // Если таблица не существует (404), функция вернет null без ошибки
      let subData = null;
      try {
        subData = await getCurrentSubscription(user.id);
      } catch (err) {
        // Игнорируем ошибки подписки - используем профиль вместо этого
        subData = null;
      }
      setSubscription(subData);
      
      // TODO: загрузить историю оплат
      // const history = await getPaymentHistory(user.id);
      // setPaymentHistory(history);
    } catch (error) {
      console.error('Unexpected error loading subscription data:', error);
      // Устанавливаем null, чтобы не ломать интерфейс
      setSubscription(null);
      setProfile(null);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleSelectPlan = (planKey) => {
    if (!user && planKey !== 'free') {
      return; // Не даем выбрать платный тариф без авторизации
    }
    setSelectedPlan(planKey);
    if (planKey === 'free') {
      // Для FREE можно без авторизации
      return;
    }
    navigate('/payment', { state: { plan: planKey } });
  };

  const handleRenew = () => {
    if (!activeSubscription) return;
    navigate('/payment', { 
      state: { 
        plan: activeSubscription.tier === 'premium' ? 'premium' : 'premium_plus',
        renew: true 
      } 
    });
  };

  const handleChangePlan = () => {
    if (!activeSubscription) return;
    const newPlan = activeSubscription.tier === 'premium' ? 'premium_plus' : 'premium';
    navigate('/payment', { 
      state: { 
        plan: newPlan,
        change: true 
      } 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getProgressPercent = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    const total = end - start;
    const passed = now - start;
    return Math.min(100, Math.max(0, (passed / total) * 100));
  };

  // Проверяем активную подписку: либо из таблицы subscriptions, либо из профиля
  const checkFromSubscription = subscription && subscription.status === 'active';
  const checkFromProfile = profile && profile.current_plan && 
    profile.current_plan !== 'free' && 
    profile.current_plan !== null &&
    profile.plan_expires_at && 
    new Date(profile.plan_expires_at) > new Date();
  
  const isSubscriptionActive = checkFromSubscription || checkFromProfile;
  
  // Определяем данные подписки (приоритет - таблица subscriptions, иначе - профиль)
  const activeSubscription = subscription || (profile && profile.current_plan && profile.current_plan !== 'free' && profile.current_plan !== null ? {
    tier: profile.current_plan === 'premium_plus' || profile.current_plan === 'premium+' ? 'premium_plus' : 'premium',
    status: 'active',
    current_period_end: profile.plan_expires_at,
    created_at: profile.created_at || new Date().toISOString()
  } : null);

  // Отладка
  console.log('🔍 Subscription check:', {
    subscription,
    profileCurrentPlan: profile?.current_plan,
    profileExpiresAt: profile?.plan_expires_at,
    checkFromSubscription,
    checkFromProfile,
    isSubscriptionActive,
    activeSubscription,
    subscriptionLoading
  });
  
  const daysRemaining = isSubscriptionActive && activeSubscription?.current_period_end 
    ? getDaysRemaining(activeSubscription.current_period_end) 
    : 0;
  const progressPercent = isSubscriptionActive && activeSubscription?.created_at && activeSubscription?.current_period_end
    ? getProgressPercent(activeSubscription.created_at, activeSubscription.current_period_end) 
    : 0;

  return (
    <div className="dm-pricing-page">
      <div className="dm-pricing-container">
        <button
          type="button"
          className="dm-pricing-back-btn"
          onClick={() => {
            const returnTo = sessionStorage.getItem('dm_return_to');
            sessionStorage.removeItem('dm_return_to');
            if (returnTo === 'stickers' || returnTo === 'editor') {
              navigate('/editor');
            } else if (returnTo) {
              navigate(returnTo);
            } else {
              // По умолчанию возвращаемся в редактор
              navigate('/editor');
            }
          }}
        >
          <svg className="dm-pricing-back-btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          НАЗАД
        </button>
        
        {/* LOGIN GATE - перед тарифами */}
        {!user && !loading && (
          <div className="dm-pricing-login-gate">
            <h2 className="dm-pricing-login-gate__title">Для оплаты необходимо войти в аккаунт</h2>
            <p className="dm-pricing-login-gate__subtitle">
              Это нужно, чтобы мы могли активировать тариф, отслеживать срок действия и показывать статус оплаты в личном кабинете.
            </p>
            <div className="dm-pricing-login-gate__buttons">
              <button
                type="button"
                className="dm-pricing-login-gate__btn dm-pricing-login-gate__btn--primary"
                onClick={() => navigate('/auth/login')}
              >
                Войти
              </button>
              <button
                type="button"
                className="dm-pricing-login-gate__btn dm-pricing-login-gate__btn--secondary"
                onClick={() => navigate('/auth/register')}
              >
                Создать аккаунт
              </button>
            </div>
            <p className="dm-pricing-login-gate__hint">
              Без авторизации оплата недоступна.
            </p>
          </div>
        )}

        <header className="dm-pricing-header">
          <h1 className="dm-pricing-title">
            {isSubscriptionActive ? 'Управление подпиской' : 'Выберите тариф'}
          </h1>
          {!isSubscriptionActive && (
            <div className="dm-pricing-rotating-text">
              <span key={rotatingTextIndex} className="dm-pricing-rotating-text__item">
                {rotatingTexts[rotatingTextIndex]}
              </span>
            </div>
          )}
        </header>

        {/* Блок "Текущая подписка" - показывается только если подписка активна */}
        {isSubscriptionActive && !subscriptionLoading && activeSubscription && (
          <div className="dm-pricing-current-subscription">
            <h2 className="dm-pricing-current-subscription__title">Текущая подписка</h2>
            <div className="dm-pricing-current-subscription__card">
              <div className="dm-pricing-current-subscription__info">
                <div className="dm-pricing-current-subscription__row">
                  <span className="dm-pricing-current-subscription__label">Тариф:</span>
                  <span className="dm-pricing-current-subscription__value">
                    {activeSubscription.tier === 'premium' ? 'PREMIUM' : 'PREMIUM+'}
                  </span>
                </div>
                <div className="dm-pricing-current-subscription__row">
                  <span className="dm-pricing-current-subscription__label">Статус:</span>
                  <span className="dm-pricing-current-subscription__value dm-pricing-current-subscription__value--active">
                    Активен
                  </span>
                </div>
                <div className="dm-pricing-current-subscription__row">
                  <span className="dm-pricing-current-subscription__label">Доступ:</span>
                  <span className="dm-pricing-current-subscription__value">Полный</span>
                </div>
                <div className="dm-pricing-current-subscription__row">
                  <span className="dm-pricing-current-subscription__label">Регион оплаты:</span>
                  <span className="dm-pricing-current-subscription__value">
                    {profile?.country === 'RU' ? 'Россия' : 'Таджикистан'}
                  </span>
                </div>
                <div className="dm-pricing-current-subscription__row">
                  <span className="dm-pricing-current-subscription__label">Способ оплаты:</span>
                  <span className="dm-pricing-current-subscription__value">
                    D City / Эсхата / Спитаменпей / Васл / Алиф
                  </span>
                </div>
              </div>
              <div className="dm-pricing-current-subscription__period">
                <div className="dm-pricing-current-subscription__period-header">
                  <span className="dm-pricing-current-subscription__period-label">
                    Активен до: {formatDate(activeSubscription.current_period_end)}
                  </span>
                  <span className={`dm-pricing-current-subscription__period-remaining ${
                    daysRemaining < 7 ? 'dm-pricing-current-subscription__period-remaining--warning' : ''
                  }`}>
                    Осталось: {daysRemaining} {daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'}
                  </span>
                </div>
                <div className="dm-pricing-current-subscription__progress">
                  <div 
                    className={`dm-pricing-current-subscription__progress-bar ${
                      daysRemaining < 7 ? 'dm-pricing-current-subscription__progress-bar--warning' : ''
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="dm-pricing-current-subscription__actions">
                <button
                  type="button"
                  className="dm-pricing-current-subscription__btn dm-pricing-current-subscription__btn--primary"
                  onClick={handleRenew}
                >
                  Продлить подписку
                </button>
                {activeSubscription.tier === 'premium' && (
                  <button
                    type="button"
                    className="dm-pricing-current-subscription__btn dm-pricing-current-subscription__btn--secondary"
                    onClick={handleChangePlan}
                  >
                    Изменить тариф
                  </button>
                )}
                <button
                  type="button"
                  className="dm-pricing-current-subscription__btn dm-pricing-current-subscription__btn--ghost"
                  onClick={() => {
                    // TODO: открыть модальное окно с историей оплат
                    const historySection = document.querySelector('.dm-pricing-payment-history');
                    if (historySection) {
                      historySection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  История оплат
                </button>
              </div>
            </div>
            <div className="dm-pricing-current-subscription__note">
              Подписка активирована вручную после проверки платежа. В случае продления срок суммируется.
            </div>
          </div>
        )}

        {/* История оплат */}
        {isSubscriptionActive && !subscriptionLoading && (
          <div className="dm-pricing-payment-history">
            <h2 className="dm-pricing-payment-history__title">История оплат</h2>
            {paymentHistory.length > 0 ? (
              <div className="dm-pricing-payment-history__list">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="dm-pricing-payment-history__item">
                    <div className="dm-pricing-payment-history__date">
                      {formatDate(payment.created_at)}
                    </div>
                    <div className="dm-pricing-payment-history__plan">
                      {payment.plan === 'premium' ? 'PREMIUM' : 'PREMIUM+'}
                    </div>
                    <div className="dm-pricing-payment-history__amount">
                      {payment.amount} с
                    </div>
                    <div className="dm-pricing-payment-history__status">
                      {payment.status === 'confirmed' ? 'Подтверждено' : 'Проверяется'}
                    </div>
                    <div className="dm-pricing-payment-history__id">
                      ID: {payment.id.substring(0, 8)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dm-pricing-payment-history__empty">
                История оплат появится после первой оплаты
              </p>
            )}
          </div>
        )}

        {/* Витрина тарифов - показывается только если подписка НЕ активна */}
        {!isSubscriptionActive && (
          <div className="dm-pricing-cards">
          {plansLoading ? (
            <Loader fullscreen={false} size="compact" />
          ) : (
            <>
            {/* FREE */}
            {(() => {
              const freePlan = plans.find(p => p.id === 'free');
              const features = freePlan?.features_list || ['Доступ ко всем базовым функциям', 'Часть шрифтов и стикеров', 'Ограниченные шаблоны'];
              return (
                <div className="dm-pricing-card">
                  <div className="dm-pricing-card__header">
                    <h2 className="dm-pricing-card__title">{freePlan?.name || 'FREE'}</h2>
                  </div>
                  <div className="dm-pricing-card__price">
                    <span className="dm-pricing-card__price-amount">{freePlan?.price || 0}</span>
                    <span className="dm-pricing-card__price-currency">с</span>
                  </div>
                  <ul className="dm-pricing-card__features">
                    {features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                  <p className="dm-pricing-card__hint">
                    Премиум-контент помечен отдельно
                  </p>
                  <button
                    type="button"
                    className="dm-pricing-card__btn dm-pricing-card__btn--ghost"
                    onClick={() => handleSelectPlan('free')}
                  >
                    Начать бесплатно
                  </button>
                </div>
              );
            })()}

            {/* PREMIUM */}
            {(() => {
              const premiumPlan = plans.find(p => p.id === 'premium');
              const features = premiumPlan?.features_list || ['Все шрифты без ограничений', 'Все стикеры и фоны', 'Все шаблоны', 'Доступ ко всему премиум-контенту'];
              return (
                <div className="dm-pricing-card dm-pricing-card--featured">
                  {premiumPlan?.badge && <div className="dm-pricing-card__badge">{premiumPlan.badge}</div>}
                  <div className="dm-pricing-card__header">
                    <h2 className="dm-pricing-card__title">{premiumPlan?.name || 'PREMIUM'}</h2>
                  </div>
                  <div className="dm-pricing-card__price">
                    <span className="dm-pricing-card__price-amount">{premiumPlan?.price || 160}</span>
                    <span className="dm-pricing-card__price-currency">с / {premiumPlan?.interval === 'year' ? 'год' : 'месяц'}</span>
                  </div>
                  <ul className="dm-pricing-card__features">
                    {features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                  {user ? (
                    <button
                      type="button"
                      className="dm-pricing-card__btn dm-pricing-card__btn--primary"
                      onClick={() => handleSelectPlan('premium')}
                    >
                      Перейти к оплате
                    </button>
                  ) : (
                    <div className="dm-pricing-card__login-gate">
                      <h3 className="dm-pricing-card__login-gate-title">Для оплаты необходимо войти в аккаунт</h3>
                      <p className="dm-pricing-card__login-gate-subtitle">
                        Это нужно, чтобы мы могли активировать тариф, отслеживать срок действия и показывать статус оплаты в личном кабинете.
                      </p>
                      <div className="dm-pricing-card__login-gate-buttons">
                        <button
                          type="button"
                          className="dm-pricing-card__login-gate-btn dm-pricing-card__login-gate-btn--primary"
                          onClick={() => navigate('/auth/login')}
                        >
                          Войти
                        </button>
                        <button
                          type="button"
                          className="dm-pricing-card__login-gate-btn dm-pricing-card__login-gate-btn--secondary"
                          onClick={() => navigate('/auth/register')}
                        >
                          Создать аккаунт
                        </button>
                      </div>
                      <p className="dm-pricing-card__login-gate-hint">
                        Без авторизации оплата недоступна.
                      </p>
                    </div>
                  )}
                  <p className="dm-pricing-card__payment-hint">
                    {(pricingSettings?.payment_hint || 'Оплата через кошельки Таджикистана D City ● Эсхата ● Спитаменпей ● Васл ● Алиф - подтверждение вручную по скрину.')
                      .replace(
                        'Оплата через банки Таджикистана и кошелёк ЮMoney - подтверждение вручную по скрину.',
                        'Оплата через кошельки Таджикистана D City ● Эсхата ● Спитаменпей ● Васл ● Алиф - подтверждение вручную по скрину.'
                      )
                      .replace(
                        'Оплата через банки Таджикистана и кошелек ЮMoney - подтверждение вручную по скрину.',
                        'Оплата через кошельки Таджикистана D City ● Эсхата ● Спитаменпей ● Васл ● Алиф - подтверждение вручную по скрину.'
                      )}
                  </p>
                </div>
              );
            })()}

            {/* PREMIUM+ */}
            {(() => {
              const premiumPlusPlan = plans.find(p => p.id === 'premium_plus');
              const premiumPlan = plans.find(p => p.id === 'premium');
              const features = premiumPlusPlan?.features_list || ['Полный доступ без ограничений', 'Всё как в PREMIUM', 'Максимальная выгода'];
              const monthlyEquivalent = premiumPlusPlan ? Math.round(premiumPlusPlan.price / 12) : 92;
              const yearlySavings = premiumPlan && premiumPlusPlan ? (premiumPlan.price * 12) - premiumPlusPlan.price : 820;
              const savingsPercent = premiumPlan && premiumPlusPlan ? Math.round((1 - premiumPlusPlan.price / (premiumPlan.price * 12)) * 100) : 43;
              
              return (
                <div className="dm-pricing-card">
                  {premiumPlusPlan?.badge && (
                    <div className="dm-pricing-card__badge dm-pricing-card__badge--savings">
                      {premiumPlusPlan.badge}
                    </div>
                  )}
                  <div className="dm-pricing-card__header">
                    <h2 className="dm-pricing-card__title">{premiumPlusPlan?.name || 'PREMIUM+'}</h2>
                  </div>
                  <div className="dm-pricing-card__price">
                    <span className="dm-pricing-card__price-amount">{premiumPlusPlan?.price || 1100}</span>
                    <span className="dm-pricing-card__price-currency">с / {premiumPlusPlan?.interval === 'month' ? 'месяц' : 'год'}</span>
                  </div>
                  <div className="dm-pricing-card__price-hint">
                    <span>≈ {monthlyEquivalent} с в месяц</span>
                    <span className="dm-pricing-card__savings">
                      Экономия {yearlySavings} с в год (−{savingsPercent}%)
                    </span>
                  </div>
                  <ul className="dm-pricing-card__features">
                    {features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                  {user ? (
                    <button
                      type="button"
                      className="dm-pricing-card__btn dm-pricing-card__btn--primary dm-pricing-card__btn--premium"
                      onClick={() => handleSelectPlan('premium_plus')}
                    >
                      Перейти к оплате
                    </button>
                  ) : (
                    <div className="dm-pricing-card__login-gate">
                      <h3 className="dm-pricing-card__login-gate-title">Для оплаты необходимо войти в аккаунт</h3>
                      <p className="dm-pricing-card__login-gate-subtitle">
                        Это нужно, чтобы мы могли активировать тариф, отслеживать срок действия и показывать статус оплаты в личном кабинете.
                      </p>
                      <div className="dm-pricing-card__login-gate-buttons">
                        <button
                          type="button"
                          className="dm-pricing-card__login-gate-btn dm-pricing-card__login-gate-btn--primary"
                          onClick={() => navigate('/auth/login')}
                        >
                          Войти
                        </button>
                        <button
                          type="button"
                          className="dm-pricing-card__login-gate-btn dm-pricing-card__login-gate-btn--secondary"
                          onClick={() => navigate('/auth/register')}
                        >
                          Создать аккаунт
                        </button>
                      </div>
                      <p className="dm-pricing-card__login-gate-hint">
                        Без авторизации оплата недоступна.
                      </p>
                    </div>
                  )}
                  <p className="dm-pricing-card__payment-hint">
                    {(pricingSettings?.payment_hint || 'Оплата через кошельки Таджикистана D City ● Эсхата ● Спитаменпей ● Васл ● Алиф - подтверждение вручную по скрину.')
                      .replace(
                        'Оплата через банки Таджикистана и кошелёк ЮMoney - подтверждение вручную по скрину.',
                        'Оплата через кошельки Таджикистана D City ● Эсхата ● Спитаменпей ● Васл ● Алиф - подтверждение вручную по скрину.'
                      )
                      .replace(
                        'Оплата через банки Таджикистана и кошелек ЮMoney - подтверждение вручную по скрину.',
                        'Оплата через кошельки Таджикистана D City ● Эсхата ● Спитаменпей ● Васл ● Алиф - подтверждение вручную по скрину.'
                      )}
                  </p>
                </div>
              );
            })()}
            </>
          )}
        </div>
        )}

        {/* Блок соцсетей */}
        <section className="dm-pricing-social">
          <h2 className="dm-pricing-social__title">{pricingSettings?.social_title || 'Станьте частью команды D Motion'}</h2>
          <p className="dm-pricing-social__text">
            {pricingSettings?.social_text || 'Все акции, бонусы и подарки публикуем только в наших соцсетях.'}
          </p>
          <div className="dm-pricing-social__icons">
            <a
              href={pricingSettings?.telegram_url || "https://t.me/dushanbemotion"}
              target="_blank"
              rel="noopener noreferrer"
              className="dm-pricing-social__icon"
              title="Telegram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="currentColor"/>
              </svg>
            </a>
            <a
              href={pricingSettings?.instagram_url || "https://www.instagram.com/dushanbemotion"}
              target="_blank"
              rel="noopener noreferrer"
              className="dm-pricing-social__icon"
              title="Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"/>
              </svg>
            </a>
            <a
              href={pricingSettings?.youtube_url || "https://www.youtube.com/@dushanbemotion"}
              target="_blank"
              rel="noopener noreferrer"
              className="dm-pricing-social__icon"
              title="YouTube"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="currentColor"/>
              </svg>
            </a>
          </div>
          <p className="dm-pricing-social__note">
            Подписчики - это команда проекта.
          </p>
        </section>

        {/* Как проходит оплата - показывается только если подписка НЕ активна */}
        {!isSubscriptionActive && (
          <section className="dm-pricing-howto">
            <h2 className="dm-pricing-howto__title">Как проходит оплата</h2>
            <div className="dm-pricing-howto__steps">
              <div className="dm-pricing-howto__step">
                <div className="dm-pricing-howto__step-number">1</div>
                <p className="dm-pricing-howto__step-text">
                  {pricingSettings?.step1_text || 'Выберите тариф PREMIUM или PREMIUM+ на этой странице.'}
                </p>
              </div>
              <div className="dm-pricing-howto__step">
                <div className="dm-pricing-howto__step-number">2</div>
                <p className="dm-pricing-howto__step-text">
                  {pricingSettings?.step2_text || 'На следующем шаге выберите кошелёк (D City / Эсхата / Спитаменпей / Васл / Алиф) и переведите сумму тарифа.'}
                </p>
              </div>
              <div className="dm-pricing-howto__step">
                <div className="dm-pricing-howto__step-number">3</div>
                <p className="dm-pricing-howto__step-text">
                  {pricingSettings?.step3_text || 'Загрузите скрин перевода - мы подтвердим оплату и включим доступ.'}
                </p>
              </div>
            </div>
            {user ? (
              <button
                type="button"
                className="dm-pricing-howto__btn"
                onClick={() => {
                  window.location.href = '/payment';
                }}
              >
                Перейти к оплате
              </button>
            ) : (
              <div className="dm-pricing-howto__login-gate">
                <h3 className="dm-pricing-howto__login-gate-title">Для оплаты необходимо войти в аккаунт</h3>
                <p className="dm-pricing-howto__login-gate-subtitle">
                  Это нужно, чтобы мы могли активировать тариф, отслеживать срок действия и показывать статус оплаты в личном кабинете.
                </p>
                <div className="dm-pricing-howto__login-gate-buttons">
                  <button
                    type="button"
                    className="dm-pricing-howto__login-gate-btn dm-pricing-howto__login-gate-btn--primary"
                    onClick={() => navigate('/auth/login')}
                  >
                    Войти
                  </button>
                  <button
                    type="button"
                    className="dm-pricing-howto__login-gate-btn dm-pricing-howto__login-gate-btn--secondary"
                    onClick={() => navigate('/auth/register')}
                  >
                    Создать аккаунт
                  </button>
                </div>
                <p className="dm-pricing-howto__login-gate-hint">
                  Без авторизации оплата недоступна.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Что происходит после оплаты - показывается только если подписка НЕ активна */}
        {!isSubscriptionActive && (
          <section className="dm-pricing-after-payment">
            <h2 className="dm-pricing-after-payment__title">Что происходит после оплаты</h2>
            <ul className="dm-pricing-after-payment__list">
              {(pricingSettings?.after_payment_items || [
                'Вы оплачиваете тариф и загружаете скрин перевода',
                'Мы вручную сверяем платёж с выпиской банка',
                'В течение 30 минут тариф активируется',
                'Статус появится в личном кабинете',
                'Вы получите уведомление в интерфейсе D Motion'
              ]).map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>
        )}

        {/* Важно (юридика, кратко) - показывается всегда */}
        <div className="dm-pricing-legal-compact">
          <p className="dm-pricing-legal-compact__text">
            {pricingSettings?.legal_text || 'Оплата подтверждается вручную. Возврат средств не производится. Сумма перевода должна быть точной.'}
          </p>
        </div>

        {/* Жёсткие финансовые правила - показывается только если подписка НЕ активна */}
        {!isSubscriptionActive && (
          <div className="dm-pricing-financial-warning">
            <div className="dm-pricing-financial-warning__icon"></div>
            <div className="dm-pricing-financial-warning__content">
              <h3 className="dm-pricing-financial-warning__title">Важные условия оплаты</h3>
              <ul className="dm-pricing-financial-warning__list">
                <li>Сумма перевода должна быть точной</li>
                <li>Если сумма меньше - тариф не активируется</li>
                <li>Возврат средств не производится</li>
                <li>Если сумма больше стоимости тарифа - разница считается добровольной поддержкой проекта</li>
                <li>Дополнительные средства не переносятся и не компенсируются</li>
              </ul>
            </div>
          </div>
        )}

        {/* Анти-фрод - показывается только если подписка НЕ активна */}
        {!isSubscriptionActive && (
          <section className="dm-pricing-antifraud">
            <h2 className="dm-pricing-antifraud__title">Защита от мошенничества</h2>
            <p className="dm-pricing-antifraud__text">
              {pricingSettings?.antifraud_text || 'Мы проверяем все платежи вручную. Сверяется сумма, время перевода, банк и получатель. Скрины, созданные с помощью ИИ или подделанные изображения, не принимаются. Любая попытка обмана приведёт к пожизненной блокировке аккаунта.'}
            </p>
            <p className="dm-pricing-antifraud__subtext">
              Блокировка производится по аккаунту, устройству и внутреннему ID.
            </p>
          </section>
        )}

        {/* Юридическое предупреждение - показывается только если подписка НЕ активна */}
        {!isSubscriptionActive && (
          <div className="dm-pricing-legal-warning">
            <p className="dm-pricing-legal-warning__text">
              Мошеннические действия, связанные с банковскими переводами и подделкой платёжных документов, могут подпадать под ответственность в соответствии с законодательством Республики Таджикистан. Мы оставляем за собой право передавать информацию банкам и платёжным системам.
            </p>
          </div>
        )}

        {/* Нет нужного способа оплаты - показывается только если подписка НЕ активна */}
        {!isSubscriptionActive && (
          <section className="dm-pricing-alternative">
            <h2 className="dm-pricing-alternative__title">{pricingSettings?.alternative_title || 'Другой банк или другая страна?'}</h2>
            <p className="dm-pricing-alternative__text">
              {pricingSettings?.alternative_text || 'Если вы находитесь в другой стране или у вас нет подходящего способа оплаты - напишите нам в Telegram, мы найдём решение и подключим вас максимально быстро.'}
            </p>
            <a
              href={pricingSettings?.telegram_url || "https://t.me/dushanbemotion"}
              target="_blank"
              rel="noopener noreferrer"
              className="dm-pricing-alternative__btn"
            >
              Написать в Telegram
            </a>
          </section>
        )}

        {/* Пригласи друга - показывается только если подписка НЕ активна */}
        {!isSubscriptionActive && (
          <section className="dm-pricing-referral">
            <h2 className="dm-pricing-referral__title">{pricingSettings?.referral_title || 'Пригласи друга - получи Premium'}</h2>
            <p className="dm-pricing-referral__text">
              {(pricingSettings?.referral_text || 'Пригласите 2 друга, которые оформят тариф PREMIUM. Вы получите 1 месяц Premium бесплатно.')
                .replace(
                  'Пригласите друга, который оформит',
                  'Пригласите 2 друга, которые оформят'
                )}
            </p>
            <p className="dm-pricing-referral__text dm-pricing-referral__text--highlight">
              {pricingSettings?.referral_bonus_text || 'Если вы пригласите 7 друзей, оформивших тариф PREMIUM - вы получите PREMIUM+ бесплатно.'}
            </p>
            <p className="dm-pricing-referral__hint">
              Все приглашения проверяются. Попытки обхода системы фиксируются.
            </p>
          </section>
        )}

        {/* Финальная подпись - показывается только если подписка НЕ активна */}
        {!isSubscriptionActive && (
          <p className="dm-pricing-footer">
            Оплата подтверждается вручную. Все действия фиксируются. Любые попытки обхода системы приводят к блокировке.
          </p>
        )}
      </div>
    </div>
  );
}

