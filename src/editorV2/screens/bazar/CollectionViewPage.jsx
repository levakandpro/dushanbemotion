import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { getWorksByIds, getWorksMetrics } from "../../../services/workService";
import WorksGrid from "../../components/bazar/sections/WorksGrid";
import Loader from "../../../components/ui/Loader";
import "../../components/bazar/BazarUI.css";

const FALLBACK_IMG = "https://archive.org/download/collabs_20251214_0442/COLLABS.png";

export default function CollectionViewPage() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCollection = async () => {
      try {
        setLoading(true);

        // Загружаем коллекцию (без проверки is_public для отладки)
        const { data: collectionData, error: collectionError } = await supabase
          .from("collections")
          .select("*")
          .eq("id", collectionId)
          .single();

        if (collectionError || !collectionData) {
          console.error("Collection not found:", collectionError);
          navigate("/bazar");
          return;
        }

        setCollection(collectionData);

        // Загружаем все элементы коллекции напрямую
        const { data: items, error: itemsError } = await supabase
          .from("collection_items")
          .select("*")
          .eq("collection_id", collectionId);

        console.log("Collection items:", items);

        if (itemsError || !items || items.length === 0) {
          console.log("No items in collection");
          setWorks([]);
          return;
        }

        // Разделяем по типам
        const workIds = items.filter(i => i.asset_type === 'work').map(i => i.asset_id);
        const backgroundItems = items.filter(i => i.asset_type === 'background');

        const formattedWorks = [];

        // Загружаем работы из таблицы works
        if (workIds.length > 0) {
          const worksData = await getWorksByIds(workIds);
          const metrics = await getWorksMetrics(workIds).catch(() => []);
          const metricsMap = metrics.reduce((acc, m) => {
            acc[m.work_id] = m;
            return acc;
          }, {});

          for (const work of worksData) {
            const m = metricsMap[work.id] || {};
            formattedWorks.push({
              id: work.id,
              title: work.title || "Работа",
              meta: work.category || "",
              cover: work.thumbnail_url || work.media_url || FALLBACK_IMG,
              authorName: work.author_name || "Автор",
              stars: m.stars || 0,
              malades: m.recommends || 0,
            });
          }
        }

        // Добавляем фоны (они хранятся как URL в asset_id)
        for (const bg of backgroundItems) {
          const url = bg.asset_id;
          if (url && url.startsWith('http')) {
            formattedWorks.push({
              id: bg.id,
              title: "Фон",
              meta: "Background",
              cover: url,
              authorName: "Автор",
              stars: 0,
              malades: 0,
            });
          }
        }

        setWorks(formattedWorks);
      } catch (error) {
        console.error("Error loading collection:", error);
        setWorks([]);
      } finally {
        setLoading(false);
      }
    };

    if (collectionId) {
      loadCollection();
    }
  }, [collectionId, navigate]);

  if (loading) {
    return <Loader />;
  }

  if (!collection) {
    return (
      <div className="bz-page">
        <div style={{ padding: "40px", textAlign: "center", color: "rgba(230,237,234,.58)" }}>
          Коллекция не найдена
        </div>
      </div>
    );
  }

  return (
    <div className="bz-page">
      <div className="bz-wrap">
        <div style={{ padding: "40px 0 20px" }}>
          <button
            onClick={() => navigate("/bazar")}
            style={{
              background: "none",
              border: "none",
              color: "rgba(92, 255, 212, 0.8)",
              cursor: "pointer",
              fontSize: "14px",
              marginBottom: "16px",
              padding: "4px 0",
            }}
          >
            ← Назад в BAZAR
          </button>

          <div style={{ marginBottom: "8px" }}>
            <span
              style={{
                display: "inline-block",
                background: "rgba(92, 255, 212, 0.2)",
                border: "1px solid rgba(92, 255, 212, 0.4)",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "11px",
                color: "rgba(92, 255, 212, 0.9)",
                fontWeight: "500",
              }}
            >
              📁 КОЛЛЕКЦИЯ
            </span>
          </div>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "rgba(230, 237, 234, 1)",
              margin: "0 0 8px",
            }}
          >
            {collection.title || "Коллекция"}
          </h1>

          {collection.description && (
            <p
              style={{
                fontSize: "16px",
                color: "rgba(230, 237, 234, 0.7)",
                margin: "0 0 16px",
              }}
            >
              {collection.description}
            </p>
          )}

          <div
            style={{
              fontSize: "14px",
              color: "rgba(230, 237, 234, 0.6)",
            }}
          >
            {works.length} {works.length === 1 ? "работа" : "работ"}
          </div>
        </div>

        {works.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "rgba(230,237,234,.58)" }}>
            В коллекции пока нет работ
          </div>
        ) : (
          <WorksGrid items={works} />
        )}
      </div>
    </div>
  );
}
