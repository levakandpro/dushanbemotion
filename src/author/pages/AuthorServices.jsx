import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../components/author-ui.css";
import "./AuthorServices.css";
import Loader from "../../components/ui/Loader";

import { getCurrentUser } from "../../services/userService";
import { getAuthorServices, createAuthorService, updateAuthorService, deleteAuthorService } from "../../services/authorServiceService";

import ContextMenu, { useContextMenu } from "../components/ContextMenu";
import { ToastProvider, showToast } from "../components/Toast";
import CreateServiceModal from "../components/CreateServiceModal";
import EditServiceModal from "../components/EditServiceModal";
import sadIcon from "../../editorV2/components/bazar/assets/prof/sad.png";

const STATUS_MAP = {
  active: { label: "Активна", class: "is-active" },
  paused: { label: "На паузе", class: "is-paused" },
  archived: { label: "Архив", class: "is-archived" },
  draft: { label: "Черновик", class: "is-draft" }
};

export default function AuthorServices() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const contextMenu = useContextMenu();

  // Открыть модалку если пришли с флагом
  useEffect(() => {
    if (location.state?.openCreateService) {
      setShowCreateModal(true);
      // Очищаем state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;

      const authorServices = await getAuthorServices(user.id);
      
      const formattedServices = authorServices.map(s => ({
        id: s.id,
        title: s.emoji ? `${s.emoji} ${s.title}` : s.title,
        description: s.description,
        price: s.price,
        deliveryDays: s.delivery_days,
        status: s.status || 'draft'
      }));

      setServices(formattedServices);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);

  const handleCreateService = async (serviceData) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Не авторизован");
    
    await createAuthorService(user.id, serviceData);
    await loadServices();
  };

  const handleEdit = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setEditingService(service);
    }
  };

  const handleSaveService = async (serviceId, data) => {
    await updateAuthorService(serviceId, data);
    showToast("Сохранено");
    loadServices();
  };

  const handlePause = async (serviceId) => {
    await updateAuthorService(serviceId, { status: 'paused' });
    showToast("Поставлено на паузу");
    loadServices();
  };

  const handleResume = async (serviceId) => {
    await updateAuthorService(serviceId, { status: 'active' });
    showToast("Возобновлено");
    loadServices();
  };

  const handleArchive = async (serviceId) => {
    await updateAuthorService(serviceId, { status: 'archived' });
    showToast("В архив");
    loadServices();
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Удалить услугу? Это действие нельзя отменить.')) {
      await deleteAuthorService(serviceId);
      showToast("Удалено");
      loadServices();
    }
  };

  const getMenuItems = (service) => {
    const items = [
      { label: "Редактировать", onClick: () => handleEdit(service.id) }
    ];
    
    if (service.status === 'active') {
      items.push({ label: "Поставить на паузу", onClick: () => handlePause(service.id) });
    } else if (service.status === 'paused') {
      items.push({ label: "Возобновить", onClick: () => handleResume(service.id) });
    }
    
    if (service.status !== 'archived') {
      items.push({ label: "В архив", onClick: () => handleArchive(service.id) });
    }
    
    items.push({ label: "Удалить", onClick: () => handleDelete(service.id), danger: true });
    
    return items;
  };

  // Получаем текущий элемент для меню
  const currentService = services.find(s => s.id === contextMenu.targetId);

  return (
    <ToastProvider>
    <div className="au-services">
      {/* Контекстное меню (Portal) */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={contextMenu.closeMenu}
        anchorRect={contextMenu.anchorRect}
        items={currentService ? getMenuItems(currentService) : []}
      />

      {/* Шапка */}
      <div className="au-pageHead">
        <div>
          <h1 className="au-pageTitle">Услуги</h1>
          <p className="au-pageSub">Контракты для заказов из работ</p>
        </div>
        <div className="au-pageHead__actions">
          <button className="au-btn" type="button" onClick={() => setShowCreateModal(true)}>
            + Создать услугу
          </button>
        </div>
      </div>

      {/* Список */}
      {loading ? (
        <Loader fullscreen={false} size="compact" />
      ) : services.length ? (
        <div className="au-services-list">
          {services.map(s => (
            <div key={s.id} className="au-service-card">
              <div className="au-service-card__main">
                <div className="au-service-card__title">{s.title}</div>
                <div className="au-service-card__desc">{s.description?.slice(0, 80)}{s.description?.length > 80 ? '...' : ''}</div>
                <div className="au-service-card__meta">
                  <span className="au-service-card__price">{s.price} D</span>
                  <span className="au-service-card__delivery">{s.deliveryDays} дн.</span>
                </div>
              </div>
              <div className="au-service-card__side">
                <span className={`au-service-status ${STATUS_MAP[s.status]?.class || ''}`}>
                  {STATUS_MAP[s.status]?.label || s.status}
                </span>
                <div className="au-service-card__menu">
                  <button className="au-menu-btn" onClick={(e) => contextMenu.openMenu(e, s.id)}>⋯</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="au-services-empty">
          <img src={sadIcon} alt="" className="au-services-empty__icon" />
          <p className="au-services-empty__text">Создай услугу - через неё клиенты будут заказывать похожие работы</p>
          <button className="au-btn" onClick={() => setShowCreateModal(true)}>+ Создать услугу</button>
        </div>
      )}

      {/* Модалка создания */}
      <CreateServiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateService={handleCreateService}
      />

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
