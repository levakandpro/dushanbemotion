// src/avatars/worker/index.js
// Простой worker для аватаров из R2

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Обрабатываем OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Обрабатываем только GET /avatars
    if (url.pathname !== '/avatars') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    try {
      // Получаем gender из query параметров
      const gender = url.searchParams.get('gender') || 'male';

      // Определяем префикс в R2
      const prefix = gender === 'female' 
        ? 'avatarki/profil/j/'
        : 'avatarki/profil/m/';

      // Получаем bucket
      const bucket = env.IMAGES_BUCKET;
      
      if (!bucket) {
        return new Response(JSON.stringify({ 
          error: 'IMAGES_BUCKET is not configured',
          hint: 'Add IMAGES_BUCKET binding to wrangler.toml'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Публичный base URL для изображений из переменной окружения
      const publicBaseUrl = env.IMAGES_PUBLIC_BASE_URL;
      
      if (!publicBaseUrl) {
        return new Response(JSON.stringify({ 
          error: 'IMAGES_PUBLIC_BASE_URL is not configured',
          hint: 'Add IMAGES_PUBLIC_BASE_URL to wrangler.toml [vars]'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      console.log('🔍 Loading avatars from prefix:', prefix);
      console.log('🌐 Using publicBaseUrl:', publicBaseUrl);

      // Получаем список файлов из R2
      const result = await bucket.list({ prefix });

      console.log('📦 Found objects:', result.objects.length);
      if (result.objects.length > 0) {
        console.log('📦 First object key:', result.objects[0].key);
      }

      // Фильтруем только изображения и исключаем директории
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const items = result.objects
        .filter(obj => {
          // Исключаем директории
          if (obj.key.endsWith('/')) return false;
          const name = obj.key.toLowerCase();
          return imageExtensions.some(ext => name.endsWith(ext));
        })
        .sort((a, b) => a.key.localeCompare(b.key)) // Сортируем по имени
        .map((obj, index) => {
          // Формируем URL точно так же, как у стикеров
          // obj.key приходит напрямую из R2: avatarki/profil/m/m_01.jpg
          // БЕЗ кодирования, БЕЗ префиксов /images/
          const url = `${publicBaseUrl}/${obj.key}`;

          // Генерируем id на основе gender и индекса
          const id = `${gender === 'female' ? 'j' : 'm'}_${String(index + 1).padStart(2, '0')}`;

          // Логируем первые несколько для отладки
          if (index < 3) {
            console.log(`  Avatar ${index + 1}: key="${obj.key}", url="${url}"`);
          }

          return {
            id: id,
            key: obj.key,
            url: url,
          };
        });

      console.log('Returning', items.length, 'avatars');
      if (items.length > 0) {
        console.log('First avatar URL:', items[0].url);
      }

      // Возвращаем JSON
      return new Response(JSON.stringify({
        gender: gender,
        items: items,
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } catch (error) {
      console.error('❌ Error loading avatars:', error);
      return new Response(JSON.stringify({
        error: 'Failed to load avatars',
        message: error.message,
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },
};

