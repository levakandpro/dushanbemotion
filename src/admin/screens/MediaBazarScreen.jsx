// src/admin/screens/MediaBazarScreen.jsx
import React, { useState, useEffect } from 'react';
import { fetchBazarPosts } from '../api/adminApi';
import Loader from '../../components/ui/Loader';

export default function MediaBazarScreen() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const { posts: data, total: count } = await fetchBazarPosts({ limit: 100 });
      setPosts(data);
      setTotal(count);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // bazar_works содержит только опубликованные работы, фильтрация по category
  const filtered = posts;

  const fmt = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—';

  if (loading) return <Loader />;

  return (
    <div className="dm-bazar">
      <div className="dm-bazar__header">
        <h2 className="dm-bazar__title-main">Media Bazar — публикации</h2>
        <span className="dm-bazar__count">{filtered.length} публикаций</span>
      </div>

      <div className="dm-bazar__grid">
        {filtered.length === 0 ? (
          <div className="dm-bazar__empty">Нет публикаций</div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="dm-bazar__card">
              {(p.thumbnail_url || p.media_url) && (
                <div className="dm-bazar__thumb" style={{ backgroundImage: `url(${p.thumbnail_url || p.media_url})` }} />
              )}
              <div className="dm-bazar__info">
                <div className="dm-bazar__title">{p.title || 'Без названия'}</div>
                <div className="dm-bazar__meta">
                  <span className="dm-bazar__category">{p.category || '—'}</span>
                  <span>{fmt(p.published_at || p.created_at)}</span>
                </div>
                <div className="dm-bazar__stats">
                  👁 {p.views || 0} · ⭐ {p.stars || 0} · 👍 {p.recommends || 0}
                </div>
                {p.author_name && (
                  <div className="dm-bazar__author">Автор: {p.author_name}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .dm-bazar { max-width: 1000px; }
        .dm-bazar__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .dm-bazar__title-main {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        .dm-bazar__count { font-size: 13px; color: #86868b; }
        .dm-bazar__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .dm-bazar__card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.06);
          transition: all 0.15s;
        }
        .dm-bazar__card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .dm-bazar__thumb {
          height: 140px;
          background-size: cover;
          background-position: center;
          background-color: #f5f5f7;
        }
        .dm-bazar__info { padding: 12px; }
        .dm-bazar__title { font-weight: 600; margin-bottom: 8px; font-size: 14px; }
        .dm-bazar__meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #86868b;
          margin-bottom: 6px;
        }
        .dm-bazar__category {
          background: #f5f5f7;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        .dm-bazar__stats { font-size: 12px; color: #86868b; }
        .dm-bazar__author { 
          font-size: 11px; 
          color: #86868b; 
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid rgba(0,0,0,0.04);
        }
        .dm-bazar__empty {
          grid-column: 1 / -1;
          padding: 60px 20px;
          text-align: center;
          color: #86868b;
          background: #fff;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.06);
        }
      `}</style>
    </div>
  );
}
