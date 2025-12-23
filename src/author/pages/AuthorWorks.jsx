import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../components/author-ui.css";
import "./AuthorWorks.css";
import { getCurrentUser } from "../../services/userService";
import { getAuthorServices, updateAuthorService, deleteAuthorService } from "../../services/authorServiceService";
import Loader from "../../components/ui/Loader";

import ContextMenu, { useContextMenu } from "../components/ContextMenu";
import { ToastProvider, showToast } from "../components/Toast";
import EditServiceModal from "../components/EditServiceModal";
import sadIcon from "../../editorV2/components/bazar/assets/prof/sad.png";

const FALLBACK_IMG = "https://archive.org/download/collabs_20251214_0442/COLLBACK.png";

const STATUS_MAP = {
  published: { label: "Опубликовано", class: "is-published" },
  moderation: { label: "На модерации", class: "is-moderation" },
  hidden: { label: "Скрыто", class: "is-hidden" },
  draft: { label: "Черновик", class: "is-draft" }
};

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "published", label: "Опубликованные" },
  { key: "draft", label: "Черновики" },
  { key: "hidden", label: "Скрытые" },
  { key: "moderation", label: "На модерации" }
];

export default function AuthorWorks() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [draggedId, setDraggedId] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const contextMenu = useContextMenu();

  const loadWorks = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;

      const services = await getAuthorServices(user.id);

      const formattedWorks = services.map((service, idx) => {
        const formatDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        }) : '-';

        let status = 'draft';
        if (service.status === 'active') status = 'published';
        else if (service.status === 'moderation') status = 'moderation';
        else if (service.status === 'hidden') status = 'hidden';

        return {
          id: service.id,
          title: service.title,
          cover: service.cover_url || FALLBACK_IMG,
          status,
          stars: service.rating || 0,
          recommend: service.recommends || 0,
          deals: service.orders_count || 0,
          publishedAt: formatDate(service.published_at),
          updatedAt: formatDate(service.updated_at || service.created_at),
          position: service.position ?? idx
        };
      });

      formattedWorks.sort((a, b) => a.position - b.position);
      setWorks(formattedWorks);
    } catch (error) {
      console.error("Error loading works:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWorks(); }, [loadWorks]);

  const filtered = useMemo(() => {
    let base = works;
    if (filter !== "all") {
      base = works.filter(x => x.status === filter);
    }
    const query = q.trim().toLowerCase();
    if (!query) return base;
    return base.filter(x => (x.title || "").toLowerCase().includes(query));
  }, [works, filter, q]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(w => w.id)));
    }
  };

  const handleEdit = (workId) => {
    // Находим услугу для редактирования
    const work = works.find(w => w.id === workId);
    if (work) {
      setEditingService(work);
    }
  };

  const handleSaveService = async (serviceId, data) => {
    await updateAuthorService(serviceId, data);
    showToast("Сохранено");
    loadWorks();
  };

  const handlePublish = async (workId) => {
    await updateAuthorService(workId, { status: 'active' });
    showToast("Опубликовано");
    loadWorks();
  };

  const handleHide = async (workId) => {
    await updateAuthorService(workId, { status: 'hidden' });
    showToast("Скрыто");
    loadWorks();
  };

  const handleDuplicate = (workId) => {
    showToast("Функция копирования в разработке", "info");
  };

  const handleDelete = async (workId) => {
    if (window.confirm('Удалить работу?')) {
      await deleteAuthorService(workId);
      showToast("Удалено");
      loadWorks();
    }
  };

  const getMenuItems = (item) => {
    const items = [
      { label: "Редактировать", onClick: () => handleEdit(item.id) }
    ];
    
    if (item.status === 'published') {
      items.push({ label: "Скрыть", onClick: () => handleHide(item.id) });
    } else {
      items.push({ label: "Опубликовать", onClick: () => handlePublish(item.id) });
    }
    
    items.push({ label: "Создать копию", onClick: () => handleDuplicate(item.id) });
    items.push({ label: "Удалить", onClick: () => handleDelete(item.id), danger: true });
    
    return items;
  };

  const handleBulkAction = async (action) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    
    switch (action) {
      case 'hide':
        await Promise.all(ids.map(id => updateAuthorService(id, { status: 'hidden' })));
        break;
      case 'delete':
        if (window.confirm(`Удалить ${ids.length} работ?`)) {
          await Promise.all(ids.map(id => deleteAuthorService(id)));
        }
        break;
    }
    setSelected(new Set());
    loadWorks();
  };

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const newWorks = [...works];
    const dragIdx = newWorks.findIndex(w => w.id === draggedId);
    const targetIdx = newWorks.findIndex(w => w.id === targetId);
    
    const [dragged] = newWorks.splice(dragIdx, 1);
    newWorks.splice(targetIdx, 0, dragged);

    const updated = newWorks.map((w, i) => ({ ...w, position: i }));
    setWorks(updated);
    setDraggedId(null);

    // Сохраняем позиции в БД
    await Promise.all(updated.map(w => updateAuthorService(w.id, { position: w.position })));
  };

  // Получаем текущий элемент для меню
  const currentItem = works.find(w => w.id === contextMenu.targetId);

  return (
    <ToastProvider>
    <div className="au-works">
      {/* Контекстное меню (Portal) */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={contextMenu.closeMenu}
        anchorRect={contextMenu.anchorRect}
        items={currentItem ? getMenuItems(currentItem) : []}
      />

      {/* Шапка */}
      <div className="au-pageHead">
        <div>
          <h1 className="au-pageTitle">Мои работы</h1>
          <p className="au-pageSub">Управление публикациями</p>
        </div>
        <div className="au-pageHead__actions">
          <button className="au-btn" type="button" onClick={() => navigate('/author/collections', { state: { openAddWork: true } })}>
            + Добавить работу
          </button>
          <button className="au-btn au-btn--ghost" type="button" onClick={() => navigate('/author/services', { state: { openCreateService: true } })}>
            Создать услугу
          </button>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="au-worksHead">
        <div className="au-tabs" role="tablist">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`au-tab ${filter === f.key ? "is-active" : ""}`}
              onClick={() => setFilter(f.key)}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="au-worksTools">
          <input
            className="au-input"
            placeholder="Поиск…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Массовые действия */}
      {selected.size > 0 && (
        <div className="au-bulk-bar">
          <span>Выбрано: {selected.size}</span>
          <button className="au-btn au-btn--sm au-btn--ghost" onClick={() => handleBulkAction('hide')}>Скрыть</button>
          <button className="au-btn au-btn--sm au-btn--danger" onClick={() => handleBulkAction('delete')}>Удалить</button>
          <button className="au-btn au-btn--sm au-btn--ghost" onClick={() => setSelected(new Set())}>Отмена</button>
        </div>
      )}

      {/* Список */}
      {loading ? (
        <Loader fullscreen={false} size="compact" />
      ) : filtered.length ? (
        <div className="au-works-table">
          {/* Заголовок таблицы */}
          <div className="au-works-row au-works-row--head">
            <div className="au-works-cell au-works-cell--check">
              <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} />
            </div>
            <div className="au-works-cell au-works-cell--drag"></div>
            <div className="au-works-cell au-works-cell--cover">Превью</div>
            <div className="au-works-cell au-works-cell--title">Название</div>
            <div className="au-works-cell au-works-cell--status">Статус</div>
            <div className="au-works-cell au-works-cell--stat">⭐</div>
            <div className="au-works-cell au-works-cell--stat">👍</div>
            <div className="au-works-cell au-works-cell--stat">🧾</div>
            <div className="au-works-cell au-works-cell--date">Опубл.</div>
            <div className="au-works-cell au-works-cell--date">Изменено</div>
            <div className="au-works-cell au-works-cell--menu"></div>
          </div>

          {/* Строки */}
          {filtered.map(item => (
            <div
              key={item.id}
              className={`au-works-row ${selected.has(item.id) ? 'is-selected' : ''} ${draggedId === item.id ? 'is-dragging' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
            >
              <div className="au-works-cell au-works-cell--check">
                <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} />
              </div>
              <div className="au-works-cell au-works-cell--drag">⋮⋮</div>
              <div className="au-works-cell au-works-cell--cover">
                <div className="au-works-cover" style={{ backgroundImage: `url(${item.cover})` }} />
              </div>
              <div className="au-works-cell au-works-cell--title">{item.title}</div>
              <div className="au-works-cell au-works-cell--status">
                <span className={`au-status-badge ${STATUS_MAP[item.status]?.class || ''}`}>
                  {STATUS_MAP[item.status]?.label || item.status}
                </span>
              </div>
              <div className="au-works-cell au-works-cell--stat">{item.stars}</div>
              <div className="au-works-cell au-works-cell--stat">{item.recommend}</div>
              <div className="au-works-cell au-works-cell--stat">{item.deals}</div>
              <div className="au-works-cell au-works-cell--date">{item.publishedAt}</div>
              <div className="au-works-cell au-works-cell--date">{item.updatedAt}</div>
              <div className="au-works-cell au-works-cell--menu">
                <button className="au-menu-btn" onClick={(e) => contextMenu.openMenu(e, item.id)}>⋯</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="au-works-empty">
          <img src={sadIcon} alt="" className="au-works-empty__icon" />
          <p>Пока нет публикаций</p>
        </div>
      )}

      {/* Модалка редактирования */}
      <EditServiceModal
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        onSave={handleSaveService}
        service={editingService}
      />
    </div>
    </ToastProvider>
  );
}
