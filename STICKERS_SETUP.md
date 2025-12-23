# рџЋЇ РќР°СЃС‚СЂРѕР№РєР° СЃС‚РёРєРµСЂРѕРІ - РРЅСЃС‚СЂСѓРєС†РёСЏ

## 1. РЎРѕР·РґР°С‚СЊ .env.local С„Р°Р№Р»

```bash
# Р’ РєРѕСЂРЅРµ РїСЂРѕРµРєС‚Р° СЃРѕР·РґР°С‚СЊ С„Р°Р№Р» .env.local
VITE_STICKERS_MANIFEST_URL=https://stickers-manifest.natopchane.workers.dev/stickers/manifest
```

## 2. РќР°СЃС‚СЂРѕРёС‚СЊ Cloudflare Worker

### Р’ Cloudflare Dashboard:

**Р’РѕСЂРєРµСЂ:** `stickers-manifest`

**РќР°СЃС‚СЂРѕР№РєРё в†’ Settings в†’ Variables:**

1. **R2 Bucket Binding:**
   - Variable name: `STICKERS_BUCKET`
   - R2 bucket: `stickers`

2. **Environment Variable:**
   - Variable name: `STICKERS_PUBLIC_BASE_URL`
   - Value: `https://pub-78c4a70555844788bca12cc4cee974d4.r2.dev`
   - вљ пёЏ **Р‘Р•Р-** `/stickers` РІ РєРѕРЅС†Рµ!

### Р”РµРїР»РѕР№ РІРѕСЂРєРµСЂР°:

```bash
# Р’ РєРѕСЂРЅРµ РїСЂРѕРµРєС‚Р°
npx wrangler deploy

# РР»Рё РµСЃР»Рё wrangler СѓСЃС‚Р°РЅРѕРІР»РµРЅ РіР»РѕР±Р°Р»СЊРЅРѕ
wrangler deploy
```

вљ пёЏ **Р’РђР–РќРћ:** РџРѕСЃР»Рµ РёР·РјРµРЅРµРЅРёСЏ CORS headers РІРѕСЂРєРµСЂ РћР‘РЇР-РђРўР•Р›Р¬РќРћ РЅСѓР¶РЅРѕ redeploy!

## 3. РџСЂРѕРІРµСЂРёС‚СЊ РјР°РЅРёС„РµСЃС‚

РћС‚РєСЂС‹С‚СЊ РІ Р±СЂР°СѓР·РµСЂРµ:
```
https://stickers-manifest.natopchane.workers.dev/stickers/manifest
```

**РћР¶РёРґР°РµРјС‹Р№ РѕС‚РІРµС‚:**
```json
{
  "baseUrl": "https://pub-78c4a70555844788bca12cc4cee974d4.r2.dev",
  "genders": {
    "male": {
      "categories": {
        "collection": {
          "stickers": [
            {
              "key": "stickers/aralash/С„Р°Р№Р».svg",
              "fileName": "С„Р°Р№Р».svg"
            }
          ]
        }
      }
    }
  }
}
```

## 4. РџСЂРѕРІРµСЂРёС‚СЊ R2 СЃС‚СЂСѓРєС‚СѓСЂСѓ

Р’ R2 bucket `stickers` РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ РїР°РїРєРё:

**РњСѓР¶СЃРєРёРµ:**
- `stickers/animals/`
- `stickers/aralash/`
- `stickers/avto/`
- `stickers/boznes/`
- `stickers/eda/`
- `stickers/game/`
- `stickers/history/`
- `stickers/islam/`
- `stickers/love/`
- `stickers/m_name/`
- `stickers/m_pro/`
- `stickers/mask/`
- `stickers/medic/`
- `stickers/minimalism/`
- `stickers/minimalism/music/`
- `stickers/patriot/`
- `stickers/prazdniki/`
- `stickers/priroda/`
- `stickers/soc/`
- `stickers/sport/`
- `stickers/uzori/`

**Р–РµРЅСЃРєРёРµ:**
- `stickers/Jenskie/all/`
- `stickers/Jenskie/pro/`
- `stickers/Jenskie/lux/`
- `stickers/Jenskie/nasledie/`
- `stickers/Jenskie/patriotka/`
- `stickers/Jenskie/moda/`
- `stickers/Jenskie/makeup/`
- `stickers/Jenskie/emocii/`
- `stickers/Jenskie/chakchak/`
- `stickers/Jenskie/kariera/`
- `stickers/Jenskie/decor/`
- `stickers/Jenskie/peyzaji/`
- `stickers/Jenskie/tadjichka/`
- `stickers/Jenskie/love/`
- `stickers/Jenskie/techno/`
- `stickers/Jenskie/cveti/`
- `stickers/Jenskie/imena/`

## 5. РџРµСЂРµР·Р°РїСѓСЃС‚РёС‚СЊ dev-СЃРµСЂРІРµСЂ

```bash
npm run dev
```

## 6. РџСЂРѕРІРµСЂРёС‚СЊ РІ РєРѕРЅСЃРѕР»Рё Р±СЂР°СѓР·РµСЂР°

РџСЂРё РєР»РёРєРµ РЅР° "РЎС‚РёРєРµСЂС‹" РґРѕР»Р¶РЅРѕ РїРѕСЏРІРёС‚СЊСЃСЏ:
```
рџЋЇ Р-Р°РіСЂСѓР¶Р°СЋ РјР°РЅРёС„РµСЃС‚ СЃС‚РёРєРµСЂРѕРІ: https://...
вњ… РњР°РЅРёС„РµСЃС‚ Р·Р°РіСЂСѓР¶РµРЅ: {baseUrl: "...", genders: {...}}
рџ“¦ baseUrl: https://pub-78c4a70555844788bca12cc4cee974d4.r2.dev
рџ‘Ё РњСѓР¶СЃРєРёС… РєР°С‚РµРіРѕСЂРёР№: 21
рџ‘© Р–РµРЅСЃРєРёС… РєР°С‚РµРіРѕСЂРёР№: 17
```

## рџ”Ќ Troubleshooting

### РџСЂРѕР±Р»РµРјР°: РїСѓСЃС‚С‹Рµ РјР°СЃСЃРёРІС‹ stickers
**РџСЂРёС‡РёРЅР°:** РїСЂРµС„РёРєСЃ РІ `registry.js` РЅРµ СЃРѕРІРїР°РґР°РµС‚ СЃ РїСѓС‚С‘Рј РІ R2

**Р РµС€РµРЅРёРµ:** РїСЂРѕРІРµСЂРёС‚СЊ С‚РѕС‡РЅРѕРµ РЅР°РїРёСЃР°РЅРёРµ РїР°РїРѕРє РІ R2 (СЂРµРіРёСЃС‚СЂ, СЃР»РµС€Рё)

### РџСЂРѕР±Р»РµРјР°: 404 РЅР° РєР°СЂС‚РёРЅРєР°С…
**РџСЂРёС‡РёРЅР°:** РЅРµРїСЂР°РІРёР»СЊРЅС‹Р№ `STICKERS_PUBLIC_BASE_URL`

**Р РµС€РµРЅРёРµ:** РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ `https://pub-XXX.r2.dev` Р‘Р•Р- `/stickers`

### РџСЂРѕР±Р»РµРјР°: CORS РѕС€РёР±РєРё
**РџСЂРёС‡РёРЅР°:** РЅРµ РЅР°СЃС‚СЂРѕРµРЅ Public Access РґР»СЏ R2 bucket

**Р РµС€РµРЅРёРµ:** РІ Cloudflare R2 в†’ Settings в†’ Public Access в†’ Allow

