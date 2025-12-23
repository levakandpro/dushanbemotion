import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../components/author-ui.css";
import "./AuthorHome.css";
import { getCurrentUser } from "../../services/userService";
import { getAuthorWorks, getWorksMetrics, getAuthorStats } from "../../services/workService";

import AuthorStatsBar from "../components/AuthorStatsBar";
import AuthorWorksGrid from "../components/AuthorWorksGrid";
import StatsDetailsPanel from "../components/StatsDetailsPanel";

const FALLBACK_IMG = "https://archive.org/download/collabs_20251214_0442/COLLABS.png";

export default function AuthorHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState([]);
  const [stats, setStats] = useState({ likesStars: 0, recommend: 0, orders: 0, balanceDmc: 0 });
  const [activeMetric, setActiveMetric] = useState("achievements");

  // Загружаем работы и метрики
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        if (!user) return;

        // Загружаем работы
        const authorWorks = await getAuthorWorks(user.id);
        const workIds = authorWorks.map(w => w.id);

        // Загружаем метрики
        let metricsMap = {};
        if (workIds.length > 0) {
          const metrics = await getWorksMetrics(workIds);
          metricsMap = metrics.reduce((acc, m) => {
            acc[m.work_id] = m;
            return acc;
          }, {});
        }

        // Объединяем работы с метриками
        const worksWithMetrics = authorWorks.map(work => {
          const metrics = metricsMap[work.id] || {
            views: 0,
            likes: 0,
            recommends: 0,
            stars: 0
          };

          // Форматируем дату
          const updatedAt = new Date(work.updated_at).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          return {
            id: work.id,
            title: work.title || "Работа без названия",
            meta: work.category || work.description || "Формат • Категория",
            cover: work.thumbnail_url || work.media_url || FALLBACK_IMG,
            status: work.status,
            stars: metrics.stars || 0,
            recommend: metrics.recommends || 0,
            views: metrics.views || 0,
            updatedAt,
            badge: work.status === "published" && work.published_at ? "" : "НОВОЕ"
          };
        });

        setWorks(worksWithMetrics);

        // Загружаем статистику
        const authorStats = await getAuthorStats(user.id);
        setStats(authorStats);
      } catch (error) {
        console.error("Error loading works:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Обработчик публикации/снятия
  const handleTogglePublish = async (workId, currentStatus) => {
    try {
      if (currentStatus === "draft") {
        await publishWork(workId);
      } else {
        await unpublishWork(workId);
      }
      // Перезагружаем данные
      const user = await getCurrentUser();
      if (user) {
        const authorWorks = await getAuthorWorks(user.id);
        const workIds = authorWorks.map(w => w.id);
        const metrics = workIds.length > 0 ? await getWorksMetrics(workIds) : [];
        const metricsMap = metrics.reduce((acc, m) => {
          acc[m.work_id] = m;
          return acc;
        }, {});

        const worksWithMetrics = authorWorks.map(work => {
          const m = metricsMap[work.id] || { views: 0, likes: 0, recommends: 0, stars: 0 };
          const updatedAt = new Date(work.updated_at).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          return {
            id: work.id,
            title: work.title || "Работа без названия",
            meta: work.category || work.description || "Формат • Категория",
            cover: work.thumbnail_url || work.media_url || FALLBACK_IMG,
            status: work.status,
            stars: m.stars || 0,
            recommend: m.recommends || 0,
            views: m.views || 0,
            updatedAt,
            badge: work.status === "published" && work.published_at ? "" : "НОВОЕ"
          };
        });
        setWorks(worksWithMetrics);
      }
    } catch (error) {
      console.error("Error toggling publish:", error);
      alert("Ошибка при изменении статуса работы");
    }
  };

  const hasAny = works.length > 0;

  // Toggle метрики (повторный клик закрывает)
  const handleMetricClick = (key) => {
    setActiveMetric(prev => prev === key ? null : key);
  };

  // Подготовка данных для панели (заглушки пока нет реальных данных)
  const achievements = {
    verified: stats.orders >= 10,
    fifty: stats.orders >= 50,
    master: stats.orders >= 100,
  };

  return (
    <div className="au-home">
      {/* Кликабельная статистика */}
      <AuthorStatsBar 
        stats={stats} 
        activeMetric={activeMetric}
        onMetricClick={handleMetricClick}
      />

      {/* Панель деталей - открывается по клику на метрику */}
      {activeMetric && (
        <StatsDetailsPanel
          activeTab={activeMetric}
          onClose={() => setActiveMetric(null)}
          works={works}
          recommendations={[]}
          deals={[]}
          transactions={[]}
          achievements={achievements}
          dealsCount={stats.orders || 0}
        />
      )}

      {/* Контент - только если есть работы */}
      {!loading && hasAny && (
        <div className="au-home__content">
          <div className="au-card au-card__in">
            <div className="au-home__headRow">
              <h2 className="au-home__h2">Мои работы</h2>
              <button 
                className="au-btn au-btn--ghost" 
                type="button"
                onClick={() => navigate('/author/works')}
              >
                Все работы
              </button>
            </div>
            <div className="au-sep" />
            <AuthorWorksGrid items={works.slice(0, 6)} onTogglePublish={handleTogglePublish} />
          </div>
        </div>
      )}
    </div>
  );
}
