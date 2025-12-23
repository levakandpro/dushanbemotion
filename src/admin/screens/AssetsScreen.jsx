// src/admin/screens/AssetsScreen.jsx
import React, { useState, useEffect } from 'react';
import { fetchUserAssets } from '../api/adminApi';
import Loader from '../../components/ui/Loader';

export default function AssetsScreen() {
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAssets();
  }, [filter]);

  async function loadAssets() {
    setLoading(true);
    try {
      const result = await fetchUserAssets({ limit: 100, type: filter });
      setAssets(result.assets);
      setTotal(result.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const assetTypes = [
    { key: 'all', label: 'Все' },
    { key: 'font', label: 'Шрифты' },
    { key: 'sticker', label: 'Стикеры' },
    { key: 'background', label: 'Фоны' },
    { key: 'transition', label: 'Переходы' },
    { key: 'effect', label: 'Эффекты' },
  ];

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="dm-assets">
      <div className="dm-assets__header">
        <h2>Ассеты пользователей</h2>
        <span className="dm-assets__count">Всего: {total}</span>
      </div>

      <div className="dm-assets__filters">
        {assetTypes.map(t => (
          <button
            key={t.key}
            className={`dm-assets__filter ${filter === t.key ? 'is-active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {assets.length === 0 ? (
        <div className="dm-assets__empty">
          <div className="dm-assets__empty-icon">📁</div>
          <div className="dm-assets__empty-text">Ассеты не найдены</div>
        </div>
      ) : (
        <div className="dm-assets__table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Тип</th>
                <th>Название</th>
                <th>Пользователь</th>
                <th>Создан</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id}>
                  <td className="dm-assets__id">{asset.id?.slice(0, 8)}...</td>
                  <td>
                    <span className={`dm-assets__type dm-assets__type--${asset.asset_type}`}>
                      {asset.asset_type || '—'}
                    </span>
                  </td>
                  <td>{asset.name || asset.file_name || '—'}</td>
                  <td className="dm-assets__user">{asset.user_id?.slice(0, 8)}...</td>
                  <td>{asset.created_at ? new Date(asset.created_at).toLocaleDateString('ru-RU') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .dm-assets { max-width: 1000px; }
        .dm-assets__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .dm-assets__header h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        .dm-assets__count {
          font-size: 14px;
          color: #86868b;
        }
        .dm-assets__filters {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .dm-assets__filter {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.1);
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .dm-assets__filter:hover {
          background: #f5f5f7;
        }
        .dm-assets__filter.is-active {
          background: #007aff;
          color: #fff;
          border-color: #007aff;
        }
        .dm-assets__empty {
          padding: 60px 20px;
          text-align: center;
          background: #fff;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dm-assets__empty-icon { font-size: 48px; margin-bottom: 12px; }
        .dm-assets__empty-text { color: #86868b; font-size: 14px; }
        .dm-assets__table {
          background: #fff;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .dm-assets__table table {
          width: 100%;
          border-collapse: collapse;
        }
        .dm-assets__table th,
        .dm-assets__table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .dm-assets__table th {
          font-size: 12px;
          font-weight: 600;
          color: #86868b;
          text-transform: uppercase;
          background: #f9f9f9;
        }
        .dm-assets__table td {
          font-size: 14px;
        }
        .dm-assets__table tr:last-child td {
          border-bottom: none;
        }
        .dm-assets__id,
        .dm-assets__user {
          font-family: monospace;
          font-size: 12px;
          color: #86868b;
        }
        .dm-assets__type {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .dm-assets__type--font { background: #e8f5e9; color: #2e7d32; }
        .dm-assets__type--sticker { background: #fff3e0; color: #ef6c00; }
        .dm-assets__type--background { background: #e3f2fd; color: #1565c0; }
        .dm-assets__type--transition { background: #f3e5f5; color: #7b1fa2; }
        .dm-assets__type--effect { background: #fce4ec; color: #c2185b; }
      `}</style>
    </div>
  );
}
