import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import "./PublicProfile.css";

import defaultAva from "../../../editorV2/components/bazar/assets/ava.png";
import verifIcon from "../../../editorV2/components/bazar/assets/prof/verif.png";
import sockiIcon from "../../../editorV2/components/bazar/assets/socki.png";
import { getFreeCoversList, getPremiumCoversList, readLocalCoverFile } from "../../../services/coverService";
import AuthModal from "../../../editorV2/splash/AuthModal";
import { PromoModal, usePromoModal } from "../../../components/PromoModal";

// Извлечь YouTube video ID из URL
function extractYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const SocialIcons = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
  ),
  pinterest: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  ),
  gmail: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
  ),
};

const SOCIAL_CONFIG = [
  { key: 'social_instagram', icon: 'instagram', label: 'Instagram', color: '#E4405F' },
  { key: 'social_telegram', icon: 'telegram', label: 'Telegram', color: '#26A5E4' },
  { key: 'social_youtube', icon: 'youtube', label: 'YouTube', color: '#FF0000' },
  { key: 'social_tiktok', icon: 'tiktok', label: 'TikTok', color: '#fff' },
  { key: 'social_facebook', icon: 'facebook', label: 'Facebook', color: '#1877F2' },
  { key: 'social_x', icon: 'x', label: 'X', color: '#fff' },
  { key: 'social_pinterest', icon: 'pinterest', label: 'Pinterest', color: '#BD081C' },
  { key: 'social_whatsapp', icon: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
  { key: 'social_gmail', icon: 'gmail', label: 'Email', color: '#EA4335' },
];

import {
  getPublicProfileByUsername,
  getPublicAuthorWorks,
  getPublicAuthorServices,
  getPublicAuthorCollections,
  getPublicAuthorCollabs,
  getPublicRatingSummary,
  getPublicReviews,
  getPublicAchievements,
} from "../../../services/publicProfileService";
import {
  getFollowersCount,
  isFollowing,
  followAuthor,
  unfollowAuthor,
} from "../../../services/followService";
import { supabase } from "../../../lib/supabaseClient.ts";
import { toggleCollectionPinned, getPinnedCollectionsCount } from "../../../services/collectionService";

export default function PublicProfile() {
  const { username } = useParams();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const [works, setWorks] = useState([]);
  const [services, setServices] = useState([]);
  const [collections, setCollections] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  
  // Промо-окно акции
  const { isOpen: isPromoOpen, showPromo, closePromo, showOnMount } = usePromoModal();
  
  // Показ промо при входе на страницу автора
  useEffect(() => {
    showOnMount();
  }, [showOnMount]);

  // Подписки
  const [followers, setFollowers] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [viewerId, setViewerId] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // ✅ теперь это ТАБ (а не scroll-spy)
  const [activeSection, setActiveSection] = useState("works");
  
  // Соцсети открыты/закрыты
  const [socialsOpen, setSocialsOpen] = useState(false);
  
  // Меню выбора фона
  const [coverMenuOpen, setCoverMenuOpen] = useState(false);
  
  // Модалка просмотра коллекции
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionItems, setCollectionItems] = useState([]);
  
  // Модалка просмотра коллаба
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [collabMaterials, setCollabMaterials] = useState([]);
  
  // Полноэкранный просмотр фото
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [coverPickerType, setCoverPickerType] = useState(null); // 'free' | 'premium'
  const [coversList, setCoversList] = useState([]);
  const [selectedCover, setSelectedCover] = useState(null);
  const coverInputRef = useRef(null);
  const collabMaterialInputRef = useRef(null);
  const [uploadingCollabMaterial, setUploadingCollabMaterial] = useState(false);
  
  // Модалка подписки для закрепления
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalType, setSubscriptionModalType] = useState('collections'); // 'collections' | 'video'

  // anchors (оставляю как есть, но больше не используем для скролла)
  const refWorks = useRef(null);
  const refServices = useRef(null);
  const refCollections = useRef(null);
  const refCollabs = useRef(null);
  const refReviews = useRef(null);

  const isAuthor = !!profile?.is_author;
  const isOwner = viewerId && profile?.id && viewerId === profile.id;

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const p = await getPublicProfileByUsername(username);
        if (!alive) return;

        if (!p) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(p);

        // Получаем текущего пользователя
        const { data: { user } } = await supabase.auth.getUser();
        const currentViewerId = user?.id || null;
        setViewerId(currentViewerId);

        // Загружаем данные параллельно
        const [w, s, c, co, r, rs, ach, followersCount, isFollowingAuthor, ytVideos] = await Promise.all([
          getPublicAuthorWorks(p.id),
          getPublicAuthorServices(p.id),
          getPublicAuthorCollections(p.id),
          getPublicAuthorCollabs(p.id),
          getPublicReviews(p.id),
          getPublicRatingSummary(p.id),
          getPublicAchievements(p.id),
          getFollowersCount(p.id),
          currentViewerId ? isFollowing(p.id, currentViewerId) : Promise.resolve(false),
          supabase.from('youtube_videos').select('*').eq('user_id', p.id).order('created_at', { ascending: false }),
        ]);

        if (!alive) return;

        console.log('Loaded data:', { works: w, services: s, collections: c, collabs: co });
        setWorks(w || []);
        setServices(s || []);
        setCollabs(co || []);
        setReviews(r || []);
        setRating(rs?.rating ?? null);
        setAchievements(ach || []);
        setFollowers(followersCount);
        setSubscribed(isFollowingAuthor);
        setYoutubeVideos(ytVideos?.data || []);
        
        // Загружаем обложки для коллекций
        const collectionsWithCovers = await Promise.all(
          (c || []).map(async (col) => {
            // Получаем первый элемент коллекции для обложки
            const { data: items } = await supabase
              .from('collection_items')
              .select('asset_id, asset_type')
              .eq('collection_id', col.id)
              .limit(1);
            
            if (items && items.length > 0) {
              const item = items[0];
              if (item.asset_type === 'background') {
                return { ...col, cover_url: item.asset_id };
              } else if (item.asset_type === 'work') {
                const { data: work } = await supabase
                  .from('works')
                  .select('thumbnail_url, media_url')
                  .eq('id', item.asset_id)
                  .single();
                if (work) {
                  return { ...col, cover_url: work.thumbnail_url || work.media_url };
                }
              }
            }
            return col;
          })
        );
        
        // Сортируем: D COLLECTION первая, затем закреплённые (is_pinned), затем остальные
        const sortedCollections = collectionsWithCovers.sort((a, b) => {
          // D COLLECTION всегда первая
          if (a.title === 'D COLLECTION') return -1;
          if (b.title === 'D COLLECTION') return 1;
          // Закреплённые выше незакреплённых
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          // По дате обновления
          return new Date(b.updated_at) - new Date(a.updated_at);
        });
        
        setCollections(sortedCollections);
        
        // Загружаем сохранённый фон из профиля
        if (p.cover_url) {
          setSelectedCover(p.cover_url);
        }
      } catch (e) {
        console.error(e);
        setProfile(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => (alive = false);
  }, [username]);

  // ❌ scroll-spy УБРАЛИ - он мешает табам
  // (иначе при любом скролле activeSection будет перескакивать)

  // Загрузка элементов коллекции
  const openCollection = async (collection) => {
    setSelectedCollection(collection);
    try {
      // Получаем элементы коллекции
      const { data: items } = await supabase
        .from('collection_items')
        .select('asset_id, asset_type')
        .eq('collection_id', collection.id);
      
      console.log('Collection items:', items);
      
      if (!items || items.length === 0) {
        setCollectionItems([]);
        return;
      }
      
      // UUID паттерн для проверки
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // Разделяем по типам
      const workItems = items.filter(item => item.asset_type === 'work' && uuidPattern.test(item.asset_id));
      const backgroundItems = items.filter(item => item.asset_type === 'background');
      
      console.log('Work items:', workItems.length, 'Background items:', backgroundItems.length);
      
      let result = [];
      
      // Загружаем работы из таблицы works
      if (workItems.length > 0) {
        const workIds = workItems.map(item => item.asset_id);
        const { data: works, error } = await supabase
          .from('works')
          .select('id, title, thumbnail_url, media_url')
          .in('id', workIds);
        console.log('Loaded works:', works, 'Error:', error);
        if (works) {
          result = [...result, ...works];
        }
      }
      
      // Для background - asset_id это URL картинки
      if (backgroundItems.length > 0) {
        const bgItems = backgroundItems.map((item, idx) => ({
          id: `bg-${idx}`,
          title: 'Фон',
          thumbnail_url: item.asset_id,
          media_url: item.asset_id
        }));
        result = [...result, ...bgItems];
      }
      
      console.log('Final result:', result);
      setCollectionItems(result);
    } catch (err) {
      console.error('Error loading collection items:', err);
      setCollectionItems([]);
    }
  };

  // Открыть коллаб и загрузить материалы
  const openCollab = async (collab) => {
    console.log('Opening collab:', collab);
    setSelectedCollab(collab);
    setCollabMaterials([]);
    
    try {
      // Загружаем материалы коллаба (если таблица существует)
      const { data: materials, error } = await supabase
        .from('collab_materials')
        .select('*')
        .eq('collab_id', collab.id)
        .order('created_at', { ascending: false });
      
      console.log('Loaded collab materials:', { materials, error });
      console.log('Materials details:', JSON.stringify(materials, null, 2));
      
      if (error) {
        // Таблица может не существовать - это нормально
        console.log('Collab materials not available:', error.message);
        return;
      }
      
      // Показываем ВСЕ материалы
      console.log('Setting materials count:', materials?.length);
      setCollabMaterials(materials || []);
    } catch (err) {
      console.error('Error loading collab materials:', err);
      setCollabMaterials([]);
    }
  };

  // Загрузить материал в коллаб
  const handleUploadCollabMaterial = async (file) => {
    if (!file || !selectedCollab || !viewerId) return;
    
    setUploadingCollabMaterial(true);
    
    try {
      // Загружаем файл в storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${viewerId}/${selectedCollab.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('collab-materials')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Попробуем в другой bucket
        const { error: uploadError2 } = await supabase.storage
          .from('works')
          .upload(`collabs/${fileName}`, file);
        
        if (uploadError2) {
          alert('Ошибка загрузки файла');
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('works')
          .getPublicUrl(`collabs/${fileName}`);
        
        // Сохраняем в collab_materials
        const { error: insertError } = await supabase
          .from('collab_materials')
          .insert({
            collab_id: selectedCollab.id,
            owner_id: viewerId,
            title: file.name.split('.')[0] || 'Материал',
            preview_url: publicUrl,
            status: 'approved' // Для простоты сразу approved
          });
        
        if (insertError) {
          console.error('Insert error:', insertError);
          alert('Ошибка сохранения материала');
          return;
        }
        
        // Перезагружаем материалы
        openCollab(selectedCollab);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('collab-materials')
        .getPublicUrl(fileName);
      
      // Сохраняем в collab_materials
      const { error: insertError } = await supabase
        .from('collab_materials')
        .insert({
          collab_id: selectedCollab.id,
          owner_id: viewerId,
          title: file.name.split('.')[0] || 'Материал',
          preview_url: publicUrl,
          status: 'approved'
        });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        alert('Ошибка сохранения материала');
        return;
      }
      
      // Перезагружаем материалы
      openCollab(selectedCollab);
    } catch (err) {
      console.error('Error uploading collab material:', err);
      alert('Ошибка загрузки');
    } finally {
      setUploadingCollabMaterial(false);
    }
  };

  // Открыть фото на весь экран
  const openViewer = (index) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  // Навигация по фото (бесконечно по кругу)
  const goNext = () => {
    setViewerIndex((prev) => (prev + 1) % collectionItems.length);
  };

  const goPrev = () => {
    setViewerIndex((prev) => (prev - 1 + collectionItems.length) % collectionItems.length);
  };

  // Закрепить/открепить коллекцию
  const handleToggleCollectionPinned = async (col) => {
    if (!isOwner) return;
    if (col.title === 'D COLLECTION') return; // D COLLECTION нельзя закреплять
    
    try {
      // Если хотим закрепить - проверяем лимит
      if (!col.is_pinned) {
        const pinnedCount = await getPinnedCollectionsCount(profile.id);
        if (pinnedCount >= 3) {
          setSubscriptionModalType('collections');
          setShowSubscriptionModal(true);
          return;
        }
      }
      
      await toggleCollectionPinned(col.id, !col.is_pinned);
      
      // Обновляем локальный state
      setCollections(prev => {
        const updated = prev.map(c => 
          c.id === col.id ? { ...c, is_pinned: !c.is_pinned } : c
        );
        // Пересортируем
        return updated.sort((a, b) => {
          if (a.title === 'D COLLECTION') return -1;
          if (b.title === 'D COLLECTION') return 1;
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.updated_at) - new Date(a.updated_at);
        });
      });
    } catch (error) {
      console.error('Error toggling collection pinned:', error);
    }
  };

  // Закрепить/открепить видео
  const handleToggleVideoPinned = async (video) => {
    if (!isOwner) return;
    
    try {
      // Если хотим закрепить - проверяем лимит (1 видео)
      if (!video.is_pinned) {
        const pinnedVideos = youtubeVideos.filter(v => v.is_pinned);
        if (pinnedVideos.length >= 1) {
          setSubscriptionModalType('video');
          setShowSubscriptionModal(true);
          return;
        }
      }
      
      await supabase
        .from('youtube_videos')
        .update({ is_pinned: !video.is_pinned })
        .eq('id', video.id);
      
      // Обновляем локальный state и сортируем
      setYoutubeVideos(prev => {
        const updated = prev.map(v => 
          v.id === video.id ? { ...v, is_pinned: !v.is_pinned } : v
        );
        // Закреплённые первыми
        return updated.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
      });
    } catch (error) {
      console.error('Error toggling video pinned:', error);
    }
  };

  // Обработчик клавиш
  useEffect(() => {
    if (!viewerOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        goPrev();
      } else if (e.key === 'Escape') {
        setViewerOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerOpen, collectionItems.length]);

  const displayName = profile?.display_name || profile?.username;
  const hasMasterD = achievements.some((a) => a.key === "master_d");

  if (loading) {
    return (
      <div className="pp-wrap">
        <div className="pp-shell">
          {/* LEFT COLUMN - Skeleton */}
          <div className="pp-left">
            <div className="pp-skeleton-wrap">
              {/* Hero skeleton */}
              <div className="pp-skeleton pp-skeleton-hero"></div>
              
              {/* Avatar skeleton */}
              <div className="pp-skeleton pp-skeleton-avatar"></div>
              
              {/* Name skeleton */}
              <div className="pp-skeleton pp-skeleton-name"></div>
              <div className="pp-skeleton pp-skeleton-username"></div>
              
              {/* Tabs skeleton */}
              <div className="pp-skeleton-tabs">
                <div className="pp-skeleton pp-skeleton-tab"></div>
                <div className="pp-skeleton pp-skeleton-tab"></div>
                <div className="pp-skeleton pp-skeleton-tab"></div>
                <div className="pp-skeleton pp-skeleton-tab"></div>
                <div className="pp-skeleton pp-skeleton-tab"></div>
              </div>
              
              {/* YouTube skeleton */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div className="pp-skeleton" style={{ width: '160px', height: '90px', borderRadius: '8px' }}></div>
                <div className="pp-skeleton" style={{ width: '160px', height: '90px', borderRadius: '8px' }}></div>
                <div className="pp-skeleton" style={{ width: '160px', height: '90px', borderRadius: '8px' }}></div>
              </div>
            </div>
          </div>
          
          {/* RIGHT COLUMN - Skeleton */}
          <div className="pp-right">
            <div className="pp-skeleton-wrap">
              {/* Section title skeleton */}
              <div className="pp-skeleton" style={{ width: '120px', height: '28px', marginBottom: '16px' }}></div>
              
              {/* Grid skeleton */}
              <div className="pp-skeleton-grid">
                <div className="pp-skeleton pp-skeleton-card"></div>
                <div className="pp-skeleton pp-skeleton-card"></div>
                <div className="pp-skeleton pp-skeleton-card"></div>
                <div className="pp-skeleton pp-skeleton-card"></div>
                <div className="pp-skeleton pp-skeleton-card"></div>
                <div className="pp-skeleton pp-skeleton-card"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pp-wrap">
        <div className="pp-shell">
          <div className="pp-notfound">
            <div className="pp-notfound__title">Пользователь не найден</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-wrap">
      <div className="pp-shell">
        {/* LEFT COLUMN */}
        <div className="pp-left">
          {/* HERO с обложкой - защита от сохранения */}
          <div className="pp-hero" onContextMenu={(e) => e.preventDefault()}>
            {/* Область для обложки */}
            <div 
              className="pp-hero__cover"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              {selectedCover ? (
                (selectedCover.endsWith('.mp4') || selectedCover.endsWith('.webm')) ? (
                  <video 
                    src={selectedCover} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="pp-hero__cover-video"
                    onContextMenu={(e) => e.preventDefault()}
                    controlsList="nodownload"
                  />
                ) : (
                  <img 
                    src={selectedCover}
                    alt=""
                    className="pp-hero__cover-img"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />
                )
              ) : (
                <div className="pp-hero__cover-placeholder">
                  {isOwner && (
                    <>
                      <div className="pp-hero__cover-placeholder-arrow-wrap">
                        <svg className="pp-hero__cover-placeholder-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                      </div>
                      <span className="pp-hero__cover-placeholder-text">Выберите фон</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Скрытый input для загрузки файла */}
            <input 
              type="file" 
              ref={coverInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && viewerId) {
                  // Показываем превью сразу
                  const dataUrl = await readLocalCoverFile(file);
                  setSelectedCover(dataUrl);
                  
                  // Загружаем в R2
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('userId', viewerId);
                    // Передаём старый URL для удаления
                    if (profile?.cover_url) {
                      formData.append('oldUrl', profile.cover_url);
                    }
                    
                    const res = await fetch('https://stickers-manifest.natopchane.workers.dev/api/covers/upload', {
                      method: 'POST',
                      body: formData
                    });
                    
                    if (res.ok) {
                      const data = await res.json();
                      if (data.url) {
                        setSelectedCover(data.url);
                        // Сохраняем в БД
                        await supabase.from('profiles').update({ cover_url: data.url }).eq('id', viewerId);
                      }
                    }
                  } catch (err) {
                    console.error('Upload error:', err);
                  }
                }
                e.target.value = '';
              }}
            />

            {/* Кнопка смены обоев с меню - только для владельца */}
            {isOwner && <div className="pp-cover-wrap">
              <button 
                className={`pp-cover-btn ${coverMenuOpen ? 'is-open' : ''}`}
                onClick={() => setCoverMenuOpen(!coverMenuOpen)}
                data-tooltip="Сменить обложку"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                </svg>
              </button>
              
              <div className={`pp-cover-menu ${coverMenuOpen ? 'is-open' : ''}`}>
                <button className="pp-cover-menu__item" onClick={() => { 
                  setCoverMenuOpen(false); 
                  coverInputRef.current?.click();
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Загрузить
                </button>
                <button className="pp-cover-menu__item" onClick={async () => { 
                  setCoverMenuOpen(false);
                  setCoverPickerType('free');
                  const covers = await getFreeCoversList();
                  // Перемешиваем при каждом открытии
                  const shuffled = [...covers].sort(() => Math.random() - 0.5);
                  setCoversList(shuffled);
                  setCoverPickerOpen(true);
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                  by D MOTION
                </button>
                <button className="pp-cover-menu__item pp-cover-menu__item--premium" onClick={async () => { 
                  setCoverMenuOpen(false);
                  setCoverPickerType('premium');
                  const covers = await getPremiumCoversList();
                  // Перемешиваем при каждом открытии
                  const shuffled = [...covers].sort(() => Math.random() - 0.5);
                  setCoversList(shuffled);
                  setCoverPickerOpen(true);
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  PREMIUM
                </button>
              </div>
            </div>}

            {/* Модальное окно выбора обложки */}
            {coverPickerOpen && (
              <div className="pp-cover-picker-overlay" onClick={() => setCoverPickerOpen(false)}>
                <div className="pp-cover-picker" onClick={(e) => e.stopPropagation()}>
                  <div className="pp-cover-picker__header">
                    <h3>{coverPickerType === 'premium' ? '⭐ PREMIUM видео-обложки' : 'Обложки D MOTION'}</h3>
                    <button className="pp-cover-picker__close" onClick={() => setCoverPickerOpen(false)}>×</button>
                  </div>
                  <div className="pp-cover-picker__grid">
                    {coversList.map((url, i) => {
                      const isVideo = url.endsWith('.mp4') || url.endsWith('.webm');
                      return (
                        <button 
                          key={i}
                          className="pp-cover-picker__item"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedCover(url);
                            setCoverPickerOpen(false);
                            // Сохраняем в БД
                            if (viewerId && profile?.id === viewerId) {
                              await supabase.from('profiles').update({ cover_url: url }).eq('id', viewerId);
                            }
                          }}
                        >
                          {isVideo ? (
                            <video src={url} muted loop autoPlay playsInline />
                          ) : (
                            <img src={url} alt="" loading="lazy" onError={(e) => e.target.parentElement.style.display = 'none'} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Кнопка соцсетей (правый верх) */}
            {isAuthor && SOCIAL_CONFIG.some(({ key }) => profile[key]?.trim()) && (
              <div className="pp-socials-wrap">
                <button 
                  className={`pp-socials-toggle ${socialsOpen ? 'is-open' : ''}`}
                  onClick={() => setSocialsOpen(!socialsOpen)}
                  data-tooltip="Соцсети"
                >
                  <img src={sockiIcon} alt="Соцсети" />
                </button>
                
                <div className={`pp-socials-bar ${socialsOpen ? 'is-open' : ''}`}>
                  {SOCIAL_CONFIG.map(({ key, icon, label, color }, index) => {
                    const url = profile[key];
                    if (!url || !url.trim()) return null;
                    return (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pp-social-link"
                        data-tooltip={label}
                        style={{ '--social-color': color, '--delay': `${index * 0.05}s` }}
                      >
                        {SocialIcons[icon]}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Инфо внизу компактно */}
            <div className="pp-hero__bottom">
              <div className="pp-ava">
                <img src={profile.avatar_url || defaultAva} alt="" />
              </div>

              <div className="pp-hero__meta">
                <div className="pp-titleRow">
                  <span className="pp-name">{displayName}</span>
                  {isAuthor && <img src={verifIcon} className="pp-verif" data-tooltip="Проверенный автор" alt="" />}
                  {isAuthor && <span className="pp-role">Автор</span>}
                  {isAuthor && hasMasterD && <span className="pp-rank">Мастер D</span>}
                </div>
                <div className="pp-username">@{profile.username}</div>
              </div>

              <div className="pp-hero__stats">
                <div className="pp-mini-stat">
                  <span className="pp-mini-stat__v">{rating ? `★${rating}` : "-"}</span>
                  <span className="pp-mini-stat__k">рейтинг</span>
                </div>
                <div className="pp-mini-stat">
                  <span className="pp-mini-stat__v">{followers}</span>
                  <span className="pp-mini-stat__k">подписчики</span>
                </div>
                {isAuthor && (!viewerId || viewerId !== profile.id) && (
                  <button
                    className={`pp-subscribe-btn ${subscribed ? "pp-subscribe-btn--subscribed" : ""}`}
                    disabled={followLoading}
                    onClick={async () => {
                      console.log('viewerId:', viewerId);
                      if (!viewerId) {
                        console.log('Opening auth modal');
                        setAuthModalOpen(true);
                        return;
                      }
                      setFollowLoading(true);
                      const wasSubscribed = subscribed;
                      const prevFollowers = followers;
                      try {
                        if (wasSubscribed) {
                          setSubscribed(false);
                          setFollowers(Math.max(0, prevFollowers - 1));
                          await unfollowAuthor(profile.id, viewerId);
                        } else {
                          setSubscribed(true);
                          setFollowers(prevFollowers + 1);
                          await followAuthor(profile.id, viewerId);
                        }
                        const actualCount = await getFollowersCount(profile.id);
                        setFollowers(actualCount);
                      } catch (err) {
                        console.error("Follow error:", err);
                        setSubscribed(wasSubscribed);
                        setFollowers(prevFollowers);
                      } finally {
                        setFollowLoading(false);
                      }
                    }}
                  >
                    {followLoading ? "..." : subscribed ? "Вы подписаны" : "Подписаться"}
                  </button>
                )}
                {/* Кнопка поделиться */}
                <button
                  className="pp-share-btn"
                  onClick={async () => {
                    const url = window.location.href;
                    try {
                      await navigator.clipboard.writeText(url);
                      // Показываем уведомление
                      const btn = document.querySelector('.pp-share-btn');
                      if (btn) {
                        btn.classList.add('pp-share-btn--copied');
                        setTimeout(() => btn.classList.remove('pp-share-btn--copied'), 2000);
                      }
                    } catch (err) {
                      console.error('Failed to copy:', err);
                    }
                  }}
                  data-tooltip="Скопировать ссылку"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  <span className="pp-share-btn__text">Поделиться</span>
                  <span className="pp-share-btn__copied">Скопировано!</span>
                </button>
              </div>
            </div>
          </div>

          {/* NAV - табы */}
          <div className="pp-nav">
            <button
              className={activeSection === "works" ? "is-active" : ""}
              onClick={() => setActiveSection("works")}
            >
              Работы
            </button>
            <button
              className={activeSection === "services" ? "is-active" : ""}
              onClick={() => setActiveSection("services")}
            >
              Услуги
            </button>
            <button
              className={activeSection === "collections" ? "is-active" : ""}
              onClick={() => setActiveSection("collections")}
            >
              Коллекции
            </button>
            <button
              className={activeSection === "collabs" ? "is-active" : ""}
              onClick={() => setActiveSection("collabs")}
            >
              Коллабы
            </button>
            <button
              className={activeSection === "reviews" ? "is-active" : ""}
              onClick={() => setActiveSection("reviews")}
            >
              Отзывы
            </button>
            
            {/* Кнопки навигации для авторов */}
            {isOwner && (
              <div className="pp-nav__author-links">
                <a href="/author" className="pp-nav__link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Кабинет
                </a>
                <a href="/bazar" className="pp-nav__link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  BAZAR
                </a>
                <a href="/editor" className="pp-nav__link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="14.5 2 18.5 6 7 17.5 3 17.5 3 13.5 14.5 2"/><line x1="14" y1="4" x2="18" y2="8"/>
                  </svg>
                  Редактор
                </a>
              </div>
            )}
          </div>

          {/* YouTube секция */}
          <div className="pp-youtube">
            <div className="pp-youtube__header">
              <h3>Видео</h3>
              {youtubeVideos.length > 0 && (
                <span className="pp-youtube__count">{youtubeVideos.length}/10</span>
              )}
            </div>
            <div 
              className="pp-youtube__scroll"
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                  e.preventDefault();
                }
              }}
            >
              {youtubeVideos.length === 0 ? (
                <div className="pp-youtube__placeholder">YouTube превью появятся здесь</div>
              ) : (
                youtubeVideos.map((video) => {
                  const videoId = extractYoutubeId(video.url);
                  if (!videoId) return null;
                  return (
                    <div key={video.id} className={`pp-youtube__item-wrap ${video.is_pinned ? 'pp-youtube__item-wrap--pinned' : ''}`}>
                      <a 
                        href={video.url} 
                        target="_blank" 
                      rel="noopener noreferrer"
                      className="pp-youtube__item"
                    >
                      <img 
                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
                        alt="YouTube video"
                      />
                      <div className="pp-youtube__play">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      {/* Бейдж закреплённого видео */}
                      {video.is_pinned && (
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          background: 'rgba(255, 200, 50, 0.9)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: '600',
                          color: '#000'
                        }}>
                          📌
                        </div>
                      )}
                    </a>
                      {isOwner && (
                        <>
                          {/* Кнопка закрепления */}
                          <button 
                            className="pp-youtube__pin"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleVideoPinned(video);
                            }}
                            data-tooltip={video.is_pinned ? 'Открепить' : 'Закрепить'}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '28px',
                              background: video.is_pinned ? 'rgba(255, 200, 50, 0.9)' : 'rgba(0, 0, 0, 0.6)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '22px',
                              height: '22px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: video.is_pinned ? '#000' : '#fff',
                              zIndex: 10
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill={video.is_pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                          </button>
                          {/* Кнопка удаления */}
                          <button 
                            className="pp-youtube__delete"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              await supabase.from('youtube_videos').delete().eq('id', video.id);
                              setYoutubeVideos(prev => prev.filter(v => v.id !== video.id));
                            }}
                            data-tooltip="Удалить видео"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="pp-right">
          {activeSection === "works" && (
            <section ref={refWorks} className="pp-section">
              <h2>Работы <span className="pp-section__count">{works.length}</span></h2>
              {works.length === 0 ? (
                <div className="pp-empty">
                  Работ пока нет - подпишитесь, чтобы не пропустить.
                </div>
              ) : (
                <div className="pp-grid">
                  {works.map((work) => (
                    <a 
                      key={work.id} 
                      href={`/work/${work.id}`} 
                      className="pp-card"
                    >
                      <div className="pp-card__img">
                        {work.preview_url ? (
                          <img src={work.preview_url} alt={work.title} />
                        ) : (
                          <div className="pp-card__placeholder">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21 15 16 10 5 21"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="pp-card__info">
                        <div className="pp-card__title">{work.title || 'Без названия'}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeSection === "services" && (
            <section ref={refServices} className="pp-section">
              <h2>Услуги <span className="pp-section__count">{services.length}</span></h2>
              {services.length === 0 ? (
                <div className="pp-empty">Услуги появятся позже.</div>
              ) : (
                <div className="pp-list">
                  {services.map((service) => (
                    <div 
                      key={service.id} 
                      className="pp-service"
                      onClick={() => window.location.href = `/service/${service.id}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="pp-service__info">
                        <div className="pp-service__title">{service.title}</div>
                        {service.description && (
                          <div className="pp-service__desc">{service.description}</div>
                        )}
                        {service.delivery_days && (
                          <div className="pp-service__delivery">
                            ⏱ {service.delivery_days} {service.delivery_days === 1 ? 'день' : service.delivery_days < 5 ? 'дня' : 'дней'}
                          </div>
                        )}
                      </div>
                      <div className="pp-service__right">
                        {service.price && (
                          <div className="pp-service__price">
                            {service.price.toLocaleString()} ₽
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeSection === "collections" && (
            <section ref={refCollections} className="pp-section">
              <h2>Коллекции <span className="pp-section__count">{collections.length}</span></h2>
              {collections.length === 0 ? (
                <div className="pp-empty">Коллекций пока нет.</div>
              ) : (
                <div className="pp-grid">
                  {collections.map((col) => {
                    const isDefaultCollection = col.title === 'D COLLECTION';
                    return (
                      <div 
                        key={col.id} 
                        className={`pp-card ${col.is_pinned ? 'pp-card--pinned' : ''}`}
                        onClick={() => openCollection(col)}
                        style={{ cursor: 'pointer', position: 'relative' }}
                      >
                        <div className="pp-card__img">
                          {col.cover_url ? (
                            <img src={col.cover_url} alt={col.title} />
                          ) : (
                            <div className="pp-card__placeholder">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                              </svg>
                            </div>
                          )}
                          {/* Кнопка закрепления для владельца */}
                          {isOwner && !isDefaultCollection && (
                            <button
                              className="pp-card__pin"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCollectionPinned(col);
                              }}
                              data-tooltip={col.is_pinned ? 'Открепить' : 'Закрепить'}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: col.is_pinned ? 'rgba(255, 200, 50, 0.9)' : 'rgba(0, 0, 0, 0.5)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                color: col.is_pinned ? '#000' : '#fff'
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={col.is_pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                            </button>
                          )}
                          {/* Бейдж закреплённой коллекции */}
                          {col.is_pinned && (
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              left: '8px',
                              background: 'rgba(255, 200, 50, 0.9)',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              fontWeight: '600',
                              color: '#000'
                            }}>
                              📌
                            </div>
                          )}
                        </div>
                        <div className="pp-card__info">
                          <div className="pp-card__title">{col.title || 'Без названия'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeSection === "collabs" && (
            <section ref={refCollabs} className="pp-section">
              <h2>Коллабы <span className="pp-section__count">{collabs.length}</span></h2>
              {collabs.length === 0 ? (
                <div className="pp-empty">Коллабов пока нет.</div>
              ) : (
                <div className="pp-collabs-grid">
                  {collabs.map((collab) => (
                    <div 
                      key={collab.id} 
                      className="pp-collab-card-v2"
                      onClick={() => openCollab(collab)}
                    >
                      <div className="pp-collab-card-v2__avatars">
                        <img src={profile?.avatar_url || defaultAva} alt="" className="pp-collab-card-v2__ava1" />
                        <div className="pp-collab-card-v2__x">×</div>
                        <img src={collab.partner_avatar || defaultAva} alt="" className="pp-collab-card-v2__ava2" />
                      </div>
                      <div className="pp-collab-card-v2__title">{collab.title || 'Коллаб'}</div>
                      <div className="pp-collab-card-v2__names">
                        {profile?.display_name || profile?.username} & {collab.partner_name}
                      </div>
                      <div className="pp-collab-card-v2__status" data-status={collab.status}>
                        {collab.status === 'active' ? '✓ Активен' : '⏳ Ожидает'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeSection === "reviews" && (
            <section ref={refReviews} className="pp-section">
              <h2>Отзывы <span className="pp-section__count">{reviews.length}</span></h2>
              {reviews.length === 0 ? (
                <div className="pp-empty">Пока нет отзывов.</div>
              ) : (
                <div className="pp-reviews">
                  {reviews.map((review) => (
                    <div key={review.id} className="pp-review">
                      <div className="pp-review__header">
                        <div className="pp-review__author">
                          <img 
                            src={review.reviewer?.avatar_url || defaultAva} 
                            alt="" 
                            className="pp-review__ava"
                          />
                          <span className="pp-review__name">
                            {review.reviewer?.display_name || review.reviewer?.username || 'Аноним'}
                          </span>
                        </div>
                        <div className="pp-review__rating">
                          {'★'.repeat(review.rating || 0)}{'☆'.repeat(5 - (review.rating || 0))}
                        </div>
                      </div>
                      {review.text && (
                        <div className="pp-review__text">{review.text}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Модальное окно авторизации */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          window.location.reload();
        }}
      />

      {/* Модальное окно просмотра коллекции */}
      {selectedCollection && (
        <div className="pp-collection-modal-overlay" onClick={() => setSelectedCollection(null)}>
          <div className="pp-collection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pp-collection-modal__header">
              <h3>{selectedCollection.title || 'Коллекция'}</h3>
              <button 
                className="pp-collection-modal__close" 
                onClick={() => setSelectedCollection(null)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="pp-collection-modal__body">
              {collectionItems.length === 0 ? (
                <div className="pp-empty">В этой коллекции пока нет работ.</div>
              ) : (
                <div className="pp-collection-modal__grid">
                  {collectionItems.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="pp-collection-item"
                      onClick={() => openViewer(index)}
                    >
                      {item.thumbnail_url || item.media_url ? (
                        <img 
                          src={item.thumbnail_url || item.media_url} 
                          alt={item.title || ''} 
                        />
                      ) : (
                        <div className="pp-collection-item__placeholder">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модалка просмотра коллаба */}
      {selectedCollab && (
        <div 
          className="pp-collection-modal-overlay"
          onClick={() => setSelectedCollab(null)}
        >
          <div 
            className="pp-collection-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pp-collection-modal__header">
              <div className="pp-collection-modal__title-wrap">
                <div className="pp-collab-modal__creators">
                  <div className="pp-collab-modal__avatars">
                    <img src={profile?.avatar_url || defaultAva} alt="" className="pp-collab-modal__ava1" />
                    <img src={selectedCollab.partner_avatar || defaultAva} alt="" className="pp-collab-modal__ava2" />
                  </div>
                  <div className="pp-collab-modal__info">
                    <h3 className="pp-collection-modal__title">{selectedCollab.title || 'Коллаб'}</h3>
                    <div className="pp-collab-modal__subtitle">
                      Коллаборация {profile?.display_name || profile?.username} × {selectedCollab.partner_name}
                    </div>
                  </div>
                </div>
              </div>
              <button 
                className="pp-collection-modal__close"
                onClick={() => setSelectedCollab(null)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="pp-collection-modal__body">
              {collabMaterials.length === 0 ? (
                <div className="pp-collab-empty">
                  <div className="pp-collab-empty__icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <p>В этом коллабе пока нет материалов</p>
                  <span className="pp-collab-empty__hint">Добавляйте материалы через редактор фонов</span>
                </div>
              ) : (
                <div className="pp-collection-modal__grid">
                  {collabMaterials.map((material, index) => (
                    <div 
                      key={material.id} 
                      className="pp-collection-item"
                      onClick={() => {
                        if (material.preview_url) {
                          setCollectionItems([{ 
                            id: material.id, 
                            thumbnail_url: material.preview_url, 
                            media_url: material.preview_url,
                            title: material.title 
                          }]);
                          openViewer(0);
                        }
                      }}
                    >
                      {material.preview_url ? (
                        <img 
                          src={material.preview_url} 
                          alt={material.title || ''} 
                        />
                      ) : (
                        <div className="pp-collection-item__placeholder">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </div>
                      )}
                      <div className="pp-collection-item__title">{material.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модалка подписки - лимит закреплений */}
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
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            
            <h2 style={{
              margin: '0 0 12px',
              fontSize: '22px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.95)'
            }}>
              {subscriptionModalType === 'collections' 
                ? 'Лимит закреплённых коллекций' 
                : 'Лимит закреплённых видео'}
            </h2>
            
            <p style={{
              margin: '0 0 24px',
              fontSize: '15px',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.6'
            }}>
              {subscriptionModalType === 'collections' 
                ? <>Вы можете закрепить до <strong style={{ color: 'rgba(255, 200, 50, 0.9)' }}>3 коллекций</strong> на своей странице.</>
                : <>Вы можете закрепить до <strong style={{ color: 'rgba(255, 200, 50, 0.9)' }}>1 видео</strong> на своей странице.</>
              }
              <br /><br />
              Оформите подписку D PRO, чтобы закреплять больше и получить доступ к премиум-функциям.
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
                  window.location.href = '/author/balance';
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

      {/* Полноэкранный просмотр фото */}
      {viewerOpen && collectionItems.length > 0 && (
        <div className="pp-viewer-overlay" onClick={() => setViewerOpen(false)}>
          <div className="pp-viewer" onClick={(e) => e.stopPropagation()}>
            <button className="pp-viewer__close" onClick={() => setViewerOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            
            <button className="pp-viewer__nav pp-viewer__nav--prev" onClick={goPrev}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            
            <div className="pp-viewer__img">
              <img 
                src={collectionItems[viewerIndex]?.media_url || collectionItems[viewerIndex]?.thumbnail_url} 
                alt={collectionItems[viewerIndex]?.title || ''} 
              />
            </div>
            
            <button className="pp-viewer__nav pp-viewer__nav--next" onClick={goNext}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            
            <div className="pp-viewer__counter">
              {viewerIndex + 1} / {collectionItems.length}
            </div>
          </div>
        </div>
      )}
      
      {/* Промо-окно акции PREMIUM */}
      <PromoModal isOpen={isPromoOpen} onClose={closePromo} />
    </div>
  );
}
