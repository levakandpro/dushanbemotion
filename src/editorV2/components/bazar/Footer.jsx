import React, { useEffect, useRef, useState } from "react";
import { createPortal } from 'react-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import "./BazarUI.css";

import yt from "./assets/youtube.svg";
import vk from "./assets/vk.svg";
import tg from "./assets/tg.svg";
import inst from "./assets/inst.svg";
import gmail from "./assets/gmail.svg";

const pdfWorker = new Worker(
  new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
  { type: 'module' }
)
pdfjs.GlobalWorkerOptions.workerPort = pdfWorker

export default function Footer() {
  const [infoModal, setInfoModal] = useState(null)
  const [showPresentation, setShowPresentation] = useState(false)

  const presentationUrl = `${import.meta.env.BASE_URL || '/'}presentation/d-motion-presentation.pdf`

  const pdfWrapRef = useRef(null)
  const [pdfWrapWidth, setPdfWrapWidth] = useState(0)
  const [pdfNumPages, setPdfNumPages] = useState(null)

  useEffect(() => {
    if (!showPresentation) return
    const el = pdfWrapRef.current
    if (!el) return

    const ro = new ResizeObserver(() => {
      setPdfWrapWidth(el.clientWidth || 0)
    })

    ro.observe(el)
    setPdfWrapWidth(el.clientWidth || 0)

    return () => ro.disconnect()
  }, [showPresentation])

  return (
    <>
      <footer className="bz-footer">
        <div className="bz-footer__inner">

        {/* LEFT */}
        <div className="bz-footer__left">
          <button
            className="bz-footer__brand"
            type="button"
            onClick={() => setInfoModal('about')}
            style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, textAlign: 'left' }}
          >
            D MOTION • BAZAR
          </button>
          <div className="bz-footer__desc">
            Креативный рынок цифрового Таджикистана
          </div>
          <div className="bz-footer__copy">© 2025 D MOTION</div>
        </div>

        {/* CENTER */}
        <nav className="bz-footer__center">
          <button className="bz-footer__link" type="button" onClick={() => setInfoModal('rules')}>Правила</button>
          <button className="bz-footer__link" type="button" onClick={() => setInfoModal('safe')}>Безопасная сделка</button>
          <button className="bz-footer__link" type="button" onClick={() => setInfoModal('fees')}>Комиссия и оплата</button>
          <button className="bz-footer__link" type="button" onClick={() => setInfoModal('support')}>Поддержка</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="bz-footer__link" type="button" onClick={() => setInfoModal('about')}>О платформе</button>
            <button
              className="bz-footer__link"
              type="button"
              onClick={() => setShowPresentation(true)}
              aria-label="English presentation"
              title="ENG presentation"
              style={{
                padding: '3px 8px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(0,0,0,0.18)',
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                opacity: 0.9,
              }}
            >
              ENG
            </button>
          </div>
        </nav>

        {/* RIGHT */}
        <div className="bz-footer__right">
          <div className="bz-footer__help">Нужна помощь? Мы на связи</div>

          <a
            className="bz-footer__mailIcon"
            href="mailto:levakandproduction@gmail.com"
            aria-label="Email"
          >
            <img src={gmail} alt="Email" />
          </a>

          <div className="bz-footer__icons">
            <a href="https://t.me/dmotiontj" target="_blank" rel="noreferrer">
              <img src={tg} alt="Telegram" />
            </a>
            <a href="https://www.instagram.com/dushanbemotion/" target="_blank" rel="noreferrer">
              <img src={inst} alt="Instagram" />
            </a>
            <a href="https://www.youtube.com/@dushanbemotion" target="_blank" rel="noreferrer">
              <img src={yt} alt="YouTube" />
            </a>
            <a href="https://vk.com/dmotion" target="_blank" rel="noreferrer">
              <img src={vk} alt="VK" />
            </a>
          </div>

          <div className="bz-footer__lang">RU · TJ · EN</div>
        </div>

        </div>
      </footer>

      {infoModal &&
        createPortal(
          <div className="bz-modal-backdrop" onClick={() => setInfoModal(null)}>
            <div className="bz-modal bz-modal--info" onClick={(e) => e.stopPropagation()}>
              <button className="bz-modal__close" onClick={() => setInfoModal(null)} type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <div className="bz-modal__body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10, paddingRight: 44 }}>
                  <h2 className="bz-modal__title" style={{ margin: 0 }}>
                    {infoModal === 'rules' && 'Правила D MOTION'}
                    {infoModal === 'safe' && 'Безопасная сделка'}
                    {infoModal === 'fees' && 'Комиссия и оплата'}
                    {infoModal === 'support' && 'Поддержка'}
                    {infoModal === 'about' && 'О платформе D MOTION'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowPresentation(true)}
                    aria-label="English presentation"
                    title="ENG presentation"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'rgba(0,0,0,0.18)',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,.9)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    ENG
                  </button>
                </div>
                <div className="bz-info-content">
                  {infoModal === 'rules' && (
                    <>
                      <p>
                        D MOTION - это платформа с едиными правилами для всех участников. Используя сервис, пользователи и авторы обязуются соблюдать условия размещения контента, взаимодействия с клиентами и использования инструментов платформы.
                      </p>
                      <p>Запрещены:</p>
                      <ul>
                        <li>обход платформы и прямые сделки вне D MOTION</li>
                        <li>передача контактов для оплаты вне сервиса</li>
                        <li>нарушение авторских прав и публикация чужого контента</li>
                      </ul>
                      <p>
                        Платформа оставляет за собой право применять ограничения и санкции при нарушении правил.
                      </p>
                    </>
                  )}

                  {infoModal === 'safe' && (
                    <>
                      <p>Все сделки в D MOTION проходят через систему Безопасной сделки.</p>
                      <ul>
                        <li>оплата резервируется внутри платформы</li>
                        <li>автор приступает к работе только после подтверждения оплаты</li>
                        <li>средства передаются автору после выполнения заказа</li>
                        <li>споры решаются через поддержку платформы</li>
                      </ul>
                      <p>
                        Это защищает и клиента, и автора от мошенничества и недобросовестных действий.
                      </p>
                    </>
                  )}

                  {infoModal === 'fees' && (
                    <>
                      <p>D MOTION взимает комиссию 30% с каждой завершённой сделки.</p>
                      <p>Комиссия включает:</p>
                      <ul>
                        <li>использование редактора и контентной библиотеки</li>
                        <li>работу платформы и инфраструктуры</li>
                        <li>систему безопасной сделки</li>
                        <li>техническую и пользовательскую поддержку</li>
                      </ul>
                      <p>Выплаты авторам производятся ежемесячно.</p>
                      <p>
                        Все операции и удержания отображаются в личном кабинете в виде подробных отчётов.
                      </p>
                    </>
                  )}

                  {infoModal === 'support' && (
                    <>
                      <p>В D MOTION работает живая техническая поддержка.</p>
                      <ul>
                        <li>без автоматических ботов</li>
                        <li>прямое общение с командой платформы</li>
                        <li>помощь по заказам, оплатам и функционалу</li>
                      </ul>
                      <p>
                        Поддержка ориентирована на быстрое и честное решение реальных задач пользователей.
                      </p>
                    </>
                  )}

                  {infoModal === 'about' && (
                    <>
                      <p>
                        D MOTION (Dushanbe Motion) - это веб-платформа и онлайн-редактор для создания визуального контента прямо в браузере.
                      </p>
                      <p>Платформа объединяет:</p>
                      <ul>
                        <li>профессиональный canvas-редактор</li>
                        <li>крупную библиотеку авторского контента</li>
                        <li>витрину креаторов и услуг</li>
                        <li>систему коллабораций и достижений</li>
                        <li>внутреннюю валюту D Coin</li>
                        <li>прозрачную экономику и выплаты авторам</li>
                      </ul>
                      <p>
                        D MOTION создана для дизайнеров, креаторов, студий и брендов, которые ценят качество, культурную идентичность и полный контроль над своим творчеством.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {showPresentation &&
        createPortal(
          <div className="bz-modal-backdrop" onClick={() => setShowPresentation(false)}>
            <div className="bz-modal bz-modal--large" onClick={(e) => e.stopPropagation()}>
              <button className="bz-modal__close" onClick={() => setShowPresentation(false)} type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <div className="bz-modal__body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10, paddingRight: 44 }}>
                  <h2 className="bz-modal__title" style={{ margin: 0 }}>D MOTION - Presentation (ENG)</h2>
                  <a
                    href={presentationUrl}
                    download
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(0,0,0,0.18)',
                      color: 'rgba(255,255,255,.9)',
                      textDecoration: 'none',
                      fontSize: 12,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Скачать PDF
                  </a>
                </div>

                <div
                  ref={pdfWrapRef}
                  className="bz-pdfScroll dm-scroll"
                  style={{ marginTop: 10, height: '70vh', borderRadius: 12, overflow: 'auto', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <Document
                    file={presentationUrl}
                    onLoadSuccess={({ numPages }) => setPdfNumPages(numPages)}
                    loading={<div style={{ padding: 14, color: 'rgba(255,255,255,.7)' }}>Загрузка…</div>}
                    error={<div style={{ padding: 14, color: 'rgba(255,255,255,.7)' }}>Не удалось загрузить PDF</div>}
                  >
                    {Array.from(new Array(pdfNumPages || 0), (_, idx) => (
                      <div key={idx + 1} className="bz-pdfPage">
                        <Page
                          pageNumber={idx + 1}
                          width={Math.max(320, (pdfWrapWidth || 0) - 28)}
                          renderAnnotationLayer={false}
                          renderTextLayer={false}
                          loading={<div style={{ padding: 14, color: 'rgba(255,255,255,.7)' }}>Загрузка…</div>}
                        />
                      </div>
                    ))}
                  </Document>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
