// РџСЂРѕСЃС‚РѕР№ СЃРєСЂРёРїС‚ РґР»СЏ РїСЂРѕРІРµСЂРєРё РґРѕСЃС‚СѓРїРЅРѕСЃС‚Рё worker
// Р-Р°РїСѓСЃРє: node check-worker.js

const WORKER_URL = 'https://stickers-manifest.natopchane.workers.dev/api/footage/search?query=test'

async function checkWorker() {
  console.log('рџ”Ќ РџСЂРѕРІРµСЂСЏСЋ worker...')
  console.log('URL:', WORKER_URL)
  
  try {
    const response = await fetch(WORKER_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    console.log('вњ… РЎС‚Р°С‚СѓСЃ:', response.status, response.statusText)
    
    const text = await response.text()
    console.log('рџ“„ РћС‚РІРµС‚ (РїРµСЂРІС‹Рµ 200 СЃРёРјРІРѕР»РѕРІ):', text.substring(0, 200))
    
    if (response.ok) {
      try {
        const json = JSON.parse(text)
        if (json.videos) {
          console.log('вњ… Worker СЂР°Р±РѕС‚Р°РµС‚! РќР°Р№РґРµРЅРѕ РІРёРґРµРѕ:', json.videos.length)
        } else if (json.error) {
          console.log('вљ пёЏ Worker РѕС‚РІРµС‡Р°РµС‚, РЅРѕ РµСЃС‚СЊ РѕС€РёР±РєР°:', json.error)
        } else {
          console.log('вљ пёЏ РќРµРѕР¶РёРґР°РЅРЅС‹Р№ С„РѕСЂРјР°С‚ РѕС‚РІРµС‚Р°')
        }
      } catch (e) {
        console.log('вљ пёЏ РћС‚РІРµС‚ РЅРµ JSON:', text)
      }
    } else {
      console.log('вќЊ Worker РѕС‚РІРµС‡Р°РµС‚ СЃ РѕС€РёР±РєРѕР№:', response.status)
    }
  } catch (error) {
    console.error('вќЊ РћС€РёР±РєР° РїРѕРґРєР»СЋС‡РµРЅРёСЏ:', error.message)
    console.log('\nрџ’Ў Р РµС€РµРЅРёРµ:')
    console.log('1. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ worker Р·Р°РґРµРїР»РѕРµРЅ: npx wrangler deploy')
    console.log('2. РџСЂРѕРІРµСЂСЊС‚Рµ, С‡С‚Рѕ РІС‹ РІ РїСЂР°РІРёР»СЊРЅРѕР№ РґРёСЂРµРєС‚РѕСЂРёРё РїСЂРѕРµРєС‚Р°')
    console.log('3. РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕРґРєР»СЋС‡РµРЅРёРµ Рє РёРЅС‚РµСЂРЅРµС‚Сѓ')
  }
}

checkWorker()

