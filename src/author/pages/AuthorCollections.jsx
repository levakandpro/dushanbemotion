import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getMyCollections, getCollectionWorkIds, getOrCreateDefaultCollection, getCollectionsWithCounts, renameCollection, deleteCollection, getCollectionItems, toggleCollectionPublic, removeItemFromCollection, removeItemsFromCollection, clearCollection, updateCollectionCoverItem, toggleCollectionCoverBW, addItemToCollection, makeAllCollectionsPublic, toggleCollectionPinned, getPinnedCollectionsCount } from "../../services/collectionService";
import { getWorksByIds, getWorksMetrics, updateWork } from "../../services/workService";
import { getCurrentUser } from "../../services/userService";
import CollectionCard from "../../editorV2/components/bazar/cards/CollectionCard";
import AuthorWorkCard from "../components/AuthorWorkCard";
import { getCategoryName, getDefaultWorkTitle } from "../../utils/categoryTranslations";
import Loader from "../../components/ui/Loader";
import logoSvg from "../../assets/icons/logofiol.svg";
import "./AuthorCollections.css";

const DEFAULT_COLLECTION_TITLE = "D COLLECTION";

export default function AuthorCollections() {
  const location = useLocation();
  const navigate = useNavigate();
  const suppressAutoSelectRef = useRef(false);
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [worksLoading, setWorksLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingWorkId, setEditingWorkId] = useState(null);
  const [editingWorkTitle, setEditingWorkTitle] = useState("");
  const [previewWork, setPreviewWork] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [selectedWorks, setSelectedWorks] = useState(new Set());
  const [actionHistory, setActionHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [liveStatus, setLiveStatus] = useState(null);
  const [inlineFeedback, setInlineFeedback] = useState(null);
  const [moveModalWork, setMoveModalWork] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    if (location?.state?.reset) {
      suppressAutoSelectRef.current = true;
      setSelectedCollectionId(null);
      setSelectedWorks(new Set());

      // Возвращаемся к списку коллекций без автозагрузки работ
      setWorks([]);

      // Сбрасываем state, чтобы reset не "залипал" при навигации
      navigate(location.pathname, { replace: true });
    }
  }, [location?.state?.reset, navigate, location.pathname]);

  // Empty-state компонент
  const EmptyCollectionState = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 20px',
      textAlign: 'center'
    }}>
      <img src={logoSvg} alt="" style={{ width: '64px', height: '64px', opacity: 0.6, marginBottom: '24px' }} />
      <p style={{ 
        fontSize: '16px', 
        color: 'rgba(255, 255, 255, 0.7)', 
        maxWidth: '400px',
        lineHeight: '1.6'
      }}>
        Вернитесь в редактор и выберите изображения из библиотеки D MOTION
      </p>
    </div>
  );

  const loadCollections = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;

      await getOrCreateDefaultCollection();
      
      // Делаем все коллекции публичными (для отображения в ленте BAZAR)
      await makeAllCollectionsPublic(user.id);
      
      const userCollections = await getCollectionsWithCounts(user.id);
      const sorted = userCollections.sort((a, b) => {
        if (a.title === DEFAULT_COLLECTION_TITLE) return -1;
        if (b.title === DEFAULT_COLLECTION_TITLE) return 1;
        return 0;
      });
      setCollections(sorted);

      if (!selectedCollectionId && sorted.length > 0 && !suppressAutoSelectRef.current) {
        const defaultCollection = sorted.find(
          (col) => col.title === DEFAULT_COLLECTION_TITLE
        );

        if (defaultCollection) {
          setSelectedCollectionId(defaultCollection.id);
        } else {
          setSelectedCollectionId(sorted[0].id);
        }
      } else if (suppressAutoSelectRef.current) {
        suppressAutoSelectRef.current = false;
      }
    } catch (error) {
      console.error("Error loading collections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  // Загружаем элементы выбранной коллекции
  useEffect(() => {
    const loadCollectionWorks = async () => {
      if (!selectedCollectionId) {
        setWorks([]);
        return;
      }

      try {
        setWorksLoading(true);
        const items = await getCollectionItems(selectedCollectionId);
        console.log('AuthorCollections: items from collection', selectedCollectionId, ':', items);
        
        if (items.length === 0) {
          console.log('AuthorCollections: No items found in collection');
          setWorks([]);
          return;
        }

        const FALLBACK_IMG = "https://archive.org/download/collabs_20251214_0442/COLLABS.png";
        
        // Разделяем на works и backgrounds
        const workItems = items.filter(item => item.asset_type === 'work');
        const backgroundItems = items.filter(item => item.asset_type === 'background');
        
        console.log('AuthorCollections: workItems:', workItems.length, 'backgroundItems:', backgroundItems.length);
        
        let allDisplayItems = [];
        
        // Загружаем works из БД
        if (workItems.length > 0) {
          // Фильтруем только валидные UUID (отсеиваем URL и другие не-UUID значения)
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const workIds = workItems
            .map(item => item.asset_id)
            .filter(id => id && uuidPattern.test(id));
          
          if (workIds.length === 0) {
            console.log('AuthorCollections: No valid UUID work IDs found, skipping works load');
          } else {
            try {
              const worksData = await getWorksByIds(workIds);
              const metrics = await getWorksMetrics(workIds);
              const metricsMap = metrics.reduce((acc, m) => {
                acc[m.work_id] = m;
                return acc;
              }, {});

              const worksWithMetrics = worksData.map((work, index) => {
                const m = metricsMap[work.id] || {
                  views: 0,
                  likes: 0,
                  recommends: 0,
                  stars: 0,
                };
                // Название: если пусто - D {Категория}
                const displayTitle = work.title || getDefaultWorkTitle(work.category);
                // Категория на русском
                const categoryRu = getCategoryName(work.category);
                
              return {
                id: work.id,
                assetId: work.id, // UUID для works
                assetType: 'work',
                title: displayTitle,
                meta: categoryRu,
                cover: work.thumbnail_url || work.media_url || FALLBACK_IMG,
                status: work.status,
                stars: m.stars || 0,
                recommend: m.recommends || 0,
                views: m.views || 0,
                updatedAt: work.updated_at
                  ? new Date(work.updated_at).toLocaleDateString("ru-RU")
                  : "-",
                badge: work.status === "published" && work.published_at ? "" : "НОВОЕ",
                isFirst: index === 0, // Фокус на первом
                originalWork: work // Сохраняем оригинальный объект для редактирования
              };
              });
              allDisplayItems = [...allDisplayItems, ...worksWithMetrics];
            } catch (error) {
              console.error('Error loading works:', error);
            }
          }
        }
        
        // Добавляем backgrounds напрямую
        if (backgroundItems.length > 0) {
          const backgroundsDisplay = backgroundItems.map((item, index) => ({
            id: item.asset_id, // URL используется как ID для backgrounds
            assetId: item.asset_id, // Сохраняем для удаления
            assetType: 'background',
            title: "",
            meta: "",
            cover: item.asset_id,
            status: "published",
            stars: 0,
            recommend: 0,
            views: 0,
            updatedAt: new Date(item.created_at).toLocaleDateString("ru-RU"),
            badge: "",
            isFirst: allDisplayItems.length === 0 && index === 0, // Фокус на первом
            isBackground: true
          }));
          allDisplayItems = [...allDisplayItems, ...backgroundsDisplay];
        }

        setWorks(allDisplayItems);
      } catch (error) {
        console.error("Error loading collection items:", error);
        setWorks([]);
      } finally {
        setWorksLoading(false);
      }
    };

    loadCollectionWorks();
  }, [selectedCollectionId]);

  const handleCollectionSelect = (collectionId) => {
    setSelectedCollectionId(collectionId);
    setViewMode('works');
  };

  const handleStartRename = (collection) => {
    if (collection.title === DEFAULT_COLLECTION_TITLE) {
      alert('Нельзя переименовать дефолтную коллекцию');
      return;
    }
    setEditingId(collection.id);
    setEditingName(collection.title);
  };

  const validateCollectionName = (name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Название не может быть пустым';
    }
    if (trimmed.length > 50) {
      return 'Название не может быть длиннее 50 символов';
    }
    if (trimmed === 'D COLLECTION') {
      return 'Это название зарезервировано';
    }
    return null;
  };

  const handleSaveRename = async (collectionId) => {
    const validationError = validateCollectionName(editingName);
    if (validationError) {
      alert(validationError);
      return;
    }
    try {
      await renameCollection(collectionId, editingName.trim());
      await loadCollections();
      setEditingId(null);
    } catch (error) {
      console.error('Error renaming collection:', error);
      alert(error.message || 'Ошибка переименования');
    }
  };

  const handleDelete = async (collection) => {
    if (collection.title === DEFAULT_COLLECTION_TITLE) {
      alert('Нельзя удалить дефолтную коллекцию');
      return;
    }
    if (window.confirm(`Точно удалить коллекцию "${collection.title}"?`)) {
      try {
        await deleteCollection(collection.id);
        if (selectedCollectionId === collection.id) {
          setSelectedCollectionId(null);
        }
        await loadCollections();
      } catch (error) {
        console.error('Error deleting collection:', error);
        alert(error.message || 'Ошибка удаления');
      }
    }
  };

  const handleStartEditWorkTitle = (work) => {
    if (work.isBackground) return; // Backgrounds не редактируются
    setEditingWorkId(work.id);
    setEditingWorkTitle(work.originalWork?.title || "");
  };

  const handleSaveWorkTitle = async (workId) => {
    try {
      const trimmed = editingWorkTitle.trim();
      await updateWork(workId, { title: trimmed });
      setEditingWorkId(null);
      // Перезагружаем работы коллекции
      const items = await getCollectionItems(selectedCollectionId);
      const workItems = items.filter(item => item.asset_type === 'work');
      if (workItems.length > 0) {
        const workIds = workItems.map(item => item.asset_id);
        const worksData = await getWorksByIds(workIds);
        // Обновляем works в стейте
        setWorks(prev => prev.map(w => {
          const updated = worksData.find(wd => wd.id === w.id);
          if (updated) {
            const displayTitle = updated.title || getDefaultWorkTitle(updated.category);
            return { ...w, title: displayTitle, originalWork: updated };
          }
          return w;
        }));
      }
    } catch (error) {
      console.error('Error updating work title:', error);
      alert('Ошибка сохранения названия');
    }
  };

  const handleTogglePublic = async (collection) => {
    try {
      await toggleCollectionPublic(collection.id, !collection.is_public);
      await loadCollections();
    } catch (error) {
      console.error('Error toggling public:', error);
    }
  };

  const handleTogglePinned = async (collection) => {
    // D COLLECTION нельзя закреплять/откреплять - она всегда первая
    if (collection.title === DEFAULT_COLLECTION_TITLE) return;
    
    try {
      // Если хотим закрепить - проверяем лимит
      if (!collection.is_pinned) {
        const user = await getCurrentUser();
        const pinnedCount = await getPinnedCollectionsCount(user.id);
        if (pinnedCount >= 3) {
          setShowSubscriptionModal(true);
          return;
        }
      }
      
      await toggleCollectionPinned(collection.id, !collection.is_pinned);
      await loadCollections();
    } catch (error) {
      console.error('Error toggling pinned:', error);
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const previousState = [...works];
    const newWorks = [...works];
    const [draggedItem] = newWorks.splice(draggedIndex, 1);
    newWorks.splice(dropIndex, 0, draggedItem);
    
    setWorks(newWorks);
    setDraggedIndex(null);

    addToHistory({
      type: 'reorder',
      previousState,
      newState: newWorks
    });
    showLiveStatus('Перемещено');

    // Оновлюємо позиції в БД (простий варіант - перезаписуємо всі позиції)
    try {
      const items = await getCollectionItems(selectedCollectionId);
      // TODO: оновити позиції через updateItemPosition для кожного item
      console.log('Reorder completed, positions need to be saved to DB');
    } catch (error) {
      console.error('Error saving reorder:', error);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Multi-select handlers
  const handleWorkClick = (e, work) => {
    // Игнорируем правый клик - для него есть отдельный обработчик
    if (e.button === 2 || e.which === 3) return;
    // Игнорируем клик если это drag
    if (e.defaultPrevented) return;
    
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setSelectedWorks(prev => {
        const next = new Set(prev);
        if (next.has(work.id)) {
          next.delete(work.id);
        } else {
          next.add(work.id);
        }
        return next;
      });
    } else if (e.shiftKey && selectedWorks.size > 0) {
      e.preventDefault();
      const lastSelectedId = Array.from(selectedWorks)[selectedWorks.size - 1];
      const lastIndex = works.findIndex(w => w.id === lastSelectedId);
      const currentIndex = works.findIndex(w => w.id === work.id);
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      const newSelected = new Set(selectedWorks);
      for (let i = start; i <= end; i++) {
        newSelected.add(works[i].id);
      }
      setSelectedWorks(newSelected);
    } else {
      // Простой клик - переключить выделение
      e.preventDefault();
      setSelectedWorks(prev => {
        const next = new Set(prev);
        if (next.has(work.id)) {
          next.delete(work.id);
        } else {
          next.add(work.id);
        }
        return next;
      });
    }
  };

  // Delete handlers
  const showLiveStatus = (message) => {
    setLiveStatus(message);
    setTimeout(() => setLiveStatus(null), 2000);
  };

  const showInlineFeedback = (message) => {
    setInlineFeedback(message);
    setTimeout(() => setInlineFeedback(null), 2000);
  };

  const addToHistory = (action) => {
    setHistoryIndex(prevIndex => {
      setActionHistory(prev => {
        const newHistory = prev.slice(0, prevIndex + 1);
        newHistory.push(action);
        return newHistory;
      });
      return prevIndex + 1;
    });
  };

  const handleUndo = () => {
    if (historyIndex < 0 || actionHistory.length === 0) return;
    
    const action = actionHistory[historyIndex];
    
    // Виконуємо зворотню дію
    if (action.type === 'delete') {
      setWorks(action.previousState);
      showLiveStatus('Восстановлено');
    } else if (action.type === 'reorder') {
      setWorks(action.previousState);
      showLiveStatus('Возвращено');
    }
    
    setHistoryIndex(prev => prev - 1);
  };

  const handleRedo = () => {
    if (historyIndex >= actionHistory.length - 1 || actionHistory.length === 0) return;
    
    const action = actionHistory[historyIndex + 1];
    
    // Виконуємо повторну дію
    if (action.type === 'delete') {
      setWorks(action.newState);
      showLiveStatus('Повторено');
    } else if (action.type === 'reorder') {
      setWorks(action.newState);
      showLiveStatus('Повторено');
    }
    
    setHistoryIndex(prev => prev + 1);
  };

  const handleDeleteSelected = async () => {
    if (selectedWorks.size === 0) return;
    if (!window.confirm(`Удалить ${selectedWorks.size} элементов из коллекции?`)) return;

    try {
      const previousState = [...works];
      const assetIds = Array.from(selectedWorks);
      await removeItemsFromCollection(selectedCollectionId, assetIds);
      const newState = works.filter(w => !selectedWorks.has(w.id));
      setWorks(newState);
      setSelectedWorks(new Set());
      
      addToHistory({
        type: 'delete',
        previousState,
        newState
      });
      showLiveStatus('Удалено');
    } catch (error) {
      console.error('Error deleting items:', error);
      alert('Ошибка удаления');
    }
  };

  const handleDeleteOne = async (work) => {
    if (!window.confirm('Удалить из коллекции?')) return;

    try {
      const previousState = [...works];
      // Используем assetId (который может быть UUID для works или URL для backgrounds)
      const assetId = work.assetId || work.id;
      await removeItemFromCollection(selectedCollectionId, assetId);
      const newState = works.filter(w => w.id !== work.id);
      setWorks(newState);
      
      addToHistory({
        type: 'delete',
        previousState,
        newState
      });
      showLiveStatus('Удалено');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Ошибка удаления');
    }
  };

  const handleClearCollection = async () => {
    if (!window.confirm(`Очистить всю коллекцию "${selectedCollection?.title}"? Это удалит все элементы.`)) return;

    try {
      await clearCollection(selectedCollectionId);
      setWorks([]);
    } catch (error) {
      console.error('Error clearing collection:', error);
      alert('Ошибка очистки');
    }
  };

  const handleSetCover = async (workId) => {
    if (!selectedCollectionId || !workId) return;
    
    // Проверяем, что это валидный UUID (не URL для backgrounds)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(workId)) {
      console.error('[COVER] Invalid UUID format:', workId);
      alert('Ошибка: можно установить обложкой только работу (не фон)');
      return;
    }
    
    // Проверяем, что это work, а не background
    const work = works.find(w => (w.assetId || w.id) === workId);
    if (!work) {
      console.error('[COVER] Work not found:', workId);
      alert('Ошибка: работа не найдена');
      return;
    }
    
    if (work.isBackground) {
      console.error('[COVER] Cannot set background as cover');
      alert('Ошибка: нельзя установить фон как обложку коллекции');
      return;
    }
    
    const payload = {
      cover_item_id: workId,
      cover_item_type: 'work'
    };
    
    console.log('[COVER] Setting cover:', {
      collectionId: selectedCollectionId,
      workId: workId,
      workTitle: work.title,
      payload
    });
    
    try {
      const result = await updateCollectionCoverItem(selectedCollectionId, workId, 'work');
      
      console.log('[COVER] Update result:', {
        data: result,
        status: 'success'
      });
      
      if (result) {
        const workCoverUrl = work?.cover || work?.media_url || work?.thumbnail_url;
        
        // Обновляем локальный state коллекции
        setCollections(prev => prev.map(col => 
          col.id === selectedCollectionId 
            ? { 
                ...col, 
                cover_item_id: result.cover_item_id,
                cover_item_type: result.cover_item_type,
                cover_url: workCoverUrl || result.cover_url || col.cover_url
              }
            : col
        ));
        
        showInlineFeedback('Сделано обложкой');
      } else {
        throw new Error('Update returned no data');
      }
    } catch (error) {
      console.error('[COVER] Update error:', {
        collectionId: selectedCollectionId,
        workId: workId,
        error: error.message || error,
        code: error.code,
        details: error.details
      });
      
      alert(`Ошибка установки обложки: ${error.message || 'Неизвестная ошибка'}`);
    }
  };

  const handleToggleCoverBW = async () => {
    if (!selectedCollection) return;
    try {
      const newBW = !selectedCollection.cover_is_bw;
      await toggleCollectionCoverBW(selectedCollectionId, newBW);
      await loadCollections();
      showInlineFeedback(newBW ? 'Ч/Б: Вкл' : 'Ч/Б: Выкл');
    } catch (error) {
      console.error('Error toggling cover BW:', error);
    }
  };

  const handleWorkDoubleClick = (work) => {
    // Берем актуальное состояние work из массива works
    const currentWork = works.find(w => w.id === work.id) || work;
    setPreviewWork(currentWork);
  };

  const handleClosePreview = () => {
    setPreviewWork(null);
  };

  // ESC для закрытия preview/меню/снятия выделения + Delete/Backspace для удаления
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (previewWork) {
          handleClosePreview();
        } else if (moveModalWork) {
          setMoveModalWork(null);
        } else if (selectedWorks.size > 0) {
          setSelectedWorks(new Set());
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWorks.size > 0 && !editingWorkId) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewWork, selectedWorks, editingWorkId, moveModalWork]);


  // Перемещение в другую коллекцию (MOVE, не COPY)
  const handleMoveToCollection = async (targetCollectionId) => {
    if (!moveModalWork) {
      console.log('[MOVE] No work selected');
      return;
    }
    
    const work = moveModalWork;
    // Для backgrounds assetId это URL, для works - UUID
    const assetId = work.assetId || work.id;
    const assetType = work.assetType || (work.isBackground ? 'background' : 'work');
    const targetCollection = collections.find(c => c.id === targetCollectionId);
    
    console.log('[MOVE] Starting move:', {
      workId: work.id,
      assetId: assetId,
      assetType: assetType,
      isBackground: work.isBackground,
      fromCollectionId: selectedCollectionId,
      toCollectionId: targetCollectionId,
      targetCollectionTitle: targetCollection?.title
    });
    
    try {
      // Удаляем из текущей коллекции
      console.log('[MOVE] Removing from collection A:', {
        collectionId: selectedCollectionId,
        assetId: assetId,
        assetType: assetType
      });
      await removeItemFromCollection(selectedCollectionId, assetId);
      console.log('[MOVE] Removed successfully from collection A');
      
      // Добавляем в целевую коллекцию
      console.log('[MOVE] Adding to collection B:', {
        collectionId: targetCollectionId,
        assetId: assetId,
        assetType: assetType
      });
      await addItemToCollection(targetCollectionId, assetType, assetId);
      console.log('[MOVE] Added successfully to collection B');
      
      // Убираем из UI текущей коллекции
      setWorks(prev => prev.filter(w => w.id !== work.id));
      setSelectedWorks(prev => {
        const next = new Set(prev);
        next.delete(work.id);
        return next;
      });
      
      setMoveModalWork(null);
      showInlineFeedback(`Перемещено в «${targetCollection?.title || 'коллекцию'}»`);
      
      console.log('[MOVE] Success: item moved and UI updated');
    } catch (error) {
      console.error('[MOVE] Error:', {
        workId: work.id,
        assetId: assetId,
        assetType: assetType,
        isBackground: work.isBackground,
        fromCollectionId: selectedCollectionId,
        toCollectionId: targetCollectionId,
        error: error.message || error,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      alert(`Ошибка перемещения: ${error.message || 'Неизвестная ошибка'}`);
    }
  };


  // Клик по пустому фону снимает выделение
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedWorks(new Set());
    }
  };

  const selectedCollection = collections.find(
    (c) => c.id === selectedCollectionId
  );

  if (loading) {
    return <Loader />;
  }

  if (viewMode === 'works' && selectedCollectionId) {
    return (
      <div className="au-page">
        <div className="au-page__header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            {/* Live Status */}
            {liveStatus && (
              <span style={{
                color: 'rgba(92, 255, 212, 0.9)',
                fontSize: '14px',
                fontWeight: '500',
                animation: 'fadeIn 0.2s ease'
              }}>
                {liveStatus}
              </span>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', marginLeft: 'auto', width: '100%', justifyContent: 'flex-end', paddingRight: '0', transform: 'translateX(60px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Undo/Redo Buttons */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex < 0 || actionHistory.length === 0}
                    style={{
                      background: historyIndex >= 0 && actionHistory.length > 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      color: historyIndex >= 0 && actionHistory.length > 0 ? 'rgba(230, 237, 234, 0.9)' : 'rgba(230, 237, 234, 0.3)',
                      fontSize: '14px',
                      cursor: historyIndex >= 0 && actionHistory.length > 0 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s'
                    }}
                    title="Отменить"
                  >
                    ↶
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= actionHistory.length - 1 || actionHistory.length === 0}
                    style={{
                      background: historyIndex < actionHistory.length - 1 && actionHistory.length > 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      color: historyIndex < actionHistory.length - 1 && actionHistory.length > 0 ? 'rgba(230, 237, 234, 0.9)' : 'rgba(230, 237, 234, 0.3)',
                      fontSize: '14px',
                      cursor: historyIndex < actionHistory.length - 1 && actionHistory.length > 0 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s'
                    }}
                    title="Повторить"
                  >
                    ↷
                  </button>
                </div>

                {/* Collection Title */}
                <h1 style={{ 
                  margin: 0,
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: 'rgba(230, 237, 234, 1)',
                  fontFamily: 'Robofan, sans-serif'
                }}>
                  {selectedCollection?.title || "Коллекция"}
                </h1>
              </div>

              <button
                onClick={handleClearCollection}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  marginTop: '-8px',
                  color: 'rgba(255, 59, 48, 0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Очистить коллекцию
              </button>
            </div>
          </div>
        </div>

        {worksLoading ? (
          <Loader fullscreen={false} size="minimal" showText={false} />
        ) : works.length === 0 ? (
          <EmptyCollectionState />
        ) : (
          <>
            <div className="au-collections__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="au-collections__count" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {works.length} {works.length === 1 ? "работа" : "работ"}
                {selectedWorks.size > 0 && (
                  <span style={{ marginLeft: '4px', color: 'rgba(92, 255, 212, 0.8)' }}>
                    · Выбрано {selectedWorks.size}
                  </span>
                )}
                {inlineFeedback && (
                  <span style={{ 
                    marginLeft: '4px', 
                    color: 'rgba(92, 255, 212, 0.9)',
                    animation: 'fadeIn 0.2s ease',
                    transition: 'opacity 0.3s ease'
                  }}>
                    · {inlineFeedback}
                  </span>
                )}
              </div>
            </div>
            <div className="au-masonry" onClick={handleBackgroundClick} style={{ minHeight: '200px' }}>
              {works.map((work, idx) => {
                const big = idx % 7 === 0;
                const col = big ? "au-col-6" : "au-col-4";
                const isEditing = editingWorkId === work.id;
                
                const isSelected = selectedWorks.has(work.id);
                const isDragging = draggedIndex === idx;
                
                const showDropIndicator = dragOverIndex === idx && draggedIndex !== idx;
                
                return (
                  <div 
                    key={work.id || idx} 
                    className={col}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    style={{
                      position: 'relative'
                    }}
                  >
                    {showDropIndicator && (
                      <div style={{
                        position: 'absolute',
                        top: '-4px',
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'rgba(92, 255, 212, 0.8)',
                        borderRadius: '2px',
                        zIndex: 1000,
                        boxShadow: '0 0 8px rgba(92, 255, 212, 0.6)'
                      }} />
                    )}
                    <div 
                      className="au-workCard" 
                      onClick={(e) => handleWorkClick(e, work)}
                      onDoubleClick={() => handleWorkDoubleClick(work)}
                      style={{
                        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.02) 70%, transparent 100%)',
                        border: work.isFirst ? '2px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        opacity: isDragging ? 0.5 : 1,
                        position: 'relative'
                      }}>
                      {/* Микро-иконки на selected карточке */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          display: 'flex',
                          gap: '4px',
                          zIndex: 10
                        }}>
                          <button
                            onClick={(e) => {
                              console.log('[COVER] Button clicked:', { 
                                workId: work.id, 
                                assetId: work.assetId,
                                isBackground: work.isBackground,
                                assetType: work.assetType
                              });
                              e.stopPropagation();
                              // Используем только work.id (UUID), не assetId (может быть URL для backgrounds)
                              const workUuid = work.isBackground ? null : (work.id);
                              if (workUuid) {
                                handleSetCover(workUuid);
                              } else {
                                alert('Нельзя установить фон как обложку');
                              }
                            }}
                            disabled={work.isBackground}
                            style={{
                              background: 'rgba(0, 0, 0, 0.6)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '6px',
                              padding: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Сделать обложкой"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21 15 16 10 5 21"/>
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              console.log('[MOVE] Button clicked:', { 
                                workId: work.id, 
                                assetId: work.assetId,
                                isBackground: work.isBackground,
                                assetType: work.assetType
                              });
                              e.stopPropagation();
                              e.preventDefault();
                              setMoveModalWork(work);
                              console.log('[MOVE] Modal should open, moveModalWork set to:', work.id);
                            }}
                            style={{
                              background: 'rgba(0, 0, 0, 0.6)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '6px',
                              padding: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Переместить"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          </button>
                        </div>
                      )}
                      <div className="au-workCard__media">
                        <img 
                          src={work.cover} 
                          alt={work.title}
                          className="au-workCard__img"
                          style={{ 
                            objectFit: 'cover',
                            filter: work.applyBW ? 'grayscale(100%)' : 'none',
                            transition: 'filter 0.3s ease'
                          }}
                        />
                      </div>
                      <div className="au-workCard__footer" style={{ padding: '12px', background: 'transparent', backgroundColor: 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingWorkTitle}
                              onChange={(e) => setEditingWorkTitle(e.target.value)}
                              onBlur={() => handleSaveWorkTitle(work.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveWorkTitle(work.id);
                                if (e.key === 'Escape') setEditingWorkId(null);
                              }}
                              autoFocus
                              style={{
                                flex: 1,
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                color: 'rgba(230, 237, 234, 1)',
                                fontSize: '14px',
                                fontWeight: '500'
                              }}
                            />
                          ) : (
                            <>
                              <h3 style={{ 
                                flex: 1,
                                margin: 0, 
                                fontSize: '14px', 
                                fontWeight: '500',
                                color: 'rgba(230, 237, 234, 1)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {work.title}
                              </h3>
                              {!work.isBackground && (
                                <button
                                  onClick={() => handleStartEditWorkTitle(work)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    opacity: 0.6,
                                    transition: 'opacity 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                                  onMouseLeave={(e) => e.target.style.opacity = '0.6'}
                                  title="Редактировать название"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'rgba(255, 255, 255, 0.5)',
                          marginBottom: '8px'
                        }}>
                          {work.meta}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '12px', 
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}>
                          <span>⭐ {work.stars}</span>
                          <span>👍 {work.recommend}</span>
                          <span>👁 {work.views}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="au-page">
      <div className="au-page__header">
        <h1 className="au-page__title">Коллекции</h1>
      </div>

      {collections.length === 0 ? (
        <Loader fullscreen={false} size="compact" />
      ) : (
        <>
          <div style={{ marginBottom: '32px' }}>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
          {collections.map((collection) => {
            const DEFAULT_COVER = "https://archive.org/download/dcol_20251214/dcol.jpg";
            const FALLBACK_IMG = "https://archive.org/download/collabs_20251214_0442/COLLABS.png";
            const isEmpty = !collection.items_count || collection.items_count === 0;
            const coverUrl = isEmpty ? DEFAULT_COVER : (collection.cover_url || FALLBACK_IMG);
            const isDefault = collection.title === DEFAULT_COLLECTION_TITLE;

            return (
              <div
                key={collection.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div
                  onClick={() => handleCollectionSelect(collection.id)}
                  style={{
                    position: 'relative',
                    paddingTop: '66.67%',
                    background: `url(${coverUrl}) center/cover`,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    filter: collection.cover_is_bw ? 'grayscale(100%)' : 'none'
                  }}
                >
                  {isDefault && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(92, 255, 212, 0.2)',
                      border: '1px solid rgba(92, 255, 212, 0.4)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: 'rgba(92, 255, 212, 0.9)',
                      fontWeight: '500'
                    }}>
                      По умолчанию
                    </div>
                  )}
                  {collection.is_public && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500'
                    }}>
                      Публичная
                    </div>
                  )}
                </div>

                <div style={{ padding: '16px' }}>
                  {editingId === collection.id ? (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(collection.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: 'rgba(230, 237, 234, 1)',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => handleSaveRename(collection.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(92, 255, 212, 0.8)',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '4px 8px'
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.5)',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '4px 8px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'rgba(230, 237, 234, 1)'
                      }}>
                        {collection.title || 'Без названия'}
                      </h3>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(collection);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.5)',
                            cursor: isDefault ? 'not-allowed' : 'pointer',
                            padding: '4px',
                            opacity: isDefault ? 0.3 : 1
                          }}
                          title={isDefault ? 'Нельзя переименовать' : 'Переименовать'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(collection);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 100, 100, 0.7)',
                            cursor: isDefault ? 'not-allowed' : 'pointer',
                            padding: '4px',
                            opacity: isDefault ? 0.3 : 1
                          }}
                          title={isDefault ? 'Нельзя удалить' : 'Удалить'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(230, 237, 234, 0.6)',
                    marginBottom: '12px'
                  }}>
                    {collection.items_count || 0} элементов
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePublic(collection);
                      }}
                      style={{
                        flex: 1,
                        background: collection.is_public ? 'rgba(92, 255, 212, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        border: collection.is_public ? '1px solid rgba(92, 255, 212, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: collection.is_public ? 'rgba(92, 255, 212, 0.9)' : 'rgba(230, 237, 234, 0.7)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {collection.is_public ? (
                            <circle cx="12" cy="12" r="10"></circle>
                          ) : (
                            <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></>
                          )}
                        </svg>
                        {collection.is_public ? 'Публичная' : 'Приватная'}
                      </span>
                    </button>
                    {!isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePinned(collection);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '4px',
                          color: collection.is_pinned ? 'rgba(255, 200, 50, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        title={collection.is_pinned ? 'Открепить' : 'Закрепить на странице'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={collection.is_pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}

      {/* Fullscreen Preview */}
      {previewWork && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={handleClosePreview}
        >
          <button
            onClick={handleClosePreview}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              zIndex: 10001
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            ×
          </button>
          <div 
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={previewWork.cover} 
              alt={previewWork.title}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                filter: previewWork.applyBW ? 'grayscale(100%)' : 'none',
                transition: 'filter 0.3s ease'
              }}
            />
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '500' }}>
                {previewWork.title}
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                {previewWork.meta}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Модалка перемещения */}
      {moveModalWork && (() => {
        console.log('[MOVE] Rendering modal for work:', moveModalWork.id, moveModalWork.title);
        return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 10003,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => {
            console.log('[MOVE] Modal backdrop clicked, closing');
            setMoveModalWork(null);
          }}
        >
          <div
            style={{
              background: 'rgba(30, 30, 30, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '20px',
              minWidth: '280px',
              maxWidth: '400px',
              maxHeight: '60vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }}>
              Переместить в коллекцию
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(() => {
                const availableCollections = collections.filter(c => c.id !== selectedCollectionId);
                console.log('[MOVE] Available collections for move:', availableCollections.length, availableCollections.map(c => ({ id: c.id, title: c.title })));
                if (availableCollections.length === 0) {
                  return (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Нет других коллекций для перемещения
                    </div>
                  );
                }
                return availableCollections.map(col => (
                  <button
                    key={col.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('[MOVE] Collection selected in modal:', { collectionId: col.id, collectionTitle: col.title });
                      handleMoveToCollection(col.id);
                    }}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(92, 255, 212, 0.1)';
                      e.target.style.borderColor = 'rgba(92, 255, 212, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    {col.title}
                    <span style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px' }}>
                      ({col.items_count || 0})
                    </span>
                  </button>
                ));
              })()}
            </div>
            <button
              onClick={() => setMoveModalWork(null)}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Отмена
            </button>
          </div>
        </div>
        );
      })()}

      {/* Модалка подписки - лимит закреплённых коллекций */}
      {showSubscriptionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setShowSubscriptionModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(30, 35, 40, 0.98) 0%, rgba(20, 25, 30, 0.98) 100%)',
              border: '1px solid rgba(255, 200, 50, 0.3)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '420px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 20px',
              background: 'rgba(255, 200, 50, 0.15)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 200, 50, 0.9)" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            
            <h2 style={{
              margin: '0 0 12px',
              fontSize: '22px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.95)'
            }}>
              Лимит закреплённых коллекций
            </h2>
            
            <p style={{
              margin: '0 0 24px',
              fontSize: '15px',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.6'
            }}>
              Вы можете закрепить до <strong style={{ color: 'rgba(255, 200, 50, 0.9)' }}>3 коллекций</strong> на своей странице.
              <br /><br />
              Оформите подписку D PRO, чтобы закреплять больше коллекций и получить доступ к премиум-функциям.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Понятно
              </button>
              <button
                onClick={() => {
                  setShowSubscriptionModal(false);
                  navigate('/author/balance');
                }}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, rgba(255, 200, 50, 0.9) 0%, rgba(255, 150, 50, 0.9) 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Оформить D PRO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

