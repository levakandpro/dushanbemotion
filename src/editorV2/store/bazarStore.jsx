import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { getPublishedPosts } from "../../services/livePostService";
import { getUserProfile } from "../../services/userService";

const BazarContext = createContext(null);

export function BazarProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [filters, setFiltersState] = useState({
    sort: "new",
    category: "all"
  });
  const [isLoading, setIsLoading] = useState(false);

  // Загружаем посты из live_posts
  useEffect(() => {
    loadPosts();
  }, [filters.sort, filters.category]);

  async function loadPosts() {
    setIsLoading(true);
    try {
      const livePosts = await getPublishedPosts({
        category: filters.category !== 'all' ? filters.category : undefined,
        sort: filters.sort,
        limit: 50,
      });

      // Преобразуем live_posts в формат для BazarFeed
      const transformedPosts = await Promise.all(
        livePosts.map(async (livePost) => {
          // Загружаем профиль автора
          let authorProfile = null;
          try {
            authorProfile = await getUserProfile(livePost.author_id);
          } catch (error) {
            console.error('Error loading author profile:', error);
          }

          return {
            id: livePost.id,
            title: livePost.title,
            description: livePost.description || '',
            thumbnailUrl: livePost.thumbnail_url || livePost.media_url,
            mediaUrl: livePost.media_url,
            orientation: livePost.orientation,
            category: livePost.category,
            likesCount: livePost.likes_count || 0,
            commentsCount: livePost.comments_count || 0,
            viewsCount: livePost.views || 0,
            isLiked: false, // TODO: Проверить через live_post_likes
            isFavorite: false, // TODO: Проверить через live_post_favorites
            author: {
              id: livePost.author_id,
              username: authorProfile?.username || 'user',
              displayName: authorProfile?.display_name || 'User',
              avatarUrl: authorProfile?.avatar_url || null,
            },
            createdAt: livePost.created_at,
            externalUrl: livePost.external_url || null,
            usedAssets: livePost.used_assets || [],
          };
        })
      );

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }

  function setFilters(next) {
    setFiltersState(prev => ({ ...prev, ...next }));
  }

  async function likePost(postId) {
    // TODO: Реализовать через live_post_likes
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1
            }
          : p
      )
    );
  }

  async function toggleFavorite(postId) {
    // TODO: Реализовать через live_post_favorites
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );
  }

  const value = useMemo(
    () => ({
      posts,
      filters,
      isLoading,
      setFilters,
      likePost,
      toggleFavorite,
      reloadPosts: loadPosts,
    }),
    [posts, filters, isLoading]
  );

  return <BazarContext.Provider value={value}>{children}</BazarContext.Provider>;
}

export function useBazarStore() {
  const ctx = useContext(BazarContext);
  if (!ctx) {
    throw new Error("useBazarStore must be used inside <BazarProvider>");
  }
  return ctx;
}

