import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import "./ContextMenu.css";

/**
 * Универсальный компонент контекстного меню
 * Рендерится через Portal в document.body
 * Закрывается по клику вне, ESC, скроллу
 */
export default function ContextMenu({ 
  isOpen, 
  onClose, 
  anchorRect, 
  items = [] 
}) {
  const menuRef = useRef(null);

  // Закрытие по клику вне меню
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      // Проверяем что клик был вне меню
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    // Добавляем слушатели с небольшой задержкой чтобы не перехватить текущий клик
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("scroll", handleScroll, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !anchorRect) return null;

  // Позиционирование меню
  const style = {
    position: "fixed",
    top: anchorRect.bottom + 4,
    left: anchorRect.right - 150,
    zIndex: 99999
  };

  // Корректировка если выходит за левый край
  if (style.left < 10) {
    style.left = 10;
  }

  const handleItemClick = (item) => {
    console.log("ContextMenu: item clicked", item.label);
    
    // Сначала сохраняем callback
    const callback = item.onClick;
    
    // Закрываем меню
    onClose();
    
    // Выполняем действие после закрытия
    if (callback) {
      console.log("ContextMenu: executing callback");
      setTimeout(() => {
        try {
          callback();
        } catch (err) {
          console.error("ContextMenu callback error:", err);
        }
      }, 10);
    }
  };

  return createPortal(
    <div 
      ref={menuRef}
      className="ctx-menu"
      style={style}
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          className={`ctx-menu__item ${item.danger ? "ctx-menu__item--danger" : ""}`}
          onClick={() => handleItemClick(item)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

/**
 * Хук для управления контекстным меню
 */
export function useContextMenu() {
  const [menuState, setMenuState] = React.useState({
    isOpen: false,
    anchorRect: null,
    targetId: null
  });

  const openMenu = useCallback((e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuState({
      isOpen: true,
      anchorRect: rect,
      targetId
    });
  }, []);

  const closeMenu = useCallback(() => {
    setMenuState({
      isOpen: false,
      anchorRect: null,
      targetId: null
    });
  }, []);

  return {
    isOpen: menuState.isOpen,
    anchorRect: menuState.anchorRect,
    targetId: menuState.targetId,
    openMenu,
    closeMenu
  };
}
