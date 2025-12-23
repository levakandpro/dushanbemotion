// src/editorV2/components/InfoModals.jsx
import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import '../styles/info-modals.css'

const MODAL_TYPES = {
  FAQ: 'faq',
  POLICY: 'policy',
  PROJECTS: 'projects',
  SOON: 'soon',
  CONTACTS: 'contacts'
}

export function FAQModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div className="info-modal-backdrop" onClick={handleBackdropClick}>
      <div className="info-modal-content">
        <button className="info-modal-close" onClick={onClose}>×</button>
        <h2 className="info-modal-title">FAQ - About DMOTION</h2>
        <div className="info-modal-scroll">
          <div className="info-modal-section">
            <h3>Что такое DMOTION?</h3>
            <p>
              DMOTION - это платформа визуальных ассетов и вдохновения, созданная с упором на таджикско-персидскую культуру.
              Здесь вы работаете с фонами, шрифтами, стикерами, иконками и текстами, а также используете лёгкий Preview Playground для создания визуалов.
            </p>
            <p><strong>DMOTION не является видеоредактором.</strong></p>
          </div>

          <div className="info-modal-section">
            <h3>Есть ли сохранение проектов?</h3>
            <p><strong>Нет.</strong></p>
            <p>В версии v1.0 в DMOTION отсутствуют:</p>
            <ul>
              <li>проекты,</li>
              <li>сохранение,</li>
              <li>автосохранение,</li>
              <li>экспорт файлов.</li>
            </ul>
            <p>Фокус v1.0 - ассеты + предпросмотр + вдохновение.</p>
          </div>

          <div className="info-modal-section">
            <h3>Как делиться своими работами?</h3>
            <p>Через Showcase / Made with DMOTION.</p>
            <p>Вы публикуете:</p>
            <ul>
              <li>ссылку на YouTube Shorts / Instagram Reels / TikTok,</li>
              <li>обложку (кадр),</li>
              <li>описание.</li>
            </ul>
            <p>DMOTION не хранит видео и не загружает файлы пользователей.</p>
          </div>

          <div className="info-modal-section">
            <h3>Какие ассеты доступны бесплатно?</h3>
            <p>Free-пользователям доступна щедрая часть ассетов:</p>
            <ul>
              <li>шрифты,</li>
              <li>стикеры,</li>
              <li>фоны,</li>
              <li>иконки,</li>
              <li>футажи,</li>
              <li>QOFIYA.</li>
            </ul>
            <p>Premium открывает полный каталог и специальные curated-паки.</p>
          </div>

          <div className="info-modal-section">
            <h3>Что значит "Free for you"?</h3>
            <p>
              Если вы использовали ассет в период, когда он был бесплатным,
              этот ассет навсегда остаётся бесплатным для вас - даже если позже станет Premium.
            </p>
            <p><strong>Это основной принцип доверия DMOTION.</strong></p>
          </div>

          <div className="info-modal-section">
            <h3>Планы развития</h3>
            <ul>
              <li><strong>v1.0</strong> - ассет-библиотека + preview</li>
              <li><strong>v1.5</strong> - one-click инструменты</li>
              <li><strong>v2.0</strong> - лёгкий редактор для креаторов</li>
            </ul>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function PolicyModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div className="info-modal-backdrop" onClick={handleBackdropClick}>
      <div className="info-modal-content">
        <button className="info-modal-close" onClick={onClose}>×</button>
        <h2 className="info-modal-title">Policy - Terms, Privacy & Copyright</h2>
        <div className="info-modal-scroll">
          <div className="info-modal-section">
            <h3>Terms of Service</h3>
            <p>DMOTION предоставляет доступ к библиотеке визуальных ассетов и inspiration-платформе.</p>
            <p><strong>Разрешено:</strong></p>
            <ul>
              <li>использовать ассеты для личных и коммерческих проектов,</li>
              <li>публиковать результаты работ в соцсетях.</li>
            </ul>
            <p><strong>Запрещено:</strong></p>
            <ul>
              <li>перепродавать ассеты как файлы,</li>
              <li>выдавать ассеты за собственные,</li>
              <li>создавать конкурирующие библиотеки или сервисы.</li>
            </ul>
            <p>Showcase DMOTION работает только со ссылками. Платформа не хостит и не хранит видео пользователей.</p>
          </div>

          <div className="info-modal-section">
            <h3>Privacy Policy</h3>
            <p>Мы собираем только необходимые данные:</p>
            <ul>
              <li>email,</li>
              <li>данные авторизации,</li>
              <li>базовые действия внутри сервиса,</li>
              <li>техническую информацию (устройство, браузер).</li>
            </ul>
            <p><strong>Мы не собираем:</strong></p>
            <ul>
              <li>видео,</li>
              <li>файлы,</li>
              <li>платёжные данные напрямую.</li>
            </ul>
            <p><strong>Инфраструктура:</strong></p>
            <ul>
              <li>Supabase - авторизация и данные,</li>
              <li>Cloudflare - хранение и доставка ассетов.</li>
            </ul>
            <p>DMOTION не продаёт пользовательские данные.</p>
          </div>

          <div className="info-modal-section">
            <h3>Copyright & Credits</h3>
            <p>Все ассеты DMOTION являются интеллектуальной собственностью DMOTION или их авторов.</p>
            <p><strong>Разрешено использование ассетов:</strong></p>
            <ul>
              <li>в личных,</li>
              <li>коммерческих,</li>
              <li>социальных проектах.</li>
            </ul>
            <p>Указание авторства не требуется, если не указано иное.</p>
            <p>Часть материалов может основываться на сторонних источниках (например, Pixabay) и используется в рамках разрешённых лицензий.</p>
            <p>DMOTION не претендует на права пользователя на его контент.</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function ProjectsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div className="info-modal-backdrop" onClick={handleBackdropClick}>
      <div className="info-modal-content">
        <button className="info-modal-close" onClick={onClose}>×</button>
        <h2 className="info-modal-title">Projects - QOFIYA by D MOTION</h2>
        <div className="info-modal-scroll">
          <div className="info-modal-section">
            <h3>Что такое QOFIYA?</h3>
            <p>QOFIYA - это отдельный продукт от D MOTION.</p>
            <p>Curated система таджикско-персидских рифм, строк и коротких текстов, созданных специально для визуальных работ.</p>
          </div>

          <div className="info-modal-section">
            <h3>Для чего используется QOFIYA?</h3>
            <ul>
              <li>цитаты и каллиграфические карточки,</li>
              <li>культурные постеры,</li>
              <li>атмосферные визуалы,</li>
              <li>смысловые композиции.</li>
            </ul>
            <p>QOFIYA - это вкус и культура, а не генератор стихов.</p>
          </div>

          <div className="info-modal-section">
            <h3>Важно</h3>
            <ul>
              <li>не AI,</li>
              <li>не редактор поэзии,</li>
              <li>не случайный текст.</li>
            </ul>
            <p><strong>QOFIYA - ручная кураторская работа.</strong></p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function SoonModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div className="info-modal-backdrop" onClick={handleBackdropClick}>
      <div className="info-modal-content">
        <button className="info-modal-close" onClick={onClose}>×</button>
        <h2 className="info-modal-title">Coming Soon</h2>
        <div className="info-modal-scroll">
          <div className="info-modal-section">
            <h3>Что появится в следующих версиях DMOTION</h3>
            <ul>
              <li>Полноценный лёгкий редактор</li>
              <li>Видео-эффекты</li>
              <li>Анимации текста</li>
              <li>Экспорт видео и изображений</li>
              <li>Шаблоны</li>
              <li>One-click генераторы</li>
              <li>Расширенные инструменты QOFIYA</li>
              <li>Creator-инструменты</li>
            </ul>
          </div>

          <div className="info-modal-section">
            <h3>Платформы</h3>
            <p>DMOTION доступен:</p>
            <ul>
              <li>в Web-версии,</li>
              <li>в Google Play,</li>
              <li>в App Store.</li>
            </ul>
            <p>Мы развиваем продукт поэтапно, без спешки и компромиссов в качестве.</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function ContactsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    <div className="info-modal-backdrop" onClick={handleBackdropClick}>
      <div className="info-modal-content">
        <button className="info-modal-close" onClick={onClose}>×</button>
        <h2 className="info-modal-title">Contacts & Socials</h2>
        <div className="info-modal-scroll">
          <div className="info-modal-section">
            <h3>Email для связи:</h3>
            <p>
              <a href="mailto:levakandproduction@gmail.com" className="info-modal-link">
                📧 levakandproduction@gmail.com
              </a>
            </p>
          </div>

          <div className="info-modal-section">
            <h3>Социальные сети:</h3>
            <div className="info-modal-socials">
              {/* Здесь можно добавить ссылки на соцсети, если они есть */}
              <p>Следите за новостями и анонсами DMOTION в наших социальных сетях.</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

