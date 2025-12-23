import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";
import Loader from "../components/ui/Loader";
import { getCurrentUser } from "../services/userService";
import {
  getOrderById,
  getOrderMessages,
  sendOrderMessage,
  markMessagesAsRead,
  payOrder,
  startWork,
  deliverOrder,
  approveOrder,
  openDispute,
  cancelOrder,
  addRecommendation
} from "../services/orderService";
import { uploadChatFile } from "../services/coverService";
import { usePushNotifications } from "../hooks/usePushNotifications";
import "./OrderPage.css";

const defaultAva = "https://pub-b69ef7c5697c44e2ab311a83cae5c18a.r2.dev/default-avatar.png";

// Звуки чата
const incomingSound = typeof Audio !== 'undefined' ? new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp+cnp+goaGhoJ+fnp2dnZ6dnZ2cnJycm5uampqZmZmYmJiXl5eWlpaVlZWUlJSTk5OSkpKRkZGQkJCPj4+Ojo6NjY2MjIyLi4uKioqJiYmIiIiHh4eGhoaFhYWEhISCgoKBgYGAgIB/f39+fn59fX18fHx7e3t6enp5eXl4eHh3d3d2dnZ1dXV0dHRzc3NycnJxcXFwcHBvb29ubm5tbW1sbGxra2tqamppaWloaGhnZ2dmZmZlZWVkZGRjY2NiYmJhYWFgYGBfX19eXl5dXV1cXFxbW1taWlpZWVlYWFhXV1dWVlZVVVVUVFRTU1NSUlJRUVFQUFBPT09OTk5NTU1MTExLS0tKSkpJSUlISEhHR0dGRkZFRUVEREQ=') : null;
const outgoingSound = typeof Audio !== 'undefined' ? new Audio('https://archive.org/download/zvuk-chiha-multyashny/zvuk-chiha-multyashny.mp3') : null;

// Популярные эмодзи для быстрого выбора
const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🎉', '💯', '✨', '🙏', '😊'];
const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '😢', '😮'];

// Группировка сообщений по датам
function groupMessagesByDate(messages) {
  const groups = [];
  let currentDate = null;
  
  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groups.push({ type: 'date', date: msg.created_at });
    }
    groups.push({ type: 'message', ...msg });
  });
  
  return groups;
}

// Форматирование даты-разделителя
function formatDateDivider(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return 'Сегодня';
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
  
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// Компонент предпросмотра ссылок (Open Graph)
function LinkPreview({ url }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    const fetchPreview = async () => {
      try {
        // Используем бесплатный API для получения мета-данных
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        if (cancelled) return;
        
        // Парсим HTML для получения Open Graph мета-тегов
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        const getMeta = (name) => {
          const meta = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
          return meta ? meta.getAttribute('content') : null;
        };
        
        const ogImage = getMeta('og:image') || getMeta('twitter:image');
        const ogTitle = getMeta('og:title') || doc.querySelector('title')?.textContent || url;
        const ogDescription = getMeta('og:description') || getMeta('description') || '';
        const ogSiteName = getMeta('og:site_name') || new URL(url).hostname;
        
        if (ogTitle || ogDescription || ogImage) {
          setPreview({
            title: ogTitle,
            description: ogDescription,
            image: ogImage,
            siteName: ogSiteName,
            url: url
          });
        } else {
          setError(true);
        }
      } catch (err) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchPreview();
    
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="op-link-preview op-link-preview--loading">
        <div className="op-link-preview__skeleton" />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="op-message__link"
        onClick={(e) => e.stopPropagation()}
      >
        {url.length > 40 ? url.slice(0, 40) + '...' : url}
      </a>
    );
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="op-link-preview"
      onClick={(e) => e.stopPropagation()}
    >
      {preview.image && (
        <div className="op-link-preview__image">
          <img src={preview.image} alt={preview.title} />
        </div>
      )}
      <div className="op-link-preview__content">
        <div className="op-link-preview__site">{preview.siteName}</div>
        <div className="op-link-preview__title">{preview.title}</div>
        {preview.description && (
          <div className="op-link-preview__description">{preview.description}</div>
        )}
      </div>
    </a>
  );
}

