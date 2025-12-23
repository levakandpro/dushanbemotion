import React, { useEffect } from "react";
import { BazarProvider } from "../../store/bazarStore";
import BazarHero from "../../components/bazar/BazarHero";
import BazarFeed from "../../components/bazar/BazarFeed";
import ReportPostModal from "../../modals/bazar/ReportPostModal";
import SharePostModal from "../../modals/bazar/SharePostModal";
import "../../components/bazar/Bazar.css";

export default function BazarScreen() {
  // Разрешаем прокрутку для страницы Bazar
  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    const root = document.getElementById('root');
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
    }
    
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (root) {
        root.style.overflow = '';
        root.style.height = '';
      }
    };
  }, []);
  const [reportPost, setReportPost] = React.useState(null);
  const [sharePost, setSharePost] = React.useState(null);
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  // Отслеживание прокрутки для кнопки "Наверх"
  useEffect(() => {
    function handleScroll() {
      const scrollThreshold = window.innerHeight * 1.5;
      setShowScrollTop(window.scrollY > scrollThreshold);
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleScrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleOpenVideo(post) {
    // Открываем внешнюю ссылку (YouTube, TikTok, Instagram Reels и т.д.)
    if (post.externalUrl) {
      window.open(post.externalUrl, '_blank', 'noopener,noreferrer');
    } else if (post.mediaUrl) {
      // Если нет внешней ссылки, открываем медиа напрямую
      window.open(post.mediaUrl, '_blank', 'noopener,noreferrer');
    }
  }

  function handleOpenProfile(username) {
    // редирект в профиль пользователя
    window.location.href = "/u/" + username;
  }

  function handleOpenComments(post) {
    console.log("open comments for", post.id);
  }

  function handleOpenShare(post) {
    setSharePost(post);
  }

  function handleOpenMoreMenu(post) {
    // сюда вынесем меню "Скрыть, Удалить, Закрепить, Пожаловаться" и т.д.
    setReportPost(post);
  }

  function handleSubmitReport(payload) {
    console.log("report submit", payload);
    setReportPost(null);
  }

  return (
    <BazarProvider>
      <div className="dm-bazar-page">
        <BazarHero />

        <BazarFeed
          onOpenVideo={handleOpenVideo}
          onOpenProfile={handleOpenProfile}
          onOpenComments={handleOpenComments}
          onOpenShare={handleOpenShare}
          onOpenMoreMenu={handleOpenMoreMenu}
        />

        <ReportPostModal
          open={!!reportPost}
          post={reportPost}
          onClose={() => setReportPost(null)}
          onSubmit={handleSubmitReport}
        />

        <SharePostModal
          open={!!sharePost}
          post={sharePost}
          onClose={() => setSharePost(null)}
        />

        {/* Кнопка "Наверх" */}
        <button
          type="button"
          className={`dm-bazar-scroll-top ${showScrollTop ? 'dm-bazar-scroll-top--visible' : ''}`}
          onClick={handleScrollToTop}
          title="Наверх"
          aria-label="Наверх"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </button>
      </div>
    </BazarProvider>
  );
}
