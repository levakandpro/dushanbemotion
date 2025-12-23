// src/services/profileService.js
import { supabase } from "../lib/supabaseClient.ts";

/**
 * Получить профиль текущего пользователя
 */
export async function getMyProfile() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw authError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id, username, display_name, is_author, avatar_url, bio,
      social_instagram, social_telegram, social_youtube, social_tiktok,
      social_facebook, social_x, social_pinterest, social_whatsapp, social_gmail
    `)
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Проверить доступность username
 */
export async function checkUsernameAvailability(username, myId) {
  const normalized = (username || "").trim().toLowerCase();

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", normalized)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return { ok: true, status: "free" };
  }

  if (data.id === myId) {
    return { ok: true, status: "mine" };
  }

  return { ok: false, status: "taken" };
}

/**
 * Обновить профиль текущего пользователя
 */
export async function updateMyProfile(updates) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw authError;
  if (!user) throw new Error("Не авторизован");

  const updateData = {};
  
  if (updates.display_name !== undefined) {
    updateData.display_name = updates.display_name;
  }
  
  if (updates.username !== undefined) {
    updateData.username = updates.username.trim().toLowerCase();
  }

  // Соцсети
  const socialFields = [
    'social_instagram', 'social_telegram', 'social_youtube', 'social_tiktok',
    'social_facebook', 'social_x', 'social_pinterest', 'social_whatsapp', 'social_gmail'
  ];
  
  for (const field of socialFields) {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field]?.trim() || null;
    }
  }

  console.log('updateMyProfile - updates received:', updates);
  console.log('updateMyProfile - updateData to send:', updateData);

  if (Object.keys(updateData).length === 0) {
    console.log('updateMyProfile - no data to update');
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single();

  console.log('updateMyProfile - supabase response:', { data, error });

  if (error) throw error;
  return data;
}
