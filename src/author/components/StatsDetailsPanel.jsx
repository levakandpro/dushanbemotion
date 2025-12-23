import React, { useEffect } from "react";
import "./author-ui.css";

import sadIcon from "../../editorV2/components/bazar/assets/prof/sad.png";
import verifIcon from "../../editorV2/components/bazar/assets/prof/verif.png";
import crownIcon from "../../editorV2/components/bazar/assets/prof/crown.png";
import defaultAvatar from "../../editorV2/components/bazar/assets/ii.png";

const PANEL_TITLES = {
  achievements: "Достижения",
  rating: "Оценка работ",
  recommend: "Рекомендации",
  deals: "История сделок",
  dcoin: "Движение D coin",
};

export default function StatsDetailsPanel({ 
  activeTab, 
  onClose, 
  works = [], 
  recommendations = [], 
  deals = [], 
  transactions = [],
  achievements = {},
  dealsCount = 0
}) {
  // Закрытие по ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!activeTab) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "rating":
        return <RatingContent works={works} />;
      case "recommend":
        return <RecommendContent recommendations={recommendations} />;
      case "deals":
        return <DealsContent deals={deals} />;
      case "dcoin":
        return <DcoinContent transactions={transactions} />;
      case "achievements":
        return <AchievementsContent achievements={achievements} dealsCount={dealsCount} />;
      default:
        return null;
    }
  };

  return (
    <div className="au-details-panel">
      <div className="au-details-panel__header">
        <h3 className="au-details-panel__title">{PANEL_TITLES[activeTab]}</h3>
        <button 
          type="button" 
          className="au-details-panel__close" 
          onClick={onClose}
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>
      <div className="au-details-panel__content">
        {renderContent()}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="au-details-empty">
      <img src={sadIcon} alt="" className="au-details-empty__icon" />
      <p>{text}</p>
    </div>
  );
}

function RatingContent({ works }) {
  if (!works.length) {
    return <EmptyState text="Пока нет оценённых работ" />;
  }

  const sorted = [...works].sort((a, b) => (b.stars || 0) - (a.stars || 0));

  return (
    <div className="au-details-list">
      {sorted.map((work) => (
        <div key={work.id} className="au-details-item">
          <div 
            className="au-details-item__cover" 
            style={{ backgroundImage: `url(${work.cover})` }}
          />
          <div className="au-details-item__info">
            <div className="au-details-item__title">{work.title}</div>
            <div className="au-details-item__meta">
              ⭐ {work.stars?.toFixed(1) || "0.0"} • {work.ratingsCount || 0} оценок
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendContent({ recommendations }) {
  if (!recommendations.length) {
    return <EmptyState text="Пока нет рекомендаций. Они появятся после завершённых сделок." />;
  }

  return (
    <div className="au-details-list">
      {recommendations.map((rec, i) => {
        const avatarUrl = rec.clientAvatar || defaultAvatar;
        const clientName = rec.clientName || "Пользователь";
        return (
          <div key={rec.id || i} className="au-details-item">
            <img 
              src={avatarUrl}
              alt=""
              className="au-details-item__avatar"
              onError={(e) => { e.target.src = defaultAvatar; }}
            />
            <div className="au-details-item__info">
              <div className="au-details-item__title">{clientName}</div>
              <div className="au-details-item__meta">
                {rec.date} • {rec.serviceName || rec.workName || "Услуга"}
              </div>
            </div>
            <span className="au-details-item__badge">🤝</span>
          </div>
        );
      })}
    </div>
  );
}

function DealsContent({ deals }) {
  if (!deals.length) {
    return <EmptyState text="Пока нет сделок" />;
  }

  const statusLabels = {
    pending: { text: "В процессе", class: "is-pending" },
    approved: { text: "Завершена", class: "is-approved" },
    canceled: { text: "Отменена", class: "is-canceled" },
  };

  return (
    <div className="au-details-list">
      {deals.map((deal, i) => {
        const status = statusLabels[deal.status] || statusLabels.pending;
        const avatarUrl = deal.clientAvatar || defaultAvatar;
        const clientName = deal.clientName || "Пользователь";
        return (
          <div key={deal.id || i} className="au-details-item">
            <img 
              src={avatarUrl}
              alt=""
              className="au-details-item__avatar"
              onError={(e) => { e.target.src = defaultAvatar; }}
            />
            <div className="au-details-item__info">
              <div className="au-details-item__title">{clientName}</div>
              <div className="au-details-item__meta">{deal.date}</div>
            </div>
            <div className="au-details-item__right">
              <span className={`au-details-status ${status.class}`}>{status.text}</span>
              <span className="au-details-amount">💎 {deal.amount || 0}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DcoinContent({ transactions }) {
  if (!transactions.length) {
    return <EmptyState text="Пока нет транзакций" />;
  }

  const typeLabels = {
    income: { text: "Доход", class: "is-income", sign: "+" },
    commission: { text: "Комиссия", class: "is-commission", sign: "-" },
    withdrawal: { text: "Вывод", class: "is-withdrawal", sign: "-" },
    bonus: { text: "Бонус", class: "is-bonus", sign: "+" },
  };

  return (
    <div className="au-details-list">
      {transactions.map((tx, i) => {
        const type = typeLabels[tx.type] || typeLabels.income;
        return (
          <div key={tx.id || i} className="au-details-item">
            <div className="au-details-item__info">
              <div className="au-details-item__title">{type.text}</div>
              <div className="au-details-item__meta">
                {tx.date} {tx.orderId && `• Заказ #${tx.orderId}`}
              </div>
            </div>
            <span className={`au-details-amount ${type.class}`}>
              {type.sign}{tx.amount || 0} 💎
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AchievementsContent({ achievements, dealsCount = 0 }) {
  const ACHIEVEMENTS_LIST = [
    {
      key: "verified",
      title: "Проверенный автор",
      description: "10 завершённых сделок",
      icon: verifIcon,
      reward: "Иконка возле ника по всей платформе",
      target: 10,
    },
    {
      key: "fifty",
      title: "Комиссия 25%",
      description: "50 завершённых сделок",
      icon: null,
      emoji: "🔻",
      reward: "Сниженная комиссия платформы",
      target: 50,
    },
    {
      key: "master",
      title: "Мастер D",
      description: "100 завершённых сделок",
      icon: crownIcon,
      reward: "Комиссия 10% на 1 год",
      target: 100,
    },
  ];

  return (
    <div className="au-achievements">
      {ACHIEVEMENTS_LIST.map((ach) => {
        const unlocked = achievements[ach.key];
        const progress = Math.min(dealsCount, ach.target);
        const percent = Math.round((progress / ach.target) * 100);
        
        return (
          <div 
            key={ach.key} 
            className={`au-achievement ${unlocked ? "is-unlocked" : "is-locked"}`}
          >
            <div className="au-achievement__icon">
              {ach.icon ? (
                <img src={ach.icon} alt="" />
              ) : (
                <span>{ach.emoji}</span>
              )}
            </div>
            <div className="au-achievement__info">
              <div className="au-achievement__title">{ach.title}</div>
              <div className="au-achievement__desc">{ach.description}</div>
              {!unlocked && (
                <div className="au-achievement__progress">
                  <div className="au-achievement__bar">
                    <div className="au-achievement__fill" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="au-achievement__count">{progress}/{ach.target}</span>
                </div>
              )}
              <div className="au-achievement__reward">{ach.reward}</div>
            </div>
            {unlocked && <span className="au-achievement__check">✓</span>}
          </div>
        );
      })}
    </div>
  );
}
