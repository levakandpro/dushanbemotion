// src/admin/screens/ProjectsScreen.jsx
import React, { useState, useEffect } from 'react';
import { fetchProjects } from '../api/adminApi';
import Loader from '../../components/ui/Loader';

export default function ProjectsScreen() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const { projects: data, total: count } = await fetchProjects({ limit: 100 });
      setProjects(data);
      setTotal(count);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '—';

  if (loading) return <Loader />;

  return (
    <div className="dm-projects">
      <div className="dm-projects__header">
        <span className="dm-projects__count">Всего: {total}</span>
        <button onClick={loadProjects} className="dm-projects__refresh">↻ Обновить</button>
      </div>

      <div className="dm-projects__table">
        <div className="dm-projects__row dm-projects__row--head">
          <div className="dm-projects__cell">Название</div>
          <div className="dm-projects__cell">Создан</div>
          <div className="dm-projects__cell">Обновлён</div>
        </div>
        {projects.length === 0 ? (
          <div className="dm-projects__empty">Нет проектов</div>
        ) : (
          projects.map(p => (
            <div key={p.id} className="dm-projects__row">
              <div className="dm-projects__cell">
                <div className="dm-projects__title">{p.title || 'Без названия'}</div>
                <div className="dm-projects__id">{p.id.slice(0, 8)}...</div>
              </div>
              <div className="dm-projects__cell">{fmt(p.created_at)}</div>
              <div className="dm-projects__cell">{fmt(p.updated_at)}</div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .dm-projects { max-width: 900px; }
        .dm-projects__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .dm-projects__count { font-size: 14px; color: #86868b; }
        .dm-projects__refresh {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.1);
          background: #fff;
          font-size: 13px;
          cursor: pointer;
        }
        .dm-projects__table {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dm-projects__row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .dm-projects__row--head {
          background: #f5f5f7;
          font-size: 11px;
          font-weight: 600;
          color: #86868b;
          text-transform: uppercase;
        }
        .dm-projects__cell { display: flex; flex-direction: column; justify-content: center; }
        .dm-projects__title { font-weight: 500; }
        .dm-projects__id { font-size: 11px; color: #86868b; margin-top: 2px; }
        .dm-projects__empty { padding: 40px; text-align: center; color: #86868b; }
      `}</style>
    </div>
  );
}
