// src/services/followService.js
import { supabase } from "../lib/supabaseClient.ts";

/**
 * Получить количество подписчиков автора
 */
export async function getFollowersCount(authorId) {
  const { count, error } = await supabase
    .from("author_followers")
    .select("*", { count: "exact", head: true })
    .eq("author_id", authorId);

  if (error) throw error;
  return count || 0;
}

/**
 * Проверить, подписан ли пользователь на автора
 */
export async function isFollowing(authorId, viewerId) {
  if (!viewerId) return false;

  const { data, error } = await supabase
    .from("author_followers")
    .select("id")
    .eq("author_id", authorId)
    .eq("follower_id", viewerId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/**
 * Подписаться на автора
 */
export async function followAuthor(authorId, viewerId) {
  const { error } = await supabase
    .from("author_followers")
    .insert({ author_id: authorId, follower_id: viewerId });

  if (error) throw error;
}

/**
 * Отписаться от автора
 */
export async function unfollowAuthor(authorId, viewerId) {
  const { error } = await supabase
    .from("author_followers")
    .delete()
    .eq("author_id", authorId)
    .eq("follower_id", viewerId);

  if (error) throw error;
}
