// src/stickers/worker/index.js

import {
  ALL_CATEGORY_DEFS,
  maleCategories,
  femaleCategories,
  DEFAULT_MALE_CATEGORY,
  DEFAULT_FEMALE_CATEGORY,
} from './registry';

// Cloudflare Worker (modules syntax)
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Обрабатываем OPTIONS (preflight) для всех путей
    if (request.method === 'OPTIONS') {
      console.log('✅ OPTIONS preflight request:', url.pathname);
      return new Response(null, { 
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    if (url.pathname === '/stickers/manifest') {
      try {
        const manifest = await buildManifest(env);
        return new Response(JSON.stringify(manifest), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=60',
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('❌ Error building stickers manifest:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to build manifest',
          message: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Avatars manifest endpoint
    if (url.pathname === '/avatars/manifest') {
      console.log('🎯 Avatars manifest endpoint called:', url.pathname, request.method, request.url);
      // Обрабатываем OPTIONS запрос для CORS preflight
      if (request.method === 'OPTIONS') {
        console.log('✅ OPTIONS request, returning CORS headers');
        return new Response(null, { 
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
          }
        });
      }
      console.log('✅ Calling handleAvatarsManifest');
      return handleAvatarsManifest(request, env, corsHeaders);
    }

    // Pexels Video API proxy
    if (url.pathname === '/api/footage/search') {
      return handleFootageSearch(request, env, corsHeaders);
    }

    // Pixabay Frames API proxy
    if (url.pathname === '/api/frames/search') {
      return handleFramesSearch(request, env, corsHeaders);
    }

    // Share projects API
    if (url.pathname.startsWith('/api/share')) {
      return handleShareProject(request, env, corsHeaders);
    }

    // Scenes API (backgrounds from R2)
    if (url.pathname === '/api/scenes') {
      console.log('🎨 Scenes API endpoint called:', url.pathname, url.search);
      return handleScenesList(request, env, corsHeaders);
    }

    // Covers API (profile covers from R2 oblojki bucket)
    if (url.pathname === '/api/covers') {
      console.log('🖼️ Covers API endpoint called:', url.pathname, url.search);
      return handleCoversList(request, env, corsHeaders);
    }

    // Upload cover to R2
    if (url.pathname === '/api/covers/upload' && request.method === 'POST') {
      console.log('📤 Cover upload endpoint called');
      return handleCoverUpload(request, env, corsHeaders);
    }

    // Upload payment screenshot to R2 (папка payments/YYYY-MM-DD/)
    if (url.pathname === '/api/payments/upload' && request.method === 'POST') {
      console.log('💳 Payment screenshot upload endpoint called');
      return handlePaymentUpload(request, env, corsHeaders);
    }

    // Chat file upload to R2 (папка chat-files/orderId/)
    if (url.pathname === '/api/chat/upload' && request.method === 'POST') {
      console.log('💬 Chat file upload endpoint called');
      return handleChatUpload(request, env, corsHeaders);
    }

    // Delete chat files for closed order
    if (url.pathname === '/api/chat/delete-order' && request.method === 'POST') {
      console.log('🗑️ Chat files delete endpoint called');
      return handleChatDeleteOrder(request, env, corsHeaders);
    }

    // Music API (genres + tracks from R2)
    if (url.pathname === '/api/music/genres') {
      return handleMusicGenres(request, env, corsHeaders);
    }
    if (url.pathname === '/api/music/tracks') {
      return handleMusicTracks(request, env, corsHeaders);
    }
    if (url.pathname === '/api/music/file') {
      return handleMusicFile(request, env, corsHeaders);
    }

    // Futaj API (premium video categories from R2)
    if (url.pathname === '/api/futaj/categories') {
      return handleFutajCategories(request, env, corsHeaders);
    }
    if (url.pathname === '/api/futaj/videos') {
      return handleFutajVideos(request, env, corsHeaders);
    }
    if (url.pathname === '/api/futaj/file') {
      return handleFutajFile(request, env, corsHeaders);
    }

    // Telegram feedback
    if (url.pathname === '/api/sendTelegramFeedback') {
      return handleTelegramFeedback(request, env, corsHeaders, ctx);
    }

    console.log('❌ Route not found:', url.pathname);
    return new Response('Not found', { 
      status: 404,
      headers: corsHeaders
    });
  },
};

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function handleTelegramFeedback(request, env, corsHeaders, ctx) {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false }), {
        status: 405,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      });
    }

    // Simple rate limit: 1 request / 15s per IP (Cache API)
    const ip =
      request.headers.get('cf-connecting-ip') ||
      (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
      'unknown'
    const cacheKeyUrl = `https://dmotion.local/rl/sendTelegramFeedback?ip=${encodeURIComponent(ip)}`
    const cacheKey = new Request(cacheKeyUrl, { method: 'GET' })
    const cache = caches.default
    const hit = await cache.match(cacheKey)
    if (hit) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      })
    }

    // Telegram credentials MUST be configured as Worker secrets.
    // Normalize token: remove ALL whitespace (including hidden/newlines) and tolerate accidental "bot" prefix.
    const hasEnvToken = env.TELEGRAM_BOT_TOKEN !== undefined && env.TELEGRAM_BOT_TOKEN !== null
    const rawToken = hasEnvToken ? String(env.TELEGRAM_BOT_TOKEN) : ''
    const token = rawToken.replace(/\s+/g, '').replace(/^bot/i, '')
    const chatId = env.TELEGRAM_CHAT_ID || '776344290'
    if (!token) {
      console.error('❌ TELEGRAM_BOT_TOKEN missing/empty', { hasEnvToken, rawLen: rawToken.length })
      return new Response(JSON.stringify({ ok: false }), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      });
    }

    // Basic format sanity check (do NOT log token itself)
    const tokenLooksValid = /^\d+:[A-Za-z0-9_-]{20,}$/.test(token)
    if (!tokenLooksValid) {
      console.error('❌ TELEGRAM_BOT_TOKEN invalid format', { len: token.length })
      return new Response(JSON.stringify({ ok: false }), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      });
    }

    let body = null
    try {
      body = await request.json()
    } catch {
      body = null
    }

    // Honeypot: bots often fill hidden fields
    const hp = body && typeof body.hp === 'string' ? body.hp.trim() : ''
    if (hp) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      })
    }

    const message = (body && typeof body.message === 'string') ? body.message.trim() : ''
    if (!message) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      });
    }

    // Max length guard
    if (message.length > 1200) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      })
    }

    const text = `<b>📝 Новое сообщение из D MOTION:</b>\n\n${escapeHtml(message)}`
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`

    const tgResp = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    })

    if (!tgResp.ok) {
      const errText = await tgResp.text()
      console.error('❌ Telegram sendMessage failed:', tgResp.status, errText)
      return new Response(JSON.stringify({ ok: false }), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      });
    }

    // Store RL entry only on success (avoid blocking retries for transient errors)
    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(cache.put(cacheKey, new Response('1', { headers: { 'Cache-Control': 'max-age=15' } })))
    } else {
      await cache.put(cacheKey, new Response('1', { headers: { 'Cache-Control': 'max-age=15' } }))
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
    });
  } catch (e) {
    console.error('handleTelegramFeedback error:', e)
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
    });
  }
}

// Обработчик поиска футажей через Pexels
async function handleFootageSearch(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || url.searchParams.get('category') || 'popular';
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    // Диагностика: проверяем наличие ключа
    const apiKey = env.PEXELS_API_KEY;
    
    // Детальный лог для диагностики
    console.log('🔑 PEXELS_API_KEY check:', {
      exists: !!apiKey,
      isUndefined: apiKey === undefined,
      isNull: apiKey === null,
      isEmpty: apiKey === '',
      length: apiKey ? apiKey.length : 0,
      firstChars: apiKey ? apiKey.substring(0, 10) + '...' : 'undefined',
      envKeys: Object.keys(env || {}).filter(k => k.includes('PEXELS') || k.includes('API'))
    });
    
    if (!apiKey) {
      console.error('PEXELS_API_KEY is missing or empty!', {
        envKeys: Object.keys(env || {}),
        hasEnv: !!env
      });
      return new Response(JSON.stringify({ 
        error: 'PEXELS_API_KEY missing',
        hint: 'Run: wrangler secret put PEXELS_API_KEY --name stickers-manifest',
        debug: {
          envExists: !!env,
          envKeys: Object.keys(env || {}).slice(0, 10) // Первые 10 ключей для диагностики
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Запрос к Pexels API
    const pexelsUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=24&page=${page}`;
    
    console.log('🎬 Requesting Pexels:', { query, page, url: pexelsUrl });
    
    const response = await fetch(pexelsUrl, {
      headers: {
        'Authorization': apiKey,
        'User-Agent': 'DMotion/1.0',
      },
    });
    
    console.log('🎬 Pexels response status:', response.status);
    console.log('🎬 Pexels response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `HTTP ${response.status}` };
      }
      
      console.error('Pexels API error response:', {
        status: response.status,
        errorData: errorData
      });
      
      // Более понятные сообщения об ошибках
      let errorMessage = 'Ошибка Pexels API';
      if (response.status === 401) {
        errorMessage = 'Неверный API ключ Pexels. Проверьте настройки.';
      } else if (response.status === 429) {
        errorMessage = 'Превышен лимит запросов к Pexels API';
      } else if (response.status === 404) {
        errorMessage = 'Endpoint Pexels API не найден';
      } else if (errorData.error) {
        errorMessage = `Pexels API: ${errorData.error}`;
      } else {
        errorMessage = `Ошибка Pexels API (${response.status})`;
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        status: response.status,
        hint: response.status === 401 ? 'Проверьте правильность PEXELS_API_KEY в настройках воркера' : undefined
      }), {
        status: 500, // Всегда возвращаем 500 для ошибок API, чтобы фронтенд мог их обработать
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let data;
    try {
      const responseText = await response.text();
      console.log('🎬 Pexels raw response (first 500 chars):', responseText.substring(0, 500));
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse Pexels response:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON response from Pexels API',
        details: parseError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    console.log('🎬 Pexels response structure:', {
      hasVideos: !!data.videos,
      videosIsArray: Array.isArray(data.videos),
      videosLength: data.videos?.length || 0,
      hasPhotos: !!data.photos,
      photosIsArray: Array.isArray(data.photos),
      photosLength: data.photos?.length || 0,
      keys: Object.keys(data),
      dataType: typeof data,
    });

    // Проверяем наличие videos в ответе
    if (!data.videos || !Array.isArray(data.videos)) {
      // Pexels мог вернуть фото-ответ (photos) вместо videos - 
      // в этом случае считаем, что просто нет подходящих футажей
      // Проверяем несколько вариантов структуры ответа
      const photosArray = Array.isArray(data.photos) ? data.photos : null;
      const hasPhotos = !!photosArray;
      
      console.log('🔍 Checking for photos fallback:', {
        hasPhotos: !!data.photos,
        photosIsArray: Array.isArray(data.photos),
        photosLength: photosArray?.length || 0,
        willUseFallback: hasPhotos,
        allKeys: Object.keys(data),
      });
      
      if (hasPhotos) {
        console.log('Pexels returned photos instead of videos (photos array found), returning empty videos array');
        return new Response(JSON.stringify({
          videos: [],
          page: data.page || page,
          perPage: data.per_page || 24,
          totalResults: 0,
          nextPage: null,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
        });
      }

      // Если это ошибка от Pexels API
      if (data.error) {
        console.error('❌ Pexels API error:', data.error);
        return new Response(JSON.stringify({ 
          error: `Pexels API error: ${data.error}`,
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      console.error('❌ Invalid Pexels API response structure:', {
        hasVideos: !!data.videos,
        videosType: typeof data.videos,
        videosIsArray: Array.isArray(data.videos),
        hasPhotos: !!data.photos,
        photosType: typeof data.photos,
        photosIsArray: Array.isArray(data.photos),
        photosValue: data.photos ? (Array.isArray(data.photos) ? `Array(${data.photos.length})` : String(data.photos).substring(0, 50)) : 'null/undefined',
        keys: Object.keys(data),
        sampleData: JSON.stringify(data).substring(0, 300),
      });

      return new Response(JSON.stringify({ 
        error: 'Invalid Pexels API response: videos array not found',
        hint: 'Pexels API returned unexpected response structure. Check API key and endpoint.',
        receivedKeys: Object.keys(data),
        hasPhotos: !!data.photos,
        photosType: typeof data.photos,
        photosIsArray: Array.isArray(data.photos),
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Нормализуем ответ Pexels в наш формат
    const normalized = data.videos.map(video => {
      // Находим лучшее качество видео
      let videoUrlHd = null;
      let videoUrlFull = null;
      
      if (video.video_files && video.video_files.length > 0) {
        // Сортируем по качеству (width * height)
        const sorted = [...video.video_files].sort((a, b) => (b.width * b.height) - (a.width * a.height));
        videoUrlFull = sorted[0]?.link || null;
        
        // Ищем HD (1280x720 или ближайшее)
        const hd = sorted.find(f => f.width >= 1280 && f.height >= 720) || sorted.find(f => f.width >= 720);
        videoUrlHd = hd?.link || sorted[0]?.link || null;
      }

      // Получаем превью изображение
      let previewUrl = '';
      if (video.image) {
        previewUrl = video.image;
      } else if (video.picture) {
        previewUrl = video.picture;
      } else if (video.video_pictures && video.video_pictures.length > 0) {
        // Используем первое изображение из video_pictures
        previewUrl = video.video_pictures[0].picture || '';
      }

      return {
        id: video.id,
        previewUrl: previewUrl,
        videoUrlHd: videoUrlHd,
        videoUrlFull: videoUrlFull,
        duration: video.duration || 0,
        width: video.width || 1920,
        height: video.height || 1080,
      };
    });

    return new Response(JSON.stringify({
      videos: normalized,
      page: data.page || page,
      perPage: data.per_page || 24,
      totalResults: data.total_results || 0,
      nextPage: data.next_page || null,
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=600', // Кэш на 10 минут
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Обработчик поиска рамок через Pixabay
async function handleFramesSearch(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const orientation = url.searchParams.get('orientation') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    const apiKey = env.PIXABAY_API_KEY;
    
    console.log('🖼️ PIXABAY_API_KEY check:', {
      exists: !!apiKey,
      length: apiKey ? apiKey.length : 0,
      firstChars: apiKey ? apiKey.substring(0, 10) + '...' : 'undefined',
      lastChars: apiKey && apiKey.length > 10 ? '...' + apiKey.substring(apiKey.length - 5) : 'undefined',
      format: apiKey ? (apiKey.includes('-') ? 'has-dash' : 'no-dash') : 'none'
    });
    
    if (!apiKey) {
      console.error('PIXABAY_API_KEY is missing!');
      return new Response(JSON.stringify({ 
        error: 'PIXABAY_API_KEY missing',
        hint: 'Run: wrangler secret put PIXABAY_API_KEY',
        message: 'API ключ Pixabay не настроен. Добавьте его через: npx wrangler secret put PIXABAY_API_KEY'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // Проверяем формат ключа Pixabay (обычно формат: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
    if (apiKey.length < 20) {
      console.warn('PIXABAY_API_KEY seems too short. Expected format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX');
    }

    // Формируем запрос: только рамки с прозрачным фоном
    const baseQuery = query && query.trim().length > 0
      ? `${query} frame transparent background`
      : 'photo frame transparent background';

    // Сначала пробуем упрощенный запрос без colors=transparent и image_type=vector
    // чтобы проверить, работает ли API вообще
    let pixabayUrl =
      `https://pixabay.com/api/?key=${apiKey}` +
      `&q=${encodeURIComponent(baseQuery)}` +
      `&image_type=all` +                      // все типы изображений
      `&per_page=50` +
      `&page=${page}` +
      `&safesearch=true`;                      // безопасный контент

    if (orientation && orientation !== 'all') {
      pixabayUrl += `&orientation=${orientation}`;
    }
    
    // Логируем URL без ключа для безопасности
    const safeUrl = pixabayUrl.replace(/key=[^&]+/, 'key=***');
    console.log('🖼️ Requesting Pixabay:', { query: baseQuery, orientation, page, url: safeUrl });
    
    const response = await fetch(pixabayUrl);
    
    console.log('🖼️ Pixabay response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🖼️ Pixabay API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        url: safeUrl
      });
      
      // Пытаемся распарсить JSON ошибки, если возможно
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = JSON.stringify(errorJson, null, 2);
      } catch (e) {
        // Не JSON, оставляем как есть
      }
      
      return new Response(JSON.stringify({ 
        error: 'Pixabay API error', 
        status: response.status,
        statusText: response.statusText,
        details: errorDetails.substring(0, 500),
        hint: response.status === 400 ? 'Проверьте правильность API ключа Pixabay. Ключ должен быть получен с https://pixabay.com/api/docs/' : ''
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const data = await response.json();
    
    console.log('🖼️ Pixabay response:', { 
      totalHits: data.totalHits, 
      hitsCount: data.hits?.length || 0,
      hasHits: !!data.hits 
    });

    // Проверяем наличие hits в ответе
    if (!data.hits || !Array.isArray(data.hits)) {
      console.error('🖼️ Invalid Pixabay response:', data);
      return new Response(JSON.stringify({ 
        error: 'Invalid Pixabay API response: hits array not found',
        totalHits: data.totalHits,
        hasHits: !!data.hits
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // Фильтруем изображения - ищем PNG или изображения, которые могут быть рамками
    // Pixabay не всегда возвращает тип файла, поэтому фильтруем по URL или другим признакам
    // Для рамок принимаем все изображения, так как они могут быть в разных форматах
    let filteredHits = data.hits;
    
    // Если запрос содержит "png" или "transparent", пытаемся фильтровать PNG
    if (query.toLowerCase().includes('png') || query.toLowerCase().includes('transparent')) {
      filteredHits = data.hits.filter(hit => {
        // Проверяем, есть ли в URL .png
        const imageUrl = (hit.previewURL || hit.webformatURL || hit.largeImageURL || '').toLowerCase();
        return imageUrl.includes('.png') || imageUrl.includes('png');
      });
      
      // Если после фильтрации ничего не осталось, возвращаем все результаты
      if (filteredHits.length === 0) {
        filteredHits = data.hits;
      }
    }
    
    console.log('🖼️ Filtered hits:', { 
      original: data.hits.length, 
      filtered: filteredHits.length 
    });

    // Нормализуем ответ Pixabay в наш формат
    const normalized = filteredHits.map(hit => {
      // Определяем ориентацию
      const orientation = hit.imageWidth > hit.imageHeight ? 'horizontal' : 'vertical';
      
      // Выбираем лучшее качество изображения
      const srcUrl = hit.fullHDURL || hit.largeImageURL || hit.webformatURL || hit.previewURL;
      const previewUrl = hit.previewURL || hit.webformatURL || hit.largeImageURL;

      return {
        id: hit.id,
        previewUrl: previewUrl,
        srcUrl: srcUrl,
        width: hit.imageWidth,
        height: hit.imageHeight,
        orientation: orientation,
      };
    });

    return new Response(JSON.stringify({
      frames: normalized,
      page: page,
      perPage: 50,
      totalResults: data.totalHits || 0,
      nextPage: page < Math.ceil((data.totalHits || 0) / 50) ? page + 1 : null,
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=600', // Кэш на 10 минут
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Обработчик share-ссылок проектов
async function handleShareProject(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;

  // CORS для POST запросов
  const corsHeadersWithPost = {
    ...corsHeaders,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // OPTIONS запрос
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeadersWithPost });
  }

  // POST: загрузка проекта
  if (method === 'POST') {
    try {
      const projectData = await request.text();
      
      if (!projectData) {
        return new Response(JSON.stringify({ error: 'Project data is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeadersWithPost },
        });
      }

      // Генерируем уникальный shareId
      const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const key = `shares/${shareId}.json`;

      // Проверяем наличие SHARES_BUCKET
      if (!env.SHARES_BUCKET) {
        console.error('SHARES_BUCKET is not configured');
        return new Response(JSON.stringify({ 
          error: 'Share storage is not configured',
          hint: 'Add SHARES_BUCKET binding to wrangler.toml'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeadersWithPost },
        });
      }

      // Сохраняем в R2
      await env.SHARES_BUCKET.put(key, projectData, {
        httpMetadata: {
          contentType: 'application/json',
        },
        customMetadata: {
          createdAt: new Date().toISOString(),
        },
      });

      console.log(`✅ Share project saved: ${shareId}`);

      return new Response(JSON.stringify({ shareId }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...corsHeadersWithPost,
        },
      });
    } catch (error) {
      console.error('❌ Error saving share project:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to save share project',
        message: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeadersWithPost },
      });
    }
  }

  // GET: получение проекта по shareId
  if (method === 'GET') {
    try {
      // Извлекаем shareId из пути: /api/share/:shareId
      const pathParts = url.pathname.split('/');
      const shareId = pathParts[pathParts.length - 1];

      if (!shareId || shareId === 'share') {
        return new Response(JSON.stringify({ error: 'ShareId is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeadersWithPost },
        });
      }

      const key = `shares/${shareId}.json`;

      // Проверяем наличие SHARES_BUCKET
      if (!env.SHARES_BUCKET) {
        return new Response(JSON.stringify({ 
          error: 'Share storage is not configured'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeadersWithPost },
        });
      }

      // Загружаем из R2
      const object = await env.SHARES_BUCKET.get(key);

      if (!object) {
        return new Response(JSON.stringify({ error: 'Shared project not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeadersWithPost },
        });
      }

      const projectData = await object.text();

      console.log(`Share project loaded: ${shareId}`);

      return new Response(projectData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=3600', // Кэш на 1 час
          ...corsHeadersWithPost,
        },
      });
    } catch (error) {
      console.error('Error loading share project:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to load share project',
        message: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeadersWithPost },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeadersWithPost },
  });
}

// собираем JSON из R2
async function buildManifest(env) {
  const baseUrl = (env.STICKERS_PUBLIC_BASE_URL || '').replace(/\/+$/, '');

  const categoryDataMap = new Map();

  // для каждой категории листаем нужную папку в бакете
  for (const def of ALL_CATEGORY_DEFS) {
    const stickers = await listStickersForPrefix(env, def.prefix);

    categoryDataMap.set(def.id, {
      id: def.id,
      label: def.label,
      description: def.description,
      order: def.order,
      prefix: def.prefix,
      stickers,
    });
  }

  const maleData = {
    gender: 'male',
    label: 'Мужские',
    defaultCategoryId: DEFAULT_MALE_CATEGORY,
    categories: buildCategoryObject(maleCategories, categoryDataMap),
  };

  const femaleData = {
    gender: 'female',
    label: 'Женские',
    defaultCategoryId: DEFAULT_FEMALE_CATEGORY,
    categories: buildCategoryObject(femaleCategories, categoryDataMap),
  };

  return {
    baseUrl,
    genders: {
      male: maleData,
      female: femaleData,
    },
  };
}

// чтение файлов по префиксу
async function listStickersForPrefix(env, prefix) {
  const result = await env.STICKERS_BUCKET.list({ prefix });

  return result.objects
    .filter((obj) => !obj.key.endsWith('/'))
    .map((obj) => {
      const key = obj.key;
      const fileName = key.split('/').pop() || key;
      return { key, fileName };
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName));
}

// сборка categories: { id: data }
function buildCategoryObject(defs, map) {
  const out = {};
  for (const def of defs) {
    const data = map.get(def.id);
    if (data) {
      out[def.id] = data;
    }
  }
  return out;
}

// Обработчик манифеста аватаров
async function handleAvatarsManifest(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const gender = url.searchParams.get('gender') || 'male';
    
    // Определяем путь в R2 (без префикса "images/", так как bucket уже называется "images")
    const prefix = gender === 'female' 
      ? 'avatarki/profil/j/'
      : 'avatarki/profil/m/';
    
    // Получаем PUBLIC_BASE_URL из env или используем дефолтный
    const publicBaseUrl = env.IMAGES_PUBLIC_BASE_URL || env.STICKERS_PUBLIC_BASE_URL || 'https://pub-78c4a70555844788bca12cc4cee974d4.r2.dev';
    
    // Используем IMAGES_BUCKET или STICKERS_BUCKET как fallback
    const bucket = env.IMAGES_BUCKET || env.STICKERS_BUCKET;
    
    if (!bucket) {
      const errorHeaders = new Headers({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      return new Response(JSON.stringify({ 
        error: 'IMAGES_BUCKET or STICKERS_BUCKET is not configured',
        hint: 'Add IMAGES_BUCKET or STICKERS_BUCKET binding to wrangler.toml'
      }), {
        status: 500,
        headers: errorHeaders,
      });
    }
    
    console.log('🔍 Loading avatars from prefix:', prefix);
    
    // Получаем список файлов из R2
    const result = await bucket.list({ prefix });
    
    console.log('📦 Found objects:', result.objects.length);
    if (result.objects.length > 0) {
      console.log('📦 First few object keys:', result.objects.slice(0, 3).map(obj => obj.key));
    }
    
    // Фильтруем только изображения и исключаем директории
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const filtered = result.objects.filter(obj => {
      // Исключаем директории
      if (obj.key.endsWith('/')) return false;
      const name = obj.key.toLowerCase();
      return imageExtensions.some(ext => name.endsWith(ext));
    });
    
    console.log('🖼️ Filtered image objects:', filtered.length);
    
    const items = filtered
      .sort((a, b) => a.key.localeCompare(b.key)) // Сортируем по имени
      .map((obj, index) => {
        // Формируем URL: publicBaseUrl уже указывает на bucket "images"
        // obj.key уже содержит полный путь типа "avatarki/profil/m/file.jpg"
        // НЕ добавляем префикс "images/", так как bucket уже называется "images"
        const url = `${publicBaseUrl}/${obj.key}`;
        
        console.log(`  Avatar ${index + 1}: key="${obj.key}", url="${url}"`);
        
        return {
          id: `${gender === 'female' ? 'j' : 'm'}_${String(index + 1).padStart(2, '0')}`,
          url: url
        };
      });
    
    console.log('Returning', items.length, 'avatars');
    if (items.length > 0) {
      console.log('First avatar URL:', items[0].url);
    }
    
    // Создаем заголовки с явным указанием CORS (используем простой объект)
    const responseHeaders = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    
    console.log('📤 Sending response with headers:', Object.fromEntries(responseHeaders));
    
    return new Response(JSON.stringify({
      gender: gender,
      items: items
    }), {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error building avatars manifest:', error);
    const errorHeaders = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return new Response(JSON.stringify({ 
      error: 'Failed to build avatars manifest',
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: errorHeaders,
    });
  }
}

// Обработчик списка сцен (фонов) из R2
async function handleScenesList(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    
    // Валидные категории (базовые)
    const validCategories = [
      'animals', 'architecture', 'bardak', 'culture', 'flags', 'fo',
      'food', 'illustrations', 'love', 'modern', 'music', 'nature',
      'people', 'sport', 'textures'
    ];
    
    // Проверяем: либо базовая категория, либо mob/категория
    let actualCategory = category;
    let isMobile = false;
    let bucket = null;
    
    if (category && category.startsWith('mob/')) {
      // Мобильная версия: используем отдельный bucket MOB_BUCKET
      const baseCat = category.replace('mob/', '');
      if (!validCategories.includes(baseCat)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid or missing category parameter',
          validCategories: validCategories.concat(validCategories.map(c => `mob/${c}`))
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      isMobile = true;
      actualCategory = baseCat; // Убираем префикс mob/, так как bucket уже называется mob
      bucket = env.MOB_BUCKET || env.SCENES_BUCKET; // Пробуем MOB_BUCKET, fallback на SCENES_BUCKET
    } else if (!category || !validCategories.includes(category)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid or missing category parameter',
        validCategories: validCategories.concat(validCategories.map(c => `mob/${c}`))
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } else {
      // Десктоп версия: используем SCENES_BUCKET
      bucket = env.SCENES_BUCKET || env.IMAGES_BUCKET || env.STICKERS_BUCKET;
    }
    
    if (!bucket) {
      return new Response(JSON.stringify({ 
        error: isMobile ? 'MOB_BUCKET is not configured' : 'SCENES_BUCKET is not configured',
        hint: 'Add bucket binding to wrangler.toml'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // Base URL для публичных ссылок
    const baseUrl = isMobile 
      ? 'https://pub-b7213d411dcf4fe9a4da0bfb664b5d70.r2.dev' 
      : (env.SCENES_PUBLIC_BASE_URL || 'https://pub-b69ef7c5697c44e2ab311a83cae5c18a.r2.dev');
    
    // Формируем prefix (для мобильных используем actualCategory без mob/)
    const prefix = `${actualCategory}/`;
    
    console.log('🔍 [SCENES] Loading scenes from category:', category);
    console.log('🔍 [SCENES] Actual category (for prefix):', actualCategory);
    console.log('🔍 [SCENES] Prefix:', prefix);
    console.log('🔍 [SCENES] isMobile:', isMobile);
    console.log('🔍 [SCENES] Using bucket:', isMobile ? 'MOB_BUCKET' : 'SCENES_BUCKET');
    console.log('🔍 [SCENES] Base URL:', baseUrl);
    
    // Получаем список файлов из R2
    const result = await bucket.list({ prefix });
    
    console.log('📦 [SCENES] Found objects for prefix', prefix, ':', result.objects.length);
    
    if (result.objects.length > 0) {
      console.log('📦 [SCENES] First 5 object keys:', result.objects.slice(0, 5).map(obj => obj.key));
      // ДЕТАЛЬНЫЙ ЛОГ КАЖДОГО ОБЪЕКТА
      result.objects.slice(0, 5).forEach((obj, i) => {
        console.log(`  [${i}] key="${obj.key}" size=${obj.size} uploaded=${obj.uploaded}`);
      });
    } else {
      console.log('❌ [SCENES] NO OBJECTS FOUND! Trying to list without prefix...');
      // Проверим, что вообще есть в bucket
      const testResult = await bucket.list({ limit: 10 });
      console.log('📦 [SCENES] Test list (first 10 objects):', testResult.objects.length);
      testResult.objects.forEach((obj, i) => {
        console.log(`  [${i}] TEST key="${obj.key}"`);
      });
    }
    
    // Фильтруем только изображения (включая .jfif для мобильных)
    const imageExtensions = [
      '.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif', '.svg', 
      '.JPG', '.JPEG', '.PNG', '.WEBP', '.GIF', '.JFIF', '.SVG'
    ];
    console.log('🔍 [SCENES] Filtering with extensions:', imageExtensions.join(', '));
    
    const filtered = result.objects.filter(obj => {
      // Исключаем директории
      if (obj.key.endsWith('/')) {
        console.log('⚠️ [FILTER] Skipping directory:', obj.key);
        return false;
      }
      const name = obj.key.toLowerCase();
      const isImage = imageExtensions.some(ext => name.endsWith(ext.toLowerCase()));
      console.log(`🔍 [FILTER] Checking "${obj.key}": isImage=${isImage}`);
      if (!isImage) {
        console.log('❌ [FILTER] Skipping non-image file:', obj.key);
      } else {
        console.log('✅ [FILTER] Accepted:', obj.key);
      }
      return isImage;
    });
    
    console.log('🖼️ Filtered image objects for', category, ':', filtered.length);
    
    // Формируем ответ
    const items = filtered
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((obj) => {
        const url = `${baseUrl}/${obj.key}`;
        return {
          key: obj.key,
          url: url,
          category: category
        };
      });
    
    const response = {
      category: category,
      items: items,
      isMobile: isMobile,
      debug: {
        prefix: prefix,
        actualCategory: actualCategory,
        totalObjects: result.objects.length,
        filteredCount: filtered.length,
        firstKeys: result.objects.slice(0, 3).map(obj => obj.key),
        bucketUsed: isMobile ? 'MOB_BUCKET' : 'SCENES_BUCKET'
      }
    };
    
    console.log('✅ Returning', items.length, 'scenes for category', category, 'isMobile:', isMobile);
    
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400', // Кэш на 1 час, stale-while-revalidate на 24 часа
        'ETag': `"${category}-${items.length}-${Date.now()}"`, // ETag для валидации кэша
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error loading scenes:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to load scenes',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Обработчик списка обложек профиля из R2 oblojki bucket
async function handleCoversList(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'free'; // 'free' или 'premium'
    
    const bucket = env.COVERS_BUCKET;
    
    if (!bucket) {
      return new Response(JSON.stringify({ 
        error: 'COVERS_BUCKET is not configured',
        hint: 'Add COVERS_BUCKET binding to wrangler.toml'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    const baseUrl = env.COVERS_PUBLIC_BASE_URL || 'https://pub-75e6eb0c8af547fcb116b49df5bc7264.r2.dev';
    const prefix = `${type}/`;
    
    console.log('🖼️ Loading covers from type:', type, 'prefix:', prefix);
    
    const result = await bucket.list({ prefix, limit: 500 });
    
    console.log('📦 Found cover objects:', result.objects.length);
    
    // Фильтруем изображения и видео
    const validExtensions = ['.jpg', '.jpeg', '.jfif', '.png', '.webp', '.gif', '.mp4', '.webm'];
    const filtered = result.objects.filter(obj => {
      if (obj.key.endsWith('/')) return false;
      const name = obj.key.toLowerCase();
      return validExtensions.some(ext => name.endsWith(ext));
    });
    
    const items = filtered.map((obj) => {
      const url = `${baseUrl}/${obj.key}`;
      const isVideo = obj.key.toLowerCase().endsWith('.mp4') || obj.key.toLowerCase().endsWith('.webm');
      return {
        key: obj.key,
        url: url,
        type: type,
        isVideo: isVideo
      };
    });
    
    return new Response(JSON.stringify({
      type: type,
      items: items,
      count: items.length
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error loading covers:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to load covers',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Загрузка обложки в R2
async function handleCoverUpload(request, env, corsHeaders) {
  try {
    const bucket = env.COVERS_BUCKET;
    
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'COVERS_BUCKET not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');
    const oldUrl = formData.get('oldUrl'); // URL старого файла для удаления
    
    if (!file || !userId) {
      return new Response(JSON.stringify({ error: 'Missing file or userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Удаляем старый файл если он был загружен пользователем (в папке user/)
    if (oldUrl && oldUrl.includes('/user/')) {
      try {
        const baseUrl = env.COVERS_PUBLIC_BASE_URL || 'https://pub-75e6eb0c8af547fcb116b49df5bc7264.r2.dev';
        const oldKey = oldUrl.replace(baseUrl + '/', '');
        await bucket.delete(oldKey);
        console.log('Deleted old cover:', oldKey);
      } catch (e) {
        console.log('Could not delete old cover:', e.message);
      }
    }

    // Генерируем уникальное имя файла
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `user/${userId}/${Date.now()}.${ext}`;
    
    // Загружаем в R2
    await bucket.put(fileName, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    const baseUrl = env.COVERS_PUBLIC_BASE_URL || 'https://pub-75e6eb0c8af547fcb116b49df5bc7264.r2.dev';
    const publicUrl = `${baseUrl}/${fileName}`;

    return new Response(JSON.stringify({ 
      success: true,
      url: publicUrl 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Error uploading cover:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to upload cover',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

function sanitizeFolderName(folder) {
  const raw = String(folder || '').trim().replace(/\/+$/, '')
  if (!raw) return ''
  // запрещаем выходы наверх и странные сегменты
  if (raw.includes('..') || raw.includes('\\')) return ''
  return raw
}

function keyToName(key) {
  const file = String(key || '').split('/').pop() || ''
  return file.replace(/\.[a-z0-9]+$/i, '') || file || 'Track'
}

function baseFileName(key) {
  return String(key || '').split('/').pop() || ''
}

function stripExt(name) {
  return String(name || '').replace(/\.[a-z0-9]+$/i, '')
}

function normalizeTrackNameFromFile(fileName) {
  const raw = stripExt(fileName)
  if (!raw) return 'Track'

  // "foo_bar-baz" -> "foo bar baz"
  let s = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()

  // Remove common garbage suffixes at the end (repeatable)
  // examples: "final", "v2", "v3", "mix", "remix", "master", "demo", "bpm120"
  const garbageRe = /\s+(final|master|demo|mix|remix|edit|ver|version|v\d+|bpm\d{2,3})$/i
  while (garbageRe.test(s)) s = s.replace(garbageRe, '').trim()

  // Remove trailing separators like " - " after suffix cleanup
  s = s.replace(/[\s\-–-]+$/g, '').trim()

  if (!s) return 'Track'

  // Smart casing:
  // - If string is all upper OR all lower -> Title Case
  // - Else keep as-is (but trimmed/normalized already)
  const letters = s.replace(/[^A-Za-zА-Яа-яЁё]+/g, '')
  const isAllUpper = letters && letters === letters.toUpperCase()
  const isAllLower = letters && letters === letters.toLowerCase()
  if (isAllUpper || isAllLower) {
    s = s
      .split(' ')
      .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ')
  }

  return s
}

function normalizeTrackDisplayName({ key, manifestMeta }) {
  // 1) manifest (if provided)
  const title = manifestMeta && typeof manifestMeta.title === 'string' ? manifestMeta.title.trim() : ''
  const artist = manifestMeta && typeof manifestMeta.artist === 'string' ? manifestMeta.artist.trim() : ''
  if (title) {
    return artist ? `${artist} - ${title}` : title
  }

  // 2) filename normalization
  return normalizeTrackNameFromFile(baseFileName(key))
}

function safeJsonParse(text) {
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

async function readMusicManifest(bucket, prefix) {
  // optional file: `${prefix}manifest.json`
  try {
    const obj = await bucket.get(`${prefix}manifest.json`)
    if (!obj) return null
    const json = safeJsonParse(await obj.text())
    if (!json || typeof json !== 'object') return null

    // Supported schemas:
    // A) { tracks: { "file.mp3": { title, artist }, ... } }
    // B) { "file.mp3": { title, artist } }
    // C) { items: [ { file/key, title, artist }, ... ] }
    const map = new Map()
    const tracksObj = json.tracks && typeof json.tracks === 'object' ? json.tracks : null
    const rootObj = (!tracksObj && !Array.isArray(json) && typeof json === 'object') ? json : null
    const itemsArr = Array.isArray(json.items) ? json.items : (Array.isArray(json) ? json : null)

    if (tracksObj) {
      for (const [k, v] of Object.entries(tracksObj)) {
        if (!k) continue
        if (v && typeof v === 'object') {
          map.set(String(k), { title: v.title, artist: v.artist })
        } else if (typeof v === 'string') {
          map.set(String(k), { title: v })
        }
      }
    } else if (itemsArr) {
      for (const it of itemsArr) {
        if (!it || typeof it !== 'object') continue
        const fk = it.file || it.key || it.name
        if (!fk) continue
        map.set(String(fk), { title: it.title, artist: it.artist })
      }
    } else if (rootObj) {
      for (const [k, v] of Object.entries(rootObj)) {
        if (!k) continue
        if (v && typeof v === 'object') {
          map.set(String(k), { title: v.title, artist: v.artist })
        } else if (typeof v === 'string') {
          map.set(String(k), { title: v })
        }
      }
    }

    return map.size ? map : null
  } catch {
    // manifest is optional, ignore errors
    return null
  }
}

// В бакете `music` ключи обычно выглядят как: sad/track.mp3, dance/..., etc.
// (НЕ `music/sad/...` - потому что `music` уже является именем бакета.)
const MUSIC_ROOT_PREFIX = ''

function sanitizeObjectKey(key) {
  const raw = String(key || '').trim().replace(/^\/+/, '')
  if (!raw) return ''
  if (raw.includes('..') || raw.includes('\\')) return ''
  return raw
}

function guessAudioContentType(key) {
  const k = String(key || '').toLowerCase()
  if (k.endsWith('.mp3')) return 'audio/mpeg'
  if (k.endsWith('.wav')) return 'audio/wav'
  if (k.endsWith('.ogg')) return 'audio/ogg'
  if (k.endsWith('.m4a')) return 'audio/mp4'
  if (k.endsWith('.aac')) return 'audio/aac'
  if (k.endsWith('.flac')) return 'audio/flac'
  return 'application/octet-stream'
}

function parseRangeHeader(rangeHeader, size) {
  // bytes=start-end
  const m = /^bytes=(\d+)-(\d*)$/i.exec(String(rangeHeader || '').trim())
  if (!m) return null
  const start = Number(m[1])
  const end = m[2] ? Number(m[2]) : (Number.isFinite(size) ? (size - 1) : NaN)
  if (!Number.isFinite(start) || start < 0) return null
  if (!Number.isFinite(end) || end < start) return null
  if (Number.isFinite(size) && start >= size) return { unsatisfiable: true, start, end }
  const clampedEnd = Number.isFinite(size) ? Math.min(end, size - 1) : end
  return { start, end: clampedEnd }
}

// Список жанров (папки верхнего уровня в бакете)
async function handleMusicGenres(request, env, corsHeaders) {
  try {
    const bucket = env.MUSIC_BUCKET || env.SCENES_BUCKET || env.IMAGES_BUCKET || env.STICKERS_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({
        error: 'MUSIC_BUCKET is not configured',
        hint: 'Add MUSIC_BUCKET binding (or reuse SCENES_BUCKET) to wrangler.toml'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const genres = new Set()
    let cursor = undefined
    let safety = 0
    while (safety < 12) { // safety cap (~12k keys)
      safety += 1
      const result = await bucket.list({ prefix: MUSIC_ROOT_PREFIX, delimiter: '/', limit: 1000, cursor })

      // Если API возвращает delimitedPrefixes - это идеальный вариант для папок
      if (Array.isArray(result?.delimitedPrefixes)) {
        for (const p of result.delimitedPrefixes) {
          const g = sanitizeFolderName(String(p || '').replace(/\/+$/, ''))
          if (g) genres.add(g)
        }
      }

      // Фоллбек: извлекаем жанр из ключей объектов
      for (const obj of (result.objects || [])) {
        const key = String(obj.key || '')
        // Важное: игнорируем файлы в корне бакета (они не жанры)
        if (!key.includes('/')) continue
        const seg = key.split('/')[0]
        const g = sanitizeFolderName(seg)
        if (g) genres.add(g)
      }
      cursor = result.cursor
      if (!cursor) break
    }

    return new Response(JSON.stringify({
      genres: Array.from(genres).sort((a, b) => a.localeCompare(b)),
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=120, s-maxage=120, stale-while-revalidate=600',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error loading music genres:', error);
    return new Response(JSON.stringify({
      error: 'Failed to load music genres',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Список треков внутри жанра (prefix `${genre}/`)
async function handleMusicTracks(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const genre = sanitizeFolderName(url.searchParams.get('genre'));
    if (!genre) {
      return new Response(JSON.stringify({
        error: 'Missing or invalid genre parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const bucket = env.MUSIC_BUCKET || env.SCENES_BUCKET || env.IMAGES_BUCKET || env.STICKERS_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({
        error: 'MUSIC_BUCKET is not configured',
        hint: 'Add MUSIC_BUCKET binding (or reuse SCENES_BUCKET) to wrangler.toml'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const prefix = `${MUSIC_ROOT_PREFIX}${genre}/`
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.MP3', '.WAV', '.OGG', '.M4A', '.AAC', '.FLAC']

    // Optional per-genre manifest (metadata), best-effort
    const manifest = await readMusicManifest(bucket, prefix)

    let cursor = undefined
    let safety = 0
    const items = []
    while (safety < 10) { // safety cap (~10k keys)
      safety += 1
      const result = await bucket.list({ prefix, limit: 1000, cursor })
      for (const obj of (result.objects || [])) {
        const key = String(obj.key || '')
        if (key.endsWith('/')) continue
        const lower = key.toLowerCase()
        const isAudio = audioExtensions.some(ext => lower.endsWith(ext.toLowerCase()))
        if (!isAudio) continue
        const fileUrl = `${url.origin}/api/music/file?key=${encodeURIComponent(key)}`
        const file = baseFileName(key)
        const meta = manifest ? (manifest.get(file) || manifest.get(key) || null) : null
        const displayName = normalizeTrackDisplayName({ key, manifestMeta: meta })
        const sortName = String(displayName || '').toLowerCase()
        items.push({
          key,
          displayName,
          sortName,
          url: fileUrl,
          lastModified: obj.uploaded ? new Date(obj.uploaded).toISOString() : null,
        })
      }
      cursor = result.cursor
      if (!cursor) break
    }

    return new Response(JSON.stringify({
      genre,
      items: items.sort((a, b) => {
        const an = String(a.sortName || '')
        const bn = String(b.sortName || '')
        const byName = an.localeCompare(bn, 'ru', { numeric: true, sensitivity: 'base' })
        if (byName) return byName
        return String(a.key || '').localeCompare(String(b.key || ''), 'en', { numeric: true, sensitivity: 'base' })
      }).map(({ sortName, ...rest }) => rest),
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error loading music tracks:', error);
    return new Response(JSON.stringify({
      error: 'Failed to load music tracks',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Получение аудио-файла из R2 (для <audio> и скачивания), с поддержкой Range
async function handleMusicFile(request, env, corsHeaders) {
  try {
    const url = new URL(request.url)
    const keyRaw = url.searchParams.get('key')
    const key = sanitizeObjectKey(keyRaw)
    if (!key) {
      return new Response('Bad Request', { status: 400, headers: corsHeaders })
    }

    const bucket = env.MUSIC_BUCKET || env.SCENES_BUCKET || env.IMAGES_BUCKET || env.STICKERS_BUCKET;
    if (!bucket) {
      return new Response('Storage not configured', { status: 500, headers: corsHeaders })
    }

    // Сначала head, чтобы знать размер и корректно отвечать на Range
    const head = await bucket.head(key)
    if (!head) {
      return new Response('Not found', { status: 404, headers: corsHeaders })
    }

    const size = head.size
    const etag = head.etag ? `"${String(head.etag).replace(/\"/g, '')}"` : null
    const rangeHeader = request.headers.get('range')
    const range = rangeHeader ? parseRangeHeader(rangeHeader, size) : null

    if (range && range.unsatisfiable) {
      return new Response(null, {
        status: 416,
        headers: {
          'Content-Range': `bytes */${size}`,
          ...corsHeaders,
        },
      })
    }

    const contentType = guessAudioContentType(key)

    // Частичный контент (206)
    if (range && Number.isFinite(range.start) && Number.isFinite(range.end)) {
      const length = (range.end - range.start + 1)
      const obj = await bucket.get(key, { range: { offset: range.start, length } })
      if (!obj) return new Response('Not found', { status: 404, headers: corsHeaders })
      return new Response(obj.body, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
          'Content-Length': String(length),
          // Range responses can still be cached by intermediaries; treat as immutable if filenames are versioned.
          'Cache-Control': 'public, max-age=31536000, immutable',
          ...(etag ? { ETag: etag } : {}),
          ...corsHeaders,
        },
      })
    }

    // Полный контент (200)
    if (etag) {
      const inm = request.headers.get('if-none-match')
      if (inm && inm === etag) {
        return new Response(null, {
          status: 304,
          headers: {
            ...(etag ? { ETag: etag } : {}),
            'Cache-Control': 'public, max-age=31536000, immutable',
            ...corsHeaders,
          },
        })
      }
    }
    const obj = await bucket.get(key)
    if (!obj) return new Response('Not found', { status: 404, headers: corsHeaders })
    return new Response(obj.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(size),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...(etag ? { ETag: etag } : {}),
        ...corsHeaders,
      },
    })
  } catch (e) {
    console.error('❌ handleMusicFile error:', e)
    return new Response('Internal error', { status: 500, headers: corsHeaders })
  }
}

// Загрузка скриншота оплаты в R2 (папка payments/YYYY-MM-DD/)
async function handlePaymentUpload(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const orderId = formData.get('orderId');

    if (!file || !orderId) {
      return new Response(JSON.stringify({ error: 'Missing file or orderId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Получаем bucket oblojki (тот же что для обложек)
    const bucket = env.COVERS_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'COVERS_BUCKET not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Формируем путь: payments/YYYY-MM-DD/orderId_timestamp.ext
    const now = new Date();
    const dateFolder = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timestamp = now.getTime();
    const ext = file.name.split('.').pop() || 'png';
    const key = `payments/${dateFolder}/${orderId}_${timestamp}.${ext}`;

    // Загружаем файл
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'image/png',
      },
    });

    // Формируем публичный URL
    const publicUrl = `https://pub-75e6eb0c8af547fcb116b49df5bc7264.r2.dev/${key}`;

    console.log('✅ Payment screenshot uploaded:', key);

    return new Response(JSON.stringify({ 
      success: true, 
      url: publicUrl,
      key: key
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('❌ Payment upload error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Загрузка файла чата в R2 (папка chat-files/orderId/)
async function handleChatUpload(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const orderId = formData.get('orderId');

    if (!file || !orderId) {
      return new Response(JSON.stringify({ error: 'Missing file or orderId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large (max 10MB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Используем bucket oblojki (COVERS_BUCKET)
    const bucket = env.COVERS_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'COVERS_BUCKET not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Формируем путь: chat-files/orderId/timestamp.ext
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const key = `chat-files/${orderId}/${timestamp}.${ext}`;

    // Загружаем файл
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
    });

    // Формируем публичный URL
    const publicUrl = `https://pub-75e6eb0c8af547fcb116b49df5bc7264.r2.dev/${key}`;

    console.log('✅ Chat file uploaded:', key);

    return new Response(JSON.stringify({ 
      success: true, 
      url: publicUrl,
      key: key
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('❌ Chat file upload error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Удаление всех файлов чата заказа из R2
async function handleChatDeleteOrder(request, env, corsHeaders) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing orderId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const bucket = env.COVERS_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'COVERS_BUCKET not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Получаем список файлов с префиксом chat-files/orderId/
    const prefix = `chat-files/${orderId}/`;
    const listed = await bucket.list({ prefix });

    // Удаляем все файлы
    let deletedCount = 0;
    for (const object of listed.objects) {
      await bucket.delete(object.key);
      deletedCount++;
      console.log('🗑️ Deleted chat file:', object.key);
    }

    console.log(`✅ Deleted ${deletedCount} chat files for order ${orderId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      deleted: deletedCount,
      orderId: orderId
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('❌ Chat files delete error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Delete failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Futaj API - список категорий (папок верхнего уровня в бакете futaj)
async function handleFutajCategories(request, env, corsHeaders) {
  try {
    const bucket = env.FUTAJ_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({
        error: 'FUTAJ_BUCKET is not configured',
        hint: 'Add FUTAJ_BUCKET binding to wrangler.toml'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const categories = new Set()
    let cursor = undefined
    let safety = 0
    while (safety < 12) {
      safety += 1
      const result = await bucket.list({ delimiter: '/', limit: 1000, cursor })

      if (Array.isArray(result?.delimitedPrefixes)) {
        for (const p of result.delimitedPrefixes) {
          const cat = String(p || '').replace(/\/+$/, '').trim()
          if (cat) categories.add(cat)
        }
      }

      for (const obj of (result.objects || [])) {
        const key = String(obj.key || '')
        if (!key.includes('/')) continue
        const seg = key.split('/')[0]
        if (seg) categories.add(seg)
      }
      cursor = result.cursor
      if (!cursor) break
    }

    return new Response(JSON.stringify({
      categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=120, s-maxage=120',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error loading futaj categories:', error);
    return new Response(JSON.stringify({
      error: 'Failed to load categories',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Futaj API - список видео в категории
async function handleFutajVideos(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    if (!category) {
      return new Response(JSON.stringify({
        error: 'Missing category parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const bucket = env.FUTAJ_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({
        error: 'FUTAJ_BUCKET is not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const prefix = `${category}/`
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.MP4', '.WEBM', '.MOV']

    let cursor = undefined
    let safety = 0
    const items = []
    while (safety < 10) {
      safety += 1
      const result = await bucket.list({ prefix, limit: 1000, cursor })
      for (const obj of (result.objects || [])) {
        const key = String(obj.key || '')
        if (key.endsWith('/')) continue
        const lower = key.toLowerCase()
        const isVideo = videoExtensions.some(ext => lower.endsWith(ext.toLowerCase()))
        if (!isVideo) continue
        
        const fileName = key.split('/').pop() || key
        const displayName = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')
        
        items.push({
          key,
          fileName,
          displayName,
          url: `${url.origin}/api/futaj/file?key=${encodeURIComponent(key)}`,
          size: obj.size,
          lastModified: obj.uploaded ? new Date(obj.uploaded).toISOString() : null,
        })
      }
      cursor = result.cursor
      if (!cursor) break
    }

    return new Response(JSON.stringify({
      category,
      items: items.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ru', { numeric: true })),
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error loading futaj videos:', error);
    return new Response(JSON.stringify({
      error: 'Failed to load videos',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Futaj API - отдача видео файла из R2
async function handleFutajFile(request, env, corsHeaders) {
  try {
    const url = new URL(request.url)
    const keyRaw = url.searchParams.get('key')
    const key = keyRaw ? keyRaw.trim() : null
    if (!key) {
      return new Response('Bad Request', { status: 400, headers: corsHeaders })
    }

    const bucket = env.FUTAJ_BUCKET
    if (!bucket) {
      return new Response('Storage not configured', { status: 500, headers: corsHeaders })
    }

    const head = await bucket.head(key)
    if (!head) {
      return new Response('Not found', { status: 404, headers: corsHeaders })
    }

    const size = head.size
    const etag = head.etag ? `"${String(head.etag).replace(/\"/g, '')}"` : null
    const rangeHeader = request.headers.get('range')
    const range = rangeHeader ? parseRangeHeader(rangeHeader, size) : null

    if (range && range.unsatisfiable) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${size}`, ...corsHeaders },
      })
    }

    const ext = key.split('.').pop()?.toLowerCase() || 'mp4'
    const contentType = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
    }[ext] || 'video/mp4'

    // Partial content (206)
    if (range && Number.isFinite(range.start) && Number.isFinite(range.end)) {
      const length = range.end - range.start + 1
      const obj = await bucket.get(key, { range: { offset: range.start, length } })
      if (!obj) return new Response('Not found', { status: 404, headers: corsHeaders })
      return new Response(obj.body, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
          'Content-Length': String(length),
          'Cache-Control': 'public, max-age=31536000, immutable',
          ...(etag ? { ETag: etag } : {}),
          ...corsHeaders,
        },
      })
    }

    // Full content (200)
    const obj = await bucket.get(key)
    if (!obj) return new Response('Not found', { status: 404, headers: corsHeaders })
    return new Response(obj.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(size),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...(etag ? { ETag: etag } : {}),
        ...corsHeaders,
      },
    })
  } catch (e) {
    console.error('handleFutajFile error:', e)
    return new Response('Internal error', { status: 500, headers: corsHeaders })
  }
}
