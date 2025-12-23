// src/admin/screens/UsersScreen.jsx
import React, { useState, useEffect } from 'react';
import { fetchUsers } from '../api/adminApi';
import Loader from '../../components/ui/Loader';

export default function UsersScreen() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  // Поиск с debounce
  useEffect(() => {
    if (search.length >= 2 || search.length === 0) {
      const timer = setTimeout(() => loadUsers(), 300);
      return () => clearTimeout(timer);
    }
  }, [search]);

  async function loadUsers() {
    setLoading(true);
    try {
      const { users: data, total: count } = await fetchUsers({ limit: 200, search });
      setUsers(data);
      setTotal(count);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Определяем "новых" — зарегистрированы в последние 7 дней
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const filtered = users.filter(u => {
    if (filter === 'paid') return u.current_plan && u.current_plan !== 'free';
    if (filter === 'free') return !u.current_plan || u.current_plan === 'free';
    if (filter === 'authors') return u.is_author;
    if (filter === 'new') return u.created_at && new Date(u.created_at) > weekAgo;
    return true;
  });

  const fmt = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—';
  const getPlan = (u) => {
    if (u.is_lifetime) return 'Lifetime';
    if (u.current_plan === 'premium_plus') return 'Premium+';
    if (u.current_plan === 'premium') return 'Premium';
    return 'Free';
  };
  const isNew = (u) => u.created_at && new Date(u.created_at) > weekAgo;

  return (
    <div className="dm-users">
      {/* Фильтры */}
      <div className="dm-users__filters">
        {[
          { key: 'all', label: 'Все' },
          { key: 'new', label: '🆕 Новые' },
          { key: 'paid', label: 'Платные' },
          { key: 'free', label: 'Free' },
          { key: 'authors', label: 'Авторы' },
        ].map(f => (
          <button
            key={f.key}
            className={`dm-users__filter ${filter === f.key ? 'dm-users__filter--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <span className="dm-users__count">{filtered.length} из {total}</span>
      </div>

      {/* Поиск */}
      <div className="dm-users__search">
        <input
          type="text"
          placeholder="Поиск по имени (мин. 2 буквы)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button onClick={() => setSearch('')}>✕</button>}
      </div>

      {/* Таблица */}
      {loading ? (
        <Loader fullscreen={false} size="compact" />
      ) : (
        <div className="dm-users__table">
          <div className="dm-users__row dm-users__row--head">
            <div className="dm-users__cell">Пользователь</div>
            <div className="dm-users__cell">Тариф</div>
            <div className="dm-users__cell">Роль</div>
            <div className="dm-users__cell">Регистрация</div>
          </div>
          {filtered.length === 0 ? (
            <div className="dm-users__empty">
              {search ? 'Ничего не найдено' : 'Нет пользователей'}
            </div>
          ) : (
            filtered.map(u => (
              <div
                key={u.id}
                className={`dm-users__row ${selected?.id === u.id ? 'dm-users__row--selected' : ''} ${isNew(u) ? 'dm-users__row--new' : ''}`}
                onClick={() => setSelected(u)}
              >
                <div className="dm-users__cell">
                  <div className="dm-users__name-row">
                    <span className="dm-users__name">{u.display_name || u.username || '—'}</span>
                    {isNew(u) && <span className="dm-users__new-badge">NEW</span>}
                  </div>
                  <div className="dm-users__username">@{u.username || u.id.slice(0, 8)}</div>
                </div>
                <div className="dm-users__cell">
                  <span className={`dm-users__plan dm-users__plan--${u.current_plan || 'free'}`}>
                    {getPlan(u)}
                  </span>
                </div>
                <div className="dm-users__cell">
                  {u.is_author ? <span className="dm-users__badge">Автор</span> : '—'}
                </div>
                <div className="dm-users__cell">{fmt(u.created_at)}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Детали */}
      {selected && (
        <div className="dm-users__detail">
          <div className="dm-users__detail-title">
            {selected.display_name || selected.username || 'Пользователь'}
            {isNew(selected) && <span className="dm-users__new-badge" style={{marginLeft: 8}}>NEW</span>}
          </div>
          <div className="dm-users__detail-grid">
            <div><b>ID:</b> {selected.id}</div>
            <div><b>Username:</b> @{selected.username || '—'}</div>
            <div><b>Страна:</b> {selected.country || '—'}</div>
            <div><b>Тариф:</b> {getPlan(selected)}</div>
            <div><b>Тип аккаунта:</b> {selected.account_type || '—'}</div>
            <div><b>Автор:</b> {selected.is_author ? 'Да' : 'Нет'}</div>
            <div><b>Регистрация:</b> {fmt(selected.created_at)}</div>
            <div><b>Обновлён:</b> {fmt(selected.updated_at)}</div>
          </div>
          <button className="dm-users__close" onClick={() => setSelected(null)}>✕</button>
        </div>
      )}

      <style>{`
        .dm-users { max-width: 1000px; }
        .dm-users__filters {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .dm-users__filter {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid rgba(0,0,0,0.1);
          background: #fff;
          font-size: 13px;
          cursor: pointer;
        }
        .dm-users__filter--active {
          background: #007aff;
          color: #fff;
          border-color: #007aff;
        }
        .dm-users__count {
          margin-left: auto;
          font-size: 13px;
          color: #86868b;
        }
        
        .dm-users__search {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .dm-users__search input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          font-size: 14px;
        }
        .dm-users__search input:focus {
          outline: none;
          border-color: #007aff;
        }
        .dm-users__search button {
          padding: 10px 14px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
        }
        
        .dm-users__loading {
          padding: 40px;
          text-align: center;
          color: #86868b;
        }
        
        .dm-users__table {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dm-users__row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          cursor: pointer;
          transition: background 0.1s;
        }
        .dm-users__row:hover { background: #f9f9f9; }
        .dm-users__row--head {
          background: #f5f5f7;
          font-size: 11px;
          font-weight: 600;
          color: #86868b;
          text-transform: uppercase;
          cursor: default;
        }
        .dm-users__row--head:hover { background: #f5f5f7; }
        .dm-users__row--selected { background: #e8f4ff !important; }
        .dm-users__row--new {
          background: linear-gradient(90deg, rgba(52,199,89,0.1) 0%, transparent 50%);
        }
        .dm-users__cell { display: flex; align-items: center; }
        .dm-users__cell:first-child { flex-direction: column; align-items: flex-start; }
        .dm-users__name-row { display: flex; align-items: center; gap: 8px; }
        .dm-users__name { font-weight: 500; }
        .dm-users__username { font-size: 12px; color: #86868b; margin-top: 2px; }
        
        .dm-users__new-badge {
          display: inline-block;
          padding: 2px 6px;
          background: #34c759;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }
        
        .dm-users__plan {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }
        .dm-users__plan--free { background: #f5f5f7; color: #86868b; }
        .dm-users__plan--premium { background: #e8f5e9; color: #2e7d32; }
        .dm-users__plan--premium_plus { background: #fff3e0; color: #e65100; }
        .dm-users__badge {
          background: #007aff;
          color: #fff;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .dm-users__empty {
          padding: 40px;
          text-align: center;
          color: #86868b;
        }
        .dm-users__detail {
          margin-top: 16px;
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(0,0,0,0.06);
          position: relative;
        }
        .dm-users__detail-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
        }
        .dm-users__detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          font-size: 14px;
        }
        .dm-users__detail-grid b { color: #86868b; font-weight: 500; }
        .dm-users__close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #86868b;
        }
      `}</style>
    </div>
  );
}
