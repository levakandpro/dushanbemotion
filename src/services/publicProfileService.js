import { supabase } from "../lib/supabaseClient.ts";

/**
 * Публичный профиль по username
 */
export async function getPublicProfileByUsername(rawUsername) {
  const username = String(rawUsername || "").trim().toLowerCase();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/* =========================
   ПУБЛИЧНЫЕ ДАННЫЕ АВТОРА
   ========================= */

export async function getPublicAuthorWorks(authorId) {
  if (!authorId) return [];
  
  const { data, error } = await supabase
    .from('works')
    .select('*')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching author works:', error);
    return [];
  }
  return data || [];
}

export async function getPublicAuthorServices(authorId) {
  if (!authorId) return [];
  
  const { data, error } = await supabase
    .from('author_services')
    .select('*')
    .eq('author_id', authorId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching author services:', error);
    return [];
  }
  return data || [];
}

export async function getPublicAuthorCollections(authorId) {
  if (!authorId) return [];
  
  console.log('Fetching collections for authorId:', authorId);
  
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', authorId)
    .order('created_at', { ascending: false });
  
  console.log('Collections result:', { data, error });
  
  if (error) {
    console.error('Error fetching author collections:', error);
    return [];
  }
  return data || [];
}

export async function getPublicAuthorCollabs(authorId) {
  if (!authorId) return [];
  
  console.log('Fetching collabs for authorId:', authorId);
  
  const { data, error } = await supabase
    .from('collabs')
    .select('*')
    .or(`author1_id.eq.${authorId},author2_id.eq.${authorId}`)
    .in('status', ['active', 'pending'])
    .order('created_at', { ascending: false });
  
  console.log('Collabs result:', { data, error });
  
  if (error) {
    console.error('Error fetching author collabs:', error);
    return [];
  }
  
  if (!data || data.length === 0) return [];
  
  // Загружаем данные партнёров
  const partnerIds = new Set();
  data.forEach(c => {
    if (c.author1_id !== authorId) partnerIds.add(c.author1_id);
    if (c.author2_id !== authorId) partnerIds.add(c.author2_id);
  });
  
  let partnersMap = {};
  if (partnerIds.size > 0) {
    const { data: partners } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', Array.from(partnerIds));
    
    if (partners) {
      partnersMap = partners.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});
    }
  }
  
  // Добавляем данные партнёра к каждому коллабу
  return data.map(collab => {
    const partnerId = collab.author1_id === authorId ? collab.author2_id : collab.author1_id;
    const partner = partnersMap[partnerId];
    return {
      ...collab,
      partner_name: partner?.display_name || partner?.username || 'Партнёр',
      partner_avatar: partner?.avatar_url,
      partner_username: partner?.username
    };
  });
}

export async function getPublicRatingSummary(authorId) {
  // Таблица reviews пока не создана - возвращаем пустые данные
  return { rating: null, reviewsCount: 0 };
}

export async function getPublicReviews(authorId) {
  // Таблица reviews пока не создана - возвращаем пустой массив
  return [];
}

/**
 * ТОЛЬКО ПОЛУЧЕННЫЕ СТАТУСЫ
 */
export async function getPublicAchievements() {
  return [
    {
      key: "verified_author",
      title: "Проверенный автор",
      icon: "check",
      tone: "good",
    },
    {
      key: "master_d",
      title: "Мастер D",
      icon: "crown",
      tone: "gold",
    },
  ];
}
