import React, { useState, useEffect, useRef } from "react";
import { getCurrentUser } from "../../services/userService";
import { getCollectionsWithCounts, getOrCreateDefaultCollection, createCollection, publishCollectionToBazar } from "../../services/collectionService";
import Loader from "../../components/ui/Loader";
import "./AddWorkModal.css";

const DEFAULT_COLLECTION_TITLE = "D COLLECTION";
const MAX_FREE_COLLECTIONS = 5;
const PUBLISH_COOLDOWN_HOURS = 24;

export default function AddWorkModal({ isOpen, onClose, onSelectCollection }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [error, setError] = useState(null);
  const [lastPublishTime, setLastPublishTime] = useState(null);
  const userIdRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await getCurrentUser();
      if (!user) return;
      
      userIdRef.current = user.id;

      // Убедимся что D COLLECTION существует
      await getOrCreateDefaultCollection();

      const userCollections = await getCollectionsWithCounts(user.id);
      
      // Сортируем: D COLLECTION первой
      const sorted = userCollections.sort((a, b) => {
        if (a.title === DEFAULT_COLLECTION_TITLE) return -1;
        if (b.title === DEFAULT_COLLECTION_TITLE) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setCollections(sorted);

      // Проверяем время последней публикации
      const publishedCollections = sorted.filter(c => c.is_public && c.published_at);
      if (publishedCollections.length > 0) {
        const lastPublished = publishedCollections.reduce((latest, c) => {
          const pubTime = new Date(c.published_at);
          return pubTime > latest ? pubTime : latest;
        }, new Date(0));
        setLastPublishTime(lastPublished);
      }
    } catch (err) {
      console.error("Error loading collections:", err);
      setError("Ошибка загрузки коллекций");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !userIdRef.current) return;

    try {
      setCreating(true);
      setError(null);

      const newCollection = await createCollection(userIdRef.current, newCollectionName.trim());
      
      // Добавляем в список после D COLLECTION
      setCollections(prev => {
        const defaultCol = prev.find(c => c.title === DEFAULT_COLLECTION_TITLE);
        const others = prev.filter(c => c.title !== DEFAULT_COLLECTION_TITLE);
        return defaultCol 
          ? [defaultCol, { ...newCollection, items_count: 0 }, ...others]
          : [{ ...newCollection, items_count: 0 }, ...others];
      });

      setNewCollectionName("");
      setShowCreateInput(false);
    } catch (err) {
      console.error("Error creating collection:", err);
      setError("Ошибка создания коллекции");
    } finally {
      setCreating(false);
    }
  };

  const canPublishToday = () => {
    if (!lastPublishTime) return true;
    const hoursSinceLastPublish = (Date.now() - lastPublishTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastPublish >= PUBLISH_COOLDOWN_HOURS;
  };

  const getTimeUntilNextPublish = () => {
    if (!lastPublishTime) return null;
    const hoursSinceLastPublish = (Date.now() - lastPublishTime.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = Math.ceil(PUBLISH_COOLDOWN_HOURS - hoursSinceLastPublish);
    return hoursRemaining > 0 ? hoursRemaining : 0;
  };

  const [publishing, setPublishing] = useState(false);

  const handleSelectCollection = async (collection) => {
    // Проверяем лимит публикаций
    const publishedCount = collections.filter(c => c.is_public).length;

    if (publishedCount >= MAX_FREE_COLLECTIONS && !collection.is_public) {
      setError(`Для публикации более ${MAX_FREE_COLLECTIONS} коллекций оформите PRO для авторов`);
      return;
    }

    if (!canPublishToday() && !collection.is_public) {
      const hoursLeft = getTimeUntilNextPublish();
      setError(`Вы уже отправляли коллекцию сегодня. Попробуйте через ${hoursLeft} ч.`);
      return;
    }

    try {
      setPublishing(true);
      setError(null);

      // Если коллекция ещё не опубликована - публикуем в BAZAR
      if (!collection.is_public) {
        await publishCollectionToBazar(collection.id);
        collection.is_public = true;
        collection.published_at = new Date().toISOString();
      }

      onSelectCollection(collection);
      onClose();
    } catch (err) {
      console.error("Error publishing collection:", err);
      setError("Ошибка публикации коллекции");
    } finally {
      setPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="awm-overlay" onClick={onClose}>
      <div className="awm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="awm-close" onClick={onClose}>✕</button>

        <h2 className="awm-title">Добавить работу в коллекцию</h2>
        <p className="awm-subtitle">Выберите коллекцию для публикации в BAZAR</p>

        {error && (
          <div className="awm-error">
            {error}
          </div>
        )}

        {!canPublishToday() && (
          <div className="awm-warning">
            ⏰ Следующая публикация доступна через {getTimeUntilNextPublish()} ч.
          </div>
        )}

        <div className="awm-list">
          {loading ? (
            <Loader fullscreen={false} size="minimal" showText={false} />
          ) : (
            <>
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className={`awm-item ${collection.title === DEFAULT_COLLECTION_TITLE ? 'awm-item--default' : ''}`}
                  onClick={() => handleSelectCollection(collection)}
                >
                  <div className="awm-item-info">
                    <span className="awm-item-title">
                      {collection.title}
                      {collection.title === DEFAULT_COLLECTION_TITLE && (
                        <span className="awm-item-badge">По умолчанию</span>
                      )}
                    </span>
                    <span className="awm-item-count">
                      {collection.items_count || 0} работ
                    </span>
                  </div>
                  <div className="awm-item-status">
                    {collection.is_public ? (
                      <span className="awm-status awm-status--public">В BAZAR</span>
                    ) : (
                      <span className="awm-status awm-status--draft">Черновик</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Кнопка создания новой коллекции */}
              {showCreateInput ? (
                <div className="awm-create-form">
                  <input
                    type="text"
                    className="awm-create-input"
                    placeholder="Название коллекции"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateCollection();
                      if (e.key === 'Escape') {
                        setShowCreateInput(false);
                        setNewCollectionName("");
                      }
                    }}
                    autoFocus
                  />
                  <button
                    className="awm-create-btn"
                    onClick={handleCreateCollection}
                    disabled={creating || !newCollectionName.trim()}
                  >
                    {creating ? '...' : 'Создать'}
                  </button>
                  <button
                    className="awm-cancel-btn"
                    onClick={() => {
                      setShowCreateInput(false);
                      setNewCollectionName("");
                    }}
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  className="awm-add-collection"
                  onClick={() => setShowCreateInput(true)}
                >
                  + Создать коллекцию
                </button>
              )}
            </>
          )}
        </div>

        <div className="awm-footer">
          <div className="awm-limits">
            <span>📦 {collections.filter(c => c.is_public).length} / {MAX_FREE_COLLECTIONS} коллекций в BAZAR</span>
            {collections.filter(c => c.is_public).length >= MAX_FREE_COLLECTIONS && (
              <span className="awm-pro-hint">Нужен PRO для авторов</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
