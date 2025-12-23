// src/admin/screens/TemplatesScreen.jsx
import React from 'react';

export default function TemplatesScreen() {
  return (
    <div className="dm-wip">
      <div className="dm-wip__icon">📋</div>
      <div className="dm-wip__title">Шаблоны</div>
      <div className="dm-wip__text">Управление шаблонами для редактора</div>
      <div className="dm-wip__badge">В разработке</div>

      <style>{`
        .dm-wip {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
        }
        .dm-wip__icon { font-size: 48px; margin-bottom: 16px; }
        .dm-wip__title { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        .dm-wip__text { font-size: 14px; color: #86868b; margin-bottom: 16px; }
        .dm-wip__badge {
          padding: 6px 16px;
          background: #f5f5f7;
          border-radius: 20px;
          font-size: 12px;
          color: #86868b;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
