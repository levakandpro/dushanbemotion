// src/admin/screens/DictionariesScreen.jsx
import React from 'react';

export default function DictionariesScreen() {
  const countries = [
    { code: 'TJ', name: 'Таджикистан' },
    { code: 'UZ', name: 'Узбекистан' },
    { code: 'RU', name: 'Россия' },
    { code: 'KZ', name: 'Казахстан' },
    { code: 'KG', name: 'Кыргызстан' },
  ];

  const languages = [
    { code: 'ru', name: 'Русский', default: true },
    { code: 'en', name: 'English' },
    { code: 'tj', name: 'Тоҷикӣ' },
  ];

  const categories = ['Интро', 'Соцсети', 'Клипы', 'Бизнес', 'Другое'];

  return (
    <div className="dm-dict">
      <div className="dm-dict__section">
        <div className="dm-dict__title">🌍 Страны</div>
        <div className="dm-dict__list">
          {countries.map(c => (
            <div key={c.code} className="dm-dict__item">
              <span className="dm-dict__code">{c.code}</span>
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dm-dict__section">
        <div className="dm-dict__title">🗣 Языки</div>
        <div className="dm-dict__list">
          {languages.map(l => (
            <div key={l.code} className="dm-dict__item">
              <span className="dm-dict__code">{l.code}</span>
              <span>{l.name}</span>
              {l.default && <span className="dm-dict__badge">По умолчанию</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="dm-dict__section">
        <div className="dm-dict__title">📁 Категории</div>
        <div className="dm-dict__tags">
          {categories.map(c => (
            <span key={c} className="dm-dict__tag">{c}</span>
          ))}
        </div>
      </div>

      <style>{`
        .dm-dict { max-width: 600px; }
        .dm-dict__section {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dm-dict__title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .dm-dict__list { display: flex; flex-direction: column; gap: 8px; }
        .dm-dict__item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .dm-dict__item:last-child { border-bottom: none; }
        .dm-dict__code {
          background: #f5f5f7;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          font-family: monospace;
        }
        .dm-dict__badge {
          margin-left: auto;
          font-size: 11px;
          color: #007aff;
          background: #e8f4ff;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .dm-dict__tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .dm-dict__tag {
          padding: 8px 16px;
          background: #f5f5f7;
          border-radius: 20px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
