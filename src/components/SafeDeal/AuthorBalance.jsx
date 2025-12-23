// src/components/SafeDeal/AuthorBalance.jsx
import React, { useState, useEffect } from 'react';
import { getAuthorBalance, getAuthorTransactions, getAuthorPayouts, requestPayout } from '../../services/safeDealService';
import { useAuth } from '../../lib/useAuth';
import Loader from '../ui/Loader';
import './AuthorBalance.css';

export default function AuthorBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayout, setShowPayout] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('card');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    
    const [balanceData, transData, payoutsData] = await Promise.all([
      getAuthorBalance(user.id),
      getAuthorTransactions(user.id),
      getAuthorPayouts(user.id)
    ]);
    
    setBalance(balanceData);
    setTransactions(transData);
    setPayouts(payoutsData);
    setLoading(false);
  }

  async function handleRequestPayout() {
    if (!balance || balance.available_balance <= 0 || requesting) return;
    
    if (!payoutDetails.trim()) {
      alert('Укажите реквизиты для выплаты');
      return;
    }

    setRequesting(true);
    try {
      await requestPayout(
        user.id,
        balance.available_balance,
        payoutMethod,
        { details: payoutDetails }
      );
      alert('Запрос на выплату отправлен! Ожидайте обработки.');
      setShowPayout(false);
      setPayoutDetails('');
      loadData();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      setRequesting(false);
    }
  }

  const fmtMoney = (n) => `${(n || 0).toLocaleString('ru-RU')} с`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const getPayoutStatusInfo = (status) => {
    const statuses = {
      pending: { label: 'Ожидает', color: '#ff9500' },
      processing: { label: 'Обрабатывается', color: '#007aff' },
      completed: { label: 'Выплачено', color: '#30d158' },
      failed: { label: 'Отклонено', color: '#ff3b30' }
    };
    return statuses[status] || { label: status, color: '#86868b' };
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="author-balance">
      <div className="author-balance__header">
        <h1>Мой баланс</h1>
        <p>Заработок от услуг Safe Deal</p>
      </div>

      {/* Карточки баланса */}
      <div className="author-balance__cards">
        <div className="author-balance__card author-balance__card--main">
          <span className="author-balance__card-label">Доступно к выводу</span>
          <span className="author-balance__card-value">{fmtMoney(balance?.available_balance)}</span>
          {balance?.available_balance > 0 && (
            <button 
              className="author-balance__payout-btn"
              onClick={() => setShowPayout(true)}
            >
              💸 Запросить выплату
            </button>
          )}
        </div>
        <div className="author-balance__card">
          <span className="author-balance__card-label">Всего заработано</span>
          <span className="author-balance__card-value author-balance__card-value--success">
            {fmtMoney(balance?.total_earned)}
          </span>
        </div>
        <div className="author-balance__card">
          <span className="author-balance__card-label">Выведено</span>
          <span className="author-balance__card-value">{fmtMoney(balance?.total_withdrawn)}</span>
        </div>
      </div>

      {/* Информация о выплатах */}
      <div className="author-balance__info">
        <span>📅</span>
        <div>
          <strong>Выплаты раз в месяц</strong>
          <p>Запросите выплату — администратор обработает её в течение нескольких дней</p>
        </div>
      </div>

      {/* История выплат */}
      {payouts.length > 0 && (
        <div className="author-balance__section">
          <h2>История выплат</h2>
          <div className="author-balance__payouts">
            {payouts.map(payout => {
              const statusInfo = getPayoutStatusInfo(payout.status);
              return (
                <div key={payout.id} className="author-balance__payout">
                  <div className="author-balance__payout-main">
                    <span className="author-balance__payout-amount">{fmtMoney(payout.amount)}</span>
                    <span 
                      className="author-balance__payout-status"
                      style={{ background: statusInfo.color }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="author-balance__payout-meta">
                    <span>{payout.payout_method === 'card' ? '💳 Карта' : '🏦 Банк'}</span>
                    <span>{fmtDate(payout.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* История транзакций */}
      {transactions.length > 0 && (
        <div className="author-balance__section">
          <h2>История операций</h2>
          <div className="author-balance__transactions">
            {transactions.map(tx => (
              <div key={tx.id} className="author-balance__tx">
                <div className="author-balance__tx-icon">
                  {tx.type === 'earning' ? '💰' : tx.type === 'payout' ? '💸' : '📝'}
                </div>
                <div className="author-balance__tx-info">
                  <span className="author-balance__tx-desc">{tx.description || 'Операция'}</span>
                  <span className="author-balance__tx-date">{fmtDate(tx.created_at)}</span>
                </div>
                <span className={`author-balance__tx-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                  {tx.amount > 0 ? '+' : ''}{fmtMoney(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {transactions.length === 0 && payouts.length === 0 && (
        <div className="author-balance__empty">
          <span>💼</span>
          <p>Пока нет операций</p>
          <small>Здесь будет отображаться история ваших заработков и выплат</small>
        </div>
      )}

      {/* Модалка запроса выплаты */}
      {showPayout && (
        <div className="author-balance__modal-overlay" onClick={() => setShowPayout(false)}>
          <div className="author-balance__modal" onClick={e => e.stopPropagation()}>
            <h3>Запрос выплаты</h3>
            
            <div className="author-balance__modal-amount">
              <span>Сумма к выводу</span>
              <strong>{fmtMoney(balance?.available_balance)}</strong>
            </div>

            <div className="author-balance__modal-field">
              <label>Способ получения</label>
              <div className="author-balance__modal-methods">
                <button 
                  className={payoutMethod === 'card' ? 'active' : ''}
                  onClick={() => setPayoutMethod('card')}
                >
                  💳 На карту
                </button>
                <button 
                  className={payoutMethod === 'bank' ? 'active' : ''}
                  onClick={() => setPayoutMethod('bank')}
                >
                  🏦 Банк. перевод
                </button>
              </div>
            </div>

            <div className="author-balance__modal-field">
              <label>
                {payoutMethod === 'card' ? 'Номер карты' : 'Реквизиты счёта'}
              </label>
              <textarea
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                placeholder={payoutMethod === 'card' ? '0000 0000 0000 0000' : 'ИНН, БИК, номер счёта...'}
                rows={3}
              />
            </div>

            <div className="author-balance__modal-warning">
              ⚠️ Проверьте реквизиты. Выплата обрабатывается в течение 1-3 рабочих дней.
            </div>

            <div className="author-balance__modal-actions">
              <button onClick={handleRequestPayout} disabled={requesting}>
                {requesting ? 'Отправка...' : 'Отправить запрос'}
              </button>
              <button onClick={() => setShowPayout(false)} className="secondary">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