// Компонент прогресс-бара заказа
function OrderProgressBar({ order }) {
  const steps = [
    { key: 'pending', label: 'Ожидает оплаты', status: ['pending', 'pending_payment'] },
    { key: 'paid', label: 'Оплачен', status: ['paid'] },
    { key: 'in_progress', label: 'В работе', status: ['in_progress'] },
    { key: 'delivered', label: 'Сдан', status: ['delivered'] },
    { key: 'approved', label: 'Завершён', status: ['approved'] }
  ];

  const getCurrentStepIndex = () => {
    const index = steps.findIndex(step => step.status.includes(order.status));
    return index >= 0 ? index : 0;
  };

  const currentStep = getCurrentStepIndex();

  return (
    <div className="op-progress-card">
      <h3>Прогресс выполнения</h3>
      <div className="op-progress-steps">
        {steps.map((step, index) => {
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div 
              key={step.key} 
              className={`op-progress-step ${isActive ? 'op-progress-step--active' : ''} ${isCurrent ? 'op-progress-step--current' : ''}`}
            >
              <div className="op-progress-step__dot" />
              <div className="op-progress-step__label">{step.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Функция для преобразования текста со ссылками в JSX с предпросмотром
function parseMessageContent(text, showPreview = false) {
  if (!text) return null;
  
  // Регулярка для URL
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/gi;
  const parts = text.split(urlRegex);
  const urls = [];
  
  // Находим все URL в тексте
  parts.forEach((part, i) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0;
      urls.push({ index: i, url: part });
    }
  });
  
  // Если включен предпросмотр и есть только одна ссылка (отдельно или в конце) - показываем превью
  if (showPreview && urls.length === 1) {
    const urlIndex = urls[0].index;
    const textBefore = parts.slice(0, urlIndex).join('').trim();
    const textAfter = parts.slice(urlIndex + 1).join('').trim();
    
    // Показываем превью если ссылка отдельно или в конце
    if (!textBefore || !textAfter) {
      return (
        <>
          {textBefore && <span>{textBefore}</span>}
          <LinkPreview url={urls[0].url} />
          {textAfter && <span>{textAfter}</span>}
        </>
      );
    }
  }
  
  // Иначе показываем обычные ссылки
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0;
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="op-message__link"
          onClick={(e) => e.stopPropagation()}
        >
          {part.length > 40 ? part.slice(0, 40) + '...' : part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const STATUS_LABELS = {
  pending_payment: "Ожидает подтверждения оплаты",
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  in_progress: "В работе",
  delivered: "Сдан на проверку",
  approved: "Завершён",
  disputed: "Спор",
  cancelled: "Отменён",
  refunded: "Возврат"
};

const STATUS_COLORS = {
  pending_payment: "#ff9800",
  pending: "#ffc107",
  paid: "#17a2b8",
  in_progress: "#007bff",
  delivered: "#6f42c1",
  approved: "#28a745",
  disputed: "#dc3545",
  cancelled: "#6c757d",
  refunded: "#fd7e14"
};

export default function OrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Улучшенный чат
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Emoji & Reactions
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactionMsg, setActiveReactionMsg] = useState(null);
  
  // Reply/Edit/Delete
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, message: null });
  
  // Image viewer
  const [showImageModal, setShowImageModal] = useState(null);
  
  // Push-уведомления
  const { isSupported: pushSupported, permission: pushPermission, requestPermission, showNotification, isGranted: pushGranted } = usePushNotifications();
  const typingTimeoutRef = useRef(null);
  const lastTypingRef = useRef(0);

  // Модалки
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rating, setRating] = useState(0); // 0 = не выбрано, обязательно выбрать
  const [review, setReview] = useState("");
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recommendComment, setRecommendComment] = useState("");
  const [wantsToRecommend, setWantsToRecommend] = useState(false); // Чекбокс рекомендации в модалке принятия
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const isClient = currentUser?.id === order?.client_id;
  const isAuthor = currentUser?.id === order?.author_id;
  const canChat = order && ["paid", "in_progress", "delivered"].includes(order.status);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!order || !currentUser) return;

    const otherId = isClient ? order.author_id : order.client_id;

    // Канал для сообщений + presence + typing
    const channel = supabase
      .channel(`order-chat-${id}`, {
        config: { presence: { key: currentUser.id } }
      })
      // Новые сообщения
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_messages",
          filter: `order_id=eq.${id}`
        },
        (payload) => {
          // Не добавляем если уже есть (оптимистичный апдейт)
          setMessages((prev) => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          // Звук и Push если сообщение от другого
          if (payload.new.sender_id !== currentUser.id) {
            playNotificationSound();
            markMessagesAsRead(id, currentUser.id);
            
            // Push-уведомление (работает даже при свёрнутом браузере)
            const senderName = isClient ? 'Автор' : 'Клиент';
            showNotification(`Новое сообщение от ${senderName}`, {
              body: payload.new.content?.slice(0, 100) || 'Прикреплён файл',
              tag: `order-${id}`,
              data: { url: `/order/${id}`, orderId: id }
            });
          }
        }
      )
      // Typing indicator
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId !== currentUser.id) {
          setOtherTyping(true);
          // Убираем через 3 сек
          setTimeout(() => setOtherTyping(false), 3000);
        }
      })
      // Presence для онлайн-статуса
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const online = Object.keys(state).includes(otherId);
        setIsOnline(online);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order, currentUser, id, isClient]);

  // Воспроизвести звук уведомления
  // Звук входящего сообщения
  const playNotificationSound = useCallback(() => {
    try {
      if (incomingSound && document.visibilityState !== 'visible') {
        incomingSound.volume = 0.3;
        incomingSound.currentTime = 0;
        incomingSound.play().catch(() => {});
      }
    } catch (e) {}
  }, []);

  // Звук исходящего сообщения (прикольный чих)
  const playOutgoingSound = useCallback(() => {
    try {
      if (outgoingSound) {
        outgoingSound.volume = 0.2;
        outgoingSound.currentTime = 0;
        outgoingSound.play().catch(() => {});
      }
    } catch (e) {}
  }, []);

  // Отправить typing indicator
  const sendTypingIndicator = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingRef.current < 2000) return; // Не чаще 2 сек
    lastTypingRef.current = now;
    
    supabase.channel(`order-chat-${id}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUser?.id }
    });
  }, [id, currentUser]);

  // Drag & Drop для файлов
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой (макс 10MB)');
        continue;
      }
      try {
        setUploadingFile(true);
        const uploaded = await uploadChatFile(file, id);
        setAttachments(prev => [...prev, uploaded]);
      } catch (err) {
        console.error('Upload error:', err);
        alert('Ошибка загрузки файла');
      } finally {
        setUploadingFile(false);
      }
    }
  }, [id]);

  // Вставка из буфера обмена (Ctrl+V)
  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            setUploadingFile(true);
            const uploaded = await uploadChatFile(file, id);
            setAttachments(prev => [...prev, uploaded]);
          } catch (err) {
            console.error('Paste upload error:', err);
          } finally {
            setUploadingFile(false);
          }
        }
      }
    }
  }, [id]);

  // Добавить emoji в сообщение
  const handleEmojiClick = useCallback((emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  }, []);

  // Реакция на сообщение
  const handleReaction = useCallback(async (messageId, emoji) => {
    // Оптимистично добавляем реакцию
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || {};
        const currentReactions = reactions[emoji] || [];
        const hasReacted = currentReactions.includes(currentUser?.id);
        
        return {
          ...msg,
          reactions: {
            ...reactions,
            [emoji]: hasReacted 
              ? currentReactions.filter(id => id !== currentUser?.id)
              : [...currentReactions, currentUser?.id]
          }
        };
      }
      return msg;
    }));
    setActiveReactionMsg(null);
    
    // TODO: Сохранить в БД когда будет API
  }, [currentUser]);

  // Контекстное меню сообщения
  const handleMessageContext = useCallback((e, message) => {
    e.preventDefault();
    if (message.is_system) return;
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      message
    });
  }, []);

  // Ответить на сообщение
  const handleReply = useCallback((message) => {
    setReplyingTo(message);
    setContextMenu({ show: false, x: 0, y: 0, message: null });
  }, []);

  // Удалить сообщение
  const handleDeleteMessage = useCallback(async (messageId) => {
    if (!confirm('Удалить сообщение?')) return;
    // Оптимистичное удаление
    setMessages(prev => prev.filter(m => m.id !== messageId));
    setContextMenu({ show: false, x: 0, y: 0, message: null });
    // TODO: Удалить из БД когда будет API
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();
      if (!user) {
        navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
        return;
      }
      setCurrentUser(user);

      const orderData = await getOrderById(id);
      if (!orderData) {
        setError("Заказ не найден");
        return;
      }

      // Проверяем доступ
      if (orderData.client_id !== user.id && orderData.author_id !== user.id) {
        setError("Нет доступа к этому заказу");
        return;
      }

      setOrder(orderData);

      // Загружаем сообщения
      const msgs = await getOrderMessages(id);
      setMessages(msgs);

      // Отмечаем как прочитанные
      await markMessagesAsRead(id, user.id);
    } catch (err) {
      console.error("Error loading order:", err);
      setError("Ошибка загрузки заказа");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const messageText = newMessage.trim();
    if ((!messageText && attachments.length === 0) || sending || !canChat) return;

    // Звук отправки
    playOutgoingSound();

    // Оптимистичный апдейт - сразу показываем сообщение
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      order_id: id,
      sender_id: currentUser.id,
      message: messageText,
      attachments: attachments.length > 0 ? attachments : null,
      reply_to: replyingTo ? { id: replyingTo.id, message: replyingTo.message?.slice(0, 50) } : null,
      is_system: false,
      created_at: new Date().toISOString(),
      _sending: true // Флаг что отправляется
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setAttachments([]);
    setReplyingTo(null);
    setShowEmojiPicker(false);

    try {
      setSending(true);
      const realMessage = await sendOrderMessage(id, currentUser.id, messageText, attachments, replyingTo?.id);
      
      // Заменяем оптимистичное на реальное
      setMessages(prev => prev.map(m => 
        m.id === optimisticMessage.id ? { ...realMessage, _sending: false } : m
      ));
    } catch (err) {
      console.error("Error sending message:", err);
      // Помечаем как ошибку
      setMessages(prev => prev.map(m => 
        m.id === optimisticMessage.id ? { ...m, _error: true, _sending: false } : m
      ));
    } finally {
      setSending(false);
    }
  };

  // Обработка ввода с typing indicator
  const handleMessageInput = (e) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      sendTypingIndicator();
    }
  };

  // Загрузка файла в R2
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Файл слишком большой (максимум 10MB)");
      return;
    }
    
    // Проверка типа
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert("Разрешены только изображения и PDF");
      return;
    }

    try {
      setUploadingFile(true);
      
      // Загружаем в R2 через Worker
      const attachment = await uploadChatFile(file, id);
      
      setAttachments(prev => [...prev, attachment]);
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Ошибка загрузки файла");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handlePay = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      const updated = await payOrder(id, currentUser.id);
      setOrder(updated);
      loadData(); // Перезагружаем для получения сообщений
    } catch (err) {
      console.error("Error paying:", err);
      alert(err.message || "Ошибка оплаты");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      const updated = await startWork(id, currentUser.id);
      setOrder(updated);
      loadData();
    } catch (err) {
      console.error("Error starting work:", err);
      alert(err.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (actionLoading || !deliveryMessage.trim()) return;
    try {
      setActionLoading(true);
      const updated = await deliverOrder(id, currentUser.id, deliveryMessage.trim());
      setOrder(updated);
      setShowDeliverModal(false);
      setDeliveryMessage("");
      loadData();
    } catch (err) {
      console.error("Error delivering:", err);
      alert(err.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (actionLoading || rating === 0) return;
    try {
      setActionLoading(true);
      const updated = await approveOrder(id, currentUser.id, rating, review.trim() || null);
      setOrder(updated);
      
      // Если клиент выбрал рекомендацию - добавляем её
      if (wantsToRecommend) {
        try {
          await addRecommendation(id, currentUser.id, null);
          setOrder(prev => ({ ...prev, has_recommendation: true }));
        } catch (recErr) {
          console.error("Ошибка добавления рекомендации:", recErr);
        }
      }
      
      setShowApproveModal(false);
      setWantsToRecommend(false);
      setRating(0);
      setReview("");
      loadData();
    } catch (err) {
      console.error("Error approving:", err);
      alert(err.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecommend = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await addRecommendation(id, currentUser.id, recommendComment.trim() || null);
      setOrder({ ...order, has_recommendation: true });
      setShowRecommendModal(false);
      alert("Спасибо за рекомендацию! 🏆");
    } catch (err) {
      console.error("Error recommending:", err);
      alert(err.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    if (actionLoading || !disputeReason.trim()) return;
    try {
      setActionLoading(true);
      const updated = await openDispute(id, currentUser.id, disputeReason.trim());
      setOrder(updated);
      setShowDisputeModal(false);
      setDisputeReason("");
      loadData();
    } catch (err) {
      console.error("Error opening dispute:", err);
      alert(err.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (actionLoading) return;
    if (!confirm("Вы уверены что хотите отменить заказ?")) return;
    try {
      setActionLoading(true);
      const updated = await cancelOrder(id, currentUser.id);
      setOrder(updated);
    } catch (err) {
      console.error("Error cancelling:", err);
      alert(err.message || "Ошибка отмены");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDeadline = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    const now = new Date();
    const diff = d - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return "Просрочен";
    if (days === 0) return "Сегодня";
    if (days === 1) return "Завтра";
    return `${days} дн.`;
  };

  if (loading) {
    return <Loader />;
  }

  if (error || !order) {
    return (
      <div className="op-page">
        <div className="op-error">
          <h2>{error || "Заказ не найден"}</h2>
          <button className="op-btn" onClick={() => navigate(-1)}>
            Назад
          </button>
        </div>
      </div>
    );
  }

  const otherUser = isClient ? order.author : order.client;

  return (
    <div className="op-page">
      <div className="op-container">
        {/* Шапка */}
        <div className="op-header">
          <button className="op-back" onClick={() => navigate(-1)}>
            ← Назад
          </button>
          <div className="op-header__info">
            <h1 className="op-header__title">
              {order.service?.emoji} {order.service?.title}
            </h1>
            <div className="op-header__meta">
              <span 
                className="op-status" 
                style={{ background: STATUS_COLORS[order.status] + "20", color: STATUS_COLORS[order.status] }}
              >
                {STATUS_LABELS[order.status]}
              </span>
              <span className="op-price">{order.price} DMC</span>
            </div>
          </div>
        </div>

        <div className="op-layout">
          {/* Чат */}
          <div 
            className={`op-chat ${isDragging ? 'op-chat--dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            {isDragging && (
              <div className="op-chat__drop-overlay">
                <div className="op-chat__drop-icon">📎</div>
                <span>Отпустите для загрузки</span>
              </div>
            )}
            
            <div className="op-chat__header">
              <Link to={`/u/${otherUser?.username}`} className="op-chat__user">
                <div className="op-chat__avatar-wrap">
                  <img src={otherUser?.avatar_url || defaultAva} alt="" className="op-chat__avatar" />
                  {isOnline && <span className="op-chat__online-dot" />}
                </div>
                <div className="op-chat__user-info">
                  <span className="op-chat__user-name">
                    {otherUser?.display_name || otherUser?.username}
                  </span>
                  <span className="op-chat__user-status">
                    {otherTyping ? (
                      <span className="op-chat__typing">печатает<span className="op-chat__typing-dots">...</span></span>
                    ) : isOnline ? (
                      <span className="op-chat__online-text">онлайн</span>
                    ) : (
                      <span>{isClient ? "Исполнитель" : "Заказчик"}</span>
                    )}
                  </span>
                </div>
              </Link>
              
              {/* Кнопка уведомлений */}
              {pushSupported && (
                <button 
                  className={`op-chat__notify-btn ${pushGranted ? 'op-chat__notify-btn--active' : ''}`}
                  onClick={requestPermission}
                  title={pushGranted ? 'Уведомления включены' : 'Включить уведомления'}
                >
                  {pushGranted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                      <line x1="13.73" y1="21" x2="10.27" y2="21"/>
                      <line x1="18" y1="6" x2="6" y2="18"/>
                    </svg>
                  )}
                </button>
              )}
            </div>

            <div className="op-chat__messages" onPaste={handlePaste}>
              {messages.length === 0 ? (
                <div className="op-chat__empty">
                  {canChat ? (
                    <>
                      <div className="op-chat__empty-icon">💬</div>
                      <p>Напишите первое сообщение</p>
                      <span>Общайтесь безопасно на платформе</span>
                    </>
                  ) : (
                    <>
                      <div className="op-chat__empty-icon">🔒</div>
                      <p>Чат станет доступен после оплаты</p>
                    </>
                  )}
                </div>
              ) : (
                groupMessagesByDate(messages).map((item, idx) => (
                  item.type === 'date' ? (
                    <div key={`date-${idx}`} className="op-chat__date-divider">
                      <span>{formatDateDivider(item.date)}</span>
                    </div>
                  ) : (
                  <div
                    key={item.id}
                    className={`op-message ${
                      item.is_system ? "op-message--system" : 
                      item.sender_id === currentUser?.id ? "op-message--own" : "op-message--other"
                    } ${item._sending ? "op-message--sending" : ""} ${item._error ? "op-message--error" : ""}`}
                    onContextMenu={(e) => handleMessageContext(e, item)}
                  >
                    {item.is_system ? (
                      <div className="op-message__system">
                        <span className="op-message__system-icon">ℹ️</span>
                        {item.message}
                      </div>
                    ) : (
                      <>
                        {/* Аватар (только для чужих сообщений) */}
                        {item.sender_id !== currentUser?.id && (
                          <img 
                            src={otherUser?.avatar_url || defaultAva} 
                            alt="" 
                            className="op-message__avatar"
                          />
                        )}
                        
                        <div className="op-message__bubble">
                          {/* Ответ на сообщение */}
                          {item.reply_to && (
                            <div className="op-message__reply">
                              <span className="op-message__reply-icon">↩️</span>
                              <span className="op-message__reply-text">{item.reply_to.message}</span>
                            </div>
                          )}
                          
                          {item.message && (
                            <div className="op-message__content">
                              {parseMessageContent(item.message, true)}
                            </div>
                          )}
                          
                          {/* Прикреплённые файлы */}
                          {item.attachments && item.attachments.length > 0 && (
                            <div className="op-message__attachments">
                              {item.attachments.map((att, i) => (
                                att.type?.startsWith('image/') ? (
                                  <img 
                                    key={i} 
                                    src={att.url} 
                                    alt={att.name}
                                    className="op-message__image"
                                    onClick={() => setShowImageModal(att.url)}
                                  />
                                ) : (
                                  <a 
                                    key={i} 
                                    href={att.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="op-message__file"
                                  >
                                    📎 {att.name}
                                  </a>
                                )
                              ))}
                            </div>
                          )}
                          
                          {/* Мета: время + статус */}
                          <div className="op-message__meta">
                            <span className="op-message__time">{formatDate(item.created_at)}</span>
                            {item._sending && <span className="op-message__status">⏳</span>}
                            {item._error && <span className="op-message__status op-message__status--error">❌</span>}
                            {!item._sending && !item._error && item.sender_id === currentUser?.id && (
                              <span className="op-message__status op-message__status--sent">✓✓</span>
                            )}
                          </div>
                          
                          {/* Реакции */}
                          {item.reactions && Object.keys(item.reactions).length > 0 && (
                            <div className="op-message__reactions">
                              {Object.entries(item.reactions).map(([emoji, users]) => (
                                users.length > 0 && (
                                  <button 
                                    key={emoji}
                                    className={`op-message__reaction ${users.includes(currentUser?.id) ? 'op-message__reaction--own' : ''}`}
                                    onClick={() => handleReaction(item.id, emoji)}
                                  >
                                    {emoji} {users.length > 1 && users.length}
                                  </button>
                                )
                              ))}
                            </div>
                          )}
                          
                          {/* Кнопка добавить реакцию */}
                          <button 
                            className="op-message__add-reaction"
                            onClick={() => setActiveReactionMsg(activeReactionMsg === item.id ? null : item.id)}
                          >
                            😀
                          </button>
                          
                          {/* Панель выбора реакции */}
                          {activeReactionMsg === item.id && (
                            <div className="op-message__reaction-picker">
                              {REACTION_EMOJIS.map(emoji => (
                                <button key={emoji} onClick={() => handleReaction(item.id, emoji)}>
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  )
                ))
              )}
              {otherTyping && (
                <div className="op-message op-message--typing">
                  <div className="op-typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {canChat && (
              <div className="op-chat__input-area">
                {/* Ответ на сообщение */}
                {replyingTo && (
                  <div className="op-chat__reply-bar">
                    <div className="op-chat__reply-content">
                      <span className="op-chat__reply-label">↩️ Ответ на:</span>
                      <span className="op-chat__reply-text">{replyingTo.message?.slice(0, 60)}</span>
                    </div>
                    <button className="op-chat__reply-close" onClick={() => setReplyingTo(null)}>×</button>
                  </div>
                )}
                
                {/* Прикреплённые файлы превью */}
                {attachments.length > 0 && (
                  <div className="op-chat__attachments-preview">
                    {attachments.map((att, i) => (
                      <div key={i} className="op-chat__attachment-item">
                        {att.type?.startsWith('image/') ? (
                          <img src={att.url} alt="" />
                        ) : (
                          <span>📎 {att.name}</span>
                        )}
                        <button onClick={() => removeAttachment(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                
                <form className="op-chat__input" onSubmit={handleSendMessage}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.zip"
                    multiple
                    hidden
                  />
                  
                  {/* Кнопка прикрепить */}
                  <button 
                    type="button" 
                    className="op-chat__attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    title="Прикрепить файл"
                  >
                    {uploadingFile ? (
                      <span className="op-chat__loading-spinner" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                      </svg>
                    )}
                  </button>
                  
                  {/* Кнопка emoji */}
                  <div className="op-chat__emoji-wrapper">
                    <button 
                      type="button" 
                      className="op-chat__emoji-btn"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Эмодзи"
                    >
                      😊
                    </button>
                    
                    {showEmojiPicker && (
                      <div className="op-chat__emoji-picker">
                        {QUICK_EMOJIS.map(emoji => (
                          <button 
                            key={emoji} 
                            type="button"
                            onClick={() => handleEmojiClick(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleMessageInput}
                    placeholder="Написать сообщение..."
                    disabled={sending}
                    onPaste={handlePaste}
                  />
                  
                  <button 
                    type="submit" 
                    className="op-chat__send-btn"
                    disabled={(!newMessage.trim() && attachments.length === 0) || sending}
                    title="Отправить"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </form>
              </div>
            )}
            
            {/* Контекстное меню сообщения */}
            {contextMenu.show && (
              <div 
                className="op-chat__context-menu"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={() => setContextMenu({ show: false, x: 0, y: 0, message: null })}
              >
                <button onClick={() => handleReply(contextMenu.message)}>
                  ↩️ Ответить
                </button>
                {contextMenu.message?.sender_id === currentUser?.id && (
                  <>
                    <button onClick={() => { setEditingMessage(contextMenu.message); setNewMessage(contextMenu.message.message); setContextMenu({ show: false, x: 0, y: 0, message: null }); }}>
                      ✏️ Редактировать
                    </button>
                    <button className="op-chat__context-danger" onClick={() => handleDeleteMessage(contextMenu.message.id)}>
                      🗑️ Удалить
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Сайдбар */}
          <div className="op-sidebar">
            {/* Прогресс-бар выполнения заказа */}
            <OrderProgressBar order={order} />
            
            {/* Информация о заказе */}
            <div className="op-info-card">
              <h3>Информация о заказе</h3>
              <div className="op-info-row">
                <span>Создан</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              {order.deadline_at && (
                <div className="op-info-row">
                  <span>Дедлайн</span>
                  <span className={order.status !== "approved" && new Date(order.deadline_at) < new Date() ? "op-overdue" : ""}>
                    {formatDeadline(order.deadline_at)}
                  </span>
                </div>
              )}
              <div className="op-info-row">
                <span>Срок выполнения</span>
                <span>{order.delivery_days} дней</span>
              </div>
              <div className="op-info-row">
                <span>Цена</span>
                <span className="op-info-price">{order.price} DMC</span>
              </div>
            </div>

            {/* Действия */}
            <div className="op-actions-card">
              <h3>Действия</h3>

              {/* Ожидание подтверждения оплаты */}
              {order.status === "pending_payment" && (
                <div className="op-pending-payment-info">
                  <div className="op-pending-payment-icon">⏳</div>
                  <h4>Оплата отправлена на проверку</h4>
                  <p>Администратор проверит ваш платёж и подтвердит заказ в течение 30 минут.</p>
                  <p className="op-pending-payment-hint">После подтверждения автор начнёт работу над вашим заказом.</p>
                </div>
              )}

              {/* Клиент - оплата */}
              {isClient && order.status === "pending" && (
                <>
                  <button 
                    className="op-action-btn op-action-btn--primary"
                    onClick={handlePay}
                    disabled={actionLoading}
                  >
                    💳 Оплатить {order.price} DMC
                  </button>
                  <button 
                    className="op-action-btn op-action-btn--danger"
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    Отменить заказ
                  </button>
                </>
              )}

              {/* Автор - начать работу */}
              {isAuthor && order.status === "paid" && (
                <button 
                  className="op-action-btn op-action-btn--primary"
                  onClick={handleStartWork}
                  disabled={actionLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Начать работу
                </button>
              )}

              {/* Автор - сдать работу */}
              {isAuthor && ["paid", "in_progress"].includes(order.status) && (
                <button 
                  className="op-action-btn op-action-btn--success"
                  onClick={() => setShowDeliverModal(true)}
                  disabled={actionLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Сдать работу
                </button>
              )}

              {/* Клиент - принять работу */}
              {isClient && order.status === "delivered" && (
                <>
                  <button 
                    className="op-action-btn op-action-btn--success"
                    onClick={() => setShowApproveModal(true)}
                    disabled={actionLoading}
                  >
                    ✅ Принять работу
                  </button>
                  <button 
                    className="op-action-btn op-action-btn--danger"
                    onClick={() => setShowDisputeModal(true)}
                    disabled={actionLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Открыть спор
                  </button>
                </>
              )}

              {/* Открыть спор */}
              {["paid", "in_progress"].includes(order.status) && (
                <button 
                  className="op-action-btn op-action-btn--outline"
                  onClick={() => setShowDisputeModal(true)}
                  disabled={actionLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Открыть спор
                </button>
              )}

              {/* Рекомендация */}
              {isClient && order.status === "approved" && !order.has_recommendation && (
                <button 
                  className="op-action-btn op-action-btn--gold"
                  onClick={() => setShowRecommendModal(true)}
                  disabled={actionLoading}
                >
                  🏆 РЕКОМЕНДУЮ
                </button>
              )}

              {order.has_recommendation && (
                <div className="op-recommended">
                  🏆 {isClient ? "Вы рекомендовали этого автора" : "Клиент рекомендовал вас"}
                </div>
              )}
            </div>

            {/* Сообщение при сдаче */}
            {order.delivery_message && (
              <div className="op-delivery-card">
                <h3>Сообщение при сдаче</h3>
                <p>{order.delivery_message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модалка сдачи работы */}
      {showDeliverModal && (
        <div className="op-modal-overlay" onClick={() => setShowDeliverModal(false)}>
          <div className="op-modal" onClick={(e) => e.stopPropagation()}>
            <div className="op-modal__header">
              <h3>Сдать работу</h3>
              <button className="op-modal__close" onClick={() => setShowDeliverModal(false)}>×</button>
            </div>
            <div className="op-modal__body">
              <div className="op-modal__field">
                <label>Сообщение клиенту *</label>
                <textarea
                  value={deliveryMessage}
                  onChange={(e) => setDeliveryMessage(e.target.value)}
                  placeholder="Опишите что было сделано, приложите ссылки на результат..."
                  rows={5}
                />
              </div>
            </div>
            <div className="op-modal__footer">
              <button className="op-modal__cancel" onClick={() => setShowDeliverModal(false)}>
                Отмена
              </button>
              <button 
                className="op-modal__submit"
                onClick={handleDeliver}
                disabled={!deliveryMessage.trim() || actionLoading}
              >
                {actionLoading ? "Отправка..." : "Сдать работу"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка принятия работы */}
      {showApproveModal && (
        <div className="op-modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="op-modal" onClick={(e) => e.stopPropagation()}>
            <div className="op-modal__header">
              <h3>Принять работу</h3>
              <button className="op-modal__close" onClick={() => setShowApproveModal(false)}>×</button>
            </div>
            <div className="op-modal__body">
              <div className="op-modal__field">
                <label>Оценка <span className="op-required">*</span></label>
                <div className="op-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`op-rating__star ${star <= rating ? "active" : ""}`}
                      onClick={() => setRating(star)}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div className="op-modal__field">
                <label>Отзыв (опционально)</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Напишите отзыв о работе автора..."
                  rows={3}
                />
              </div>
              <div className="op-modal__field op-modal__field--checkbox">
                <label className="op-checkbox">
                  <input 
                    type="checkbox" 
                    checked={wantsToRecommend} 
                    onChange={(e) => setWantsToRecommend(e.target.checked)} 
                  />
                  <span className="op-checkbox__mark"></span>
                  <span className="op-checkbox__text">🏆 РЕКОМЕНДУЮ этого автора</span>
                </label>
                <p className="op-modal__hint">Высшая оценка работы, влияет на рейтинг автора</p>
              </div>
              <div className="op-modal__info">
                <p>После принятия работы деньги будут начислены автору.</p>
              </div>
            </div>
            <div className="op-modal__footer">
              <button className="op-modal__cancel" onClick={() => setShowApproveModal(false)}>
                Отмена
              </button>
              <button 
                className="op-modal__submit"
                onClick={handleApprove}
                disabled={actionLoading || rating === 0}
              >
                {actionLoading ? "Обработка..." : "Принять и оплатить автору"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка рекомендации */}
      {showRecommendModal && (
        <div className="op-modal-overlay" onClick={() => setShowRecommendModal(false)}>
          <div className="op-modal" onClick={(e) => e.stopPropagation()}>
            <div className="op-modal__header">
              <h3>🏆 Рекомендовать автора</h3>
              <button className="op-modal__close" onClick={() => setShowRecommendModal(false)}>×</button>
            </div>
            <div className="op-modal__body">
              <p className="op-modal__text">
                Рекомендация "РЕКОМЕНДУЮ" - это высшая оценка работы автора. 
                Она отображается в профиле и влияет на рейтинг.
              </p>
              <div className="op-modal__field">
                <label>Комментарий (опционально)</label>
                <textarea
                  value={recommendComment}
                  onChange={(e) => setRecommendComment(e.target.value)}
                  placeholder="Почему вы рекомендуете этого автора?"
                  rows={3}
                />
              </div>
            </div>
            <div className="op-modal__footer">
              <button className="op-modal__cancel" onClick={() => setShowRecommendModal(false)}>
                Отмена
              </button>
              <button 
                className="op-modal__submit op-modal__submit--gold"
                onClick={handleRecommend}
                disabled={actionLoading}
              >
                {actionLoading ? "Отправка..." : "🏆 Рекомендовать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка спора */}
      {showDisputeModal && (
        <div className="op-modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="op-modal" onClick={(e) => e.stopPropagation()}>
            <div className="op-modal__header">
              <h3>⚠️ Открыть спор</h3>
              <button className="op-modal__close" onClick={() => setShowDisputeModal(false)}>×</button>
            </div>
            <div className="op-modal__body">
              <div className="op-modal__warning">
                Спор будет рассмотрен администрацией платформы. 
                Деньги будут заморожены до решения.
              </div>
              <div className="op-modal__field">
                <label>Причина спора *</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Опишите проблему подробно..."
                  rows={4}
                />
              </div>
            </div>
            <div className="op-modal__footer">
              <button className="op-modal__cancel" onClick={() => setShowDisputeModal(false)}>
                Отмена
              </button>
              <button 
                className="op-modal__submit op-modal__submit--danger"
                onClick={handleDispute}
                disabled={!disputeReason.trim() || actionLoading}
              >
                {actionLoading ? "Отправка..." : "Открыть спор"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка для просмотра изображения */}
      {showImageModal && (
        <div className="op-image-modal" onClick={() => setShowImageModal(null)}>
          <button className="op-image-modal__close">×</button>
          <img src={showImageModal} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
