// src/components/SafeDeal/OrderModal.jsx
import React, { useState, useEffect } from 'react';
import { createOrder, getServiceForOrder } from '../../services/safeDealService';
import { useAuth } from '../../lib/useAuth';
import { useNavigate } from 'react-router-dom';
import Loader from '../ui/Loader';
import './OrderModal.css';

export default function OrderModal({ serviceId, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadService();
  }, [serviceId]);

  async function loadService() {
    setLoading(true);
    const data = await getServiceForOrder(serviceId);
    setService(data);
    setLoading(false);
  }

  async function handleOrder() {
    if (!agreed || creating) return;
    setCreating(true);

    try {
      const order = await createOrder(
        serviceId,
        user.id,
        service.author_id,
        service.price,
        message
      );
      
      setStep(3);
      
      setTimeout(() => {
        navigate(`/order/${order.id}`);
        onClose();
      }, 2000);
    } catch (err) {
      alert('Ошибка создания заказа: ' + err.message);
      setCreating(false);
    }
  }

  const fmtMoney = (n) => `${(n || 0).toLocaleString('ru-RU')} с`;
  const platformFee = service?.price ? Math.round(service.price * 0.20 * 100) / 100 : 0; // 20% комиссия
  const authorEarnings = service?.price ? service.price - platformFee : 0;

  if (loading) {
    return (
      <div className="order-modal__overlay" onClick={onClose}>
        <div className="order-modal" onClick={e => e.stopPropagation()}>
          <Loader fullscreen={false} size="minimal" showText={false} />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="order-modal__overlay" onClick={onClose}>
        <div className="order-modal" onClick={e => e.stopPropagation()}>
          <div className="order-modal__error">
            <p>Услуга не найдена</p>
            <button onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-modal__overlay" onClick={onClose}>
      <div className="order-modal" onClick={e => e.stopPropagation()}>
        <button className="order-modal__close" onClick={onClose}>✕</button>

        {step === 1 && (
          <>
            <div className="order-modal__header">
              <h2>Заказать услугу</h2>
              <p>Safe Deal — безопасная сделка</p>
            </div>

            <div className="order-modal__service">
              {service.cover_url && (
                <img src={service.cover_url} alt="" />
              )}
              <div>
                <h3>{service.title}</h3>
                <div className="order-modal__author">
                  {service.author?.avatar_url && (
                    <img src={service.author.avatar_url} alt="" />
                  )}
                  <span>{service.author?.display_name || service.author?.username}</span>
                </div>
              </div>
            </div>

            <div className="order-modal__price-card">
              <div className="order-modal__price-row">
                <span>Стоимость услуги</span>
                <strong>{fmtMoney(service.price)}</strong>
              </div>
              <div className="order-modal__price-row order-modal__price-row--small">
                <span>Комиссия платформы (20%)</span>
                <span>{fmtMoney(platformFee)}</span>
              </div>
              <div className="order-modal__price-row order-modal__price-row--small">
                <span>Автор получит</span>
                <span>{fmtMoney(authorEarnings)}</span>
              </div>
            </div>

            <div className="order-modal__message">
              <label>Сообщение автору (необязательно)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Опишите ваши требования, пожелания..."
                rows={3}
                maxLength={500}
              />
            </div>

            <button 
              className="order-modal__btn order-modal__btn--primary"
              onClick={() => setStep(2)}
            >
              Продолжить →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="order-modal__header">
              <h2>🔐 Safe Deal</h2>
              <p>Правила безопасной сделки</p>
            </div>

            <div className="order-modal__rules">
              <div className="order-modal__rule">
                <span className="order-modal__rule-icon">💰</span>
                <div>
                  <strong>Деньги у платформы</strong>
                  <p>Автор получит оплату только после того, как вы примете работу</p>
                </div>
              </div>
              <div className="order-modal__rule">
                <span className="order-modal__rule-icon">💬</span>
                <div>
                  <strong>Общение только в чате</strong>
                  <p>Вся переписка внутри заказа. Контакты запрещены</p>
                </div>
              </div>
              <div className="order-modal__rule">
                <span className="order-modal__rule-icon">⚖️</span>
                <div>
                  <strong>Защита при спорах</strong>
                  <p>Администратор рассмотрит ситуацию и примет решение</p>
                </div>
              </div>
              <div className="order-modal__rule order-modal__rule--warning">
                <span className="order-modal__rule-icon">⚠️</span>
                <div>
                  <strong>Запрещено</strong>
                  <p>Передача телефонов, email, мессенджеров, оплата вне платформы</p>
                </div>
              </div>
            </div>

            <label className="order-modal__agree">
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>Я понимаю и принимаю правила Safe Deal</span>
            </label>

            <div className="order-modal__actions">
              <button 
                className="order-modal__btn order-modal__btn--secondary"
                onClick={() => setStep(1)}
              >
                ← Назад
              </button>
              <button 
                className="order-modal__btn order-modal__btn--primary"
                onClick={handleOrder}
                disabled={!agreed || creating}
              >
                {creating ? 'Создание...' : `Заказать за ${fmtMoney(service.price)}`}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="order-modal__success">
            <div className="order-modal__success-icon">✅</div>
            <h2>Заказ создан!</h2>
            <p>Переходим к заказу...</p>
          </div>
        )}
      </div>
    </div>
  );
}

