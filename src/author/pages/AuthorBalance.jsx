import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/useAuth";
import { getAuthorPayoutBalance } from "../../services/safeDealService";
import Loader from "../../components/ui/Loader";
import "../components/author-ui.css";
import "./AuthorBalance.css";

export default function AuthorBalance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({
    pending_balance: 0,
    total_paid: 0,
    total_earned: 0,
    payouts_history: []
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAuthorPayoutBalance(user.id);
      setBalance(data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fmtMoney = (n) => `${(n || 0).toLocaleString('ru-RU')} с`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  
  // Форматирование периода
  const formatPeriod = (period) => {
    if (!period) return '';
    const [year, month] = period.split('-');
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="au-balance">
      <div className="au-pageHead">
        <div>
          <h1 className="au-pageTitle">Баланс</h1>
          <p className="au-pageSub">Ваши доходы и выплаты</p>
        </div>
      </div>

      {/* Карточки баланса — V1: без самовывода */}
      <div className="au-balance__cards">
        <div className="au-card au-card__in au-balance__card">
          <div className="au-balance__cardLabel">В ожидании</div>
          <div className="au-balance__cardValue au-balance__cardValue--warning">
            {fmtMoney(balance.pending_balance)}
          </div>
          <div className="au-balance__hint">
            Будет выплачено в конце месяца
          </div>
        </div>

        <div className="au-card au-card__in au-balance__card">
          <div className="au-balance__cardLabel">Выплачено</div>
          <div className="au-balance__cardValue au-balance__cardValue--success">
            {fmtMoney(balance.total_paid)}
          </div>
          <div className="au-balance__hint">Всего получено</div>
        </div>

        <div className="au-card au-card__in au-balance__card">
          <div className="au-balance__cardLabel">Всего заработано</div>
          <div className="au-balance__cardValue">
            {fmtMoney(balance.total_earned)}
          </div>
          <div className="au-balance__hint">За всё время</div>
        </div>
      </div>

      {/* История выплат по месяцам */}
      <div className="au-card au-card__in">
        <div className="au-balance__header">
          <div>
            <div className="au-badge">История</div>
            <h3 className="au-balance__sectionTitle">Выплаты по месяцам</h3>
          </div>
        </div>

        <div className="au-sep" />

        {balance.payouts_history.length === 0 ? (
          <div className="au-balance__empty">
            <p>Пока нет выплат</p>
            <span>Выплаты производятся в конце каждого месяца</span>
          </div>
        ) : (
          <div className="au-balance__payouts-list">
            {balance.payouts_history.map((payout, idx) => (
              <div key={idx} className="au-balance__payout-card">
                <div className="au-balance__payout-info">
                  <span className="au-balance__payout-period">{formatPeriod(payout.period)}</span>
                  <span className="au-balance__payout-date">{fmtDate(payout.paid_at)}</span>
                </div>
                <span className="au-balance__payout-amount au-balance__payout-amount--success">
                  +{fmtMoney(payout.author_earnings)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="au-card au-card__in au-balance__info">
        <div className="au-badge">Информация</div>
        <h3 className="au-balance__infoTitle">Как работают выплаты</h3>
        
        <div className="au-balance__infoList">
          <div className="au-balance__infoItem">
            <span className="au-balance__infoIcon" aria-hidden="true">
              <svg className="au-balance__infoIconSvg" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M4.5 7.5h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M6.5 5.5h11c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-11c-1.1 0-2-.9-2-2v-12c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M8 11h3M8 15h3M13 11h3M13 15h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Выплаты производятся 1 раз в месяц</span>
          </div>
          <div className="au-balance__infoItem">
            <span className="au-balance__infoIcon" aria-hidden="true">
              <svg className="au-balance__infoIconSvg" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M4 19h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M7.5 15.5V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M12 15.5V8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M16.5 15.5V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Комиссия платформы - 30% с каждой сделки</span>
          </div>
          <div className="au-balance__infoItem">
            <span className="au-balance__infoIcon" aria-hidden="true">
              <svg className="au-balance__infoIconSvg" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 7.5h15c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2h-15c-1.1 0-2-.9-2-2v-7c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M2.5 11h19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M6.5 15.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Выплаты на TJ-кошельки (Alif, DC, Spitamen)</span>
          </div>
          <div className="au-balance__infoItem">
            <span className="au-balance__infoIcon" aria-hidden="true">
              <svg className="au-balance__infoIconSvg" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 10V8.2C7.5 5.6 9.5 3.5 12 3.5C14.5 3.5 16.5 5.6 16.5 8.2V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M7 10h10c1.1 0 2 .9 2 2v6.5c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V12c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M12 14.2v2.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Safe Deal защищает обе стороны сделки</span>
          </div>
        </div>
      </div>
    </div>
  );
}
