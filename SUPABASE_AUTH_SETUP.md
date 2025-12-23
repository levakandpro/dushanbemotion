# РќР°СЃС‚СЂРѕР№РєР° Supabase Auth

## вњ… Р§С‚Рѕ СѓР¶Рµ СЃРґРµР»Р°РЅРѕ РІ РєРѕРґРµ:

1. **РњРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ AuthModal** (`src/editorV2/splash/AuthModal.jsx`)
   - Р’РєР»Р°РґРєРё LOGIN Рё REGISTER
   - Р¤РѕСЂРјР° РІС…РѕРґР° СЃ РїРѕР»СЏРјРё Email/Password
   - Р¤РѕСЂРјР° СЂРµРіРёСЃС‚СЂР°С†РёРё
   - РљРЅРѕРїРєР° "Р-Р°Р±С‹Р»Рё РїР°СЂРѕР»СЊ?"
   - OAuth С‡РµСЂРµР· Google
   - РРЅС‚РµРіСЂР°С†РёСЏ СЃ Supabase Auth

2. **РћР±РЅРѕРІР»РµРЅРЅС‹Р№ SplashHeader** (`src/editorV2/splash/SplashHeader.jsx`)
   - РљРЅРѕРїРєР° "Р’С…РѕРґ" РѕС‚РєСЂС‹РІР°РµС‚ РјРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ
   - РџРѕСЃР»Рµ РІС…РѕРґР° РїРѕРєР°Р·С‹РІР°РµС‚СЃСЏ Р°РІР°С‚Р°СЂ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
   - РњРµРЅСЋ СЃ РѕРїС†РёСЏРјРё: "РњРѕРё РїСЂРѕРµРєС‚С‹", "РќР°СЃС‚СЂРѕР№РєРё", "Р’С‹Р№С‚Рё"

3. **РЎС‚СЂР°РЅРёС†С‹ Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёРё:**
   - `/auth/reset-password` - СЃР±СЂРѕСЃ РїР°СЂРѕР»СЏ (ResetPasswordPage.tsx)
   - `/auth/confirmed` - РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ email (ConfirmedPage.tsx)
   - `/auth/callback` - РѕР±СЂР°Р±РѕС‚РєР° OAuth callback (CallbackPage.tsx)

4. **РћР±РЅРѕРІР»РµРЅРЅС‹Р№ useAuth** (`src/lib/useAuth.ts`)
   - РСЃРїРѕР»СЊР·СѓРµС‚ `supabase.auth.getSession()`
   - РЎР»СѓС€Р°РµС‚ РёР·РјРµРЅРµРЅРёСЏ С‡РµСЂРµР· `onAuthStateChange`
   - РЈР±СЂР°РЅР° РІСЂРµРјРµРЅРЅР°СЏ Р»РѕРіРёРєР° СЃ temp_user_id

## вљ™пёЏ Р§С‚Рѕ РЅСѓР¶РЅРѕ РЅР°СЃС‚СЂРѕРёС‚СЊ РІ Supabase Dashboard:

### 1. SMTP РЅР°СЃС‚СЂРѕР№РєРё
РџСЂРѕРІРµСЂСЊС‚Рµ РІ Supabase Dashboard в†’ Authentication в†’ Settings в†’ SMTP Settings:
- **Host**: smtp.gmail.com
- **Port**: 587
- **Username**: РІР°С€ email (natopchane@gmail.com)
- **Password**: РїР°СЂРѕР»СЊ РїСЂРёР»РѕР¶РµРЅРёСЏ Gmail
- **From email**: natopchane@gmail.com
- **From name**: DMOTION
- **TLS**: enabled

### 2. Email Templates
Р’ Supabase Dashboard в†’ Authentication в†’ Email Templates РїСЂРѕРІРµСЂСЊС‚Рµ, С‡С‚Рѕ РІРєР»СЋС‡РµРЅС‹:
- вњ… Confirm signup
- вњ… Magic link
- вњ… Reset password
- вњ… Change email
- вњ… Invite user
- вњ… Reauthentication

### 3. Security Notifications
Р’ Supabase Dashboard в†’ Authentication в†’ Settings в†’ Security Notifications РІРєР»СЋС‡РёС‚Рµ:
- вњ… Password changed вЂ” ON
- вњ… Email changed вЂ” ON
- вњ… Phone number changed вЂ” ON (РµСЃР»Рё РёСЃРїРѕР»СЊР·СѓРµС‚Рµ phone auth)
- вњ… Identity linked вЂ” ON
- вњ… Identity unlinked вЂ” ON

### 4. Redirect URLs
Р’ Supabase Dashboard в†’ Authentication в†’ URL Configuration:
- **Site URL**: https://dmotion.tj
- **Redirect URLs**:
  - https://dmotion.tj/*
  - http://localhost:5173/*
  - https://dmotion.tj/auth/callback
  - https://dmotion.tj/auth/confirmed
  - https://dmotion.tj/auth/reset-password

### 5. OAuth Providers
Р’ Supabase Dashboard в†’ Authentication в†’ Providers:
- Р’РєР»СЋС‡РёС‚Рµ Google OAuth
- РќР°СЃС‚СЂРѕР№С‚Рµ Client ID Рё Client Secret
- Р”РѕР±Р°РІСЊС‚Рµ redirect URL: `https://dmotion.tj/auth/callback`

## рџ“ќ РџРµСЂРµРјРµРЅРЅС‹Рµ РѕРєСЂСѓР¶РµРЅРёСЏ

РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ РІ `.env` С„Р°Р№Р»Рµ РµСЃС‚СЊ:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## рџ§Є РўРµСЃС‚РёСЂРѕРІР°РЅРёРµ

1. **Р РµРіРёСЃС‚СЂР°С†РёСЏ:**
   - РћС‚РєСЂРѕР№С‚Рµ СЃС‚СЂР°РЅРёС†Сѓ СЃРїР»СЌС€Р°
   - РЎРІР°Р№Рї РІРЅРёР· в†’ РїРѕСЏРІРёС‚СЃСЏ С€Р°РїРєР°
   - РљР»РёРє РЅР° "Р’С…РѕРґ" в†’ РјРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ
   - Р’РєР»Р°РґРєР° "Р Р•Р“РРЎРўР РђР¦РРЇ"
   - Р’РІРµРґРёС‚Рµ email Рё РїР°СЂРѕР»СЊ
   - РџРѕСЃР»Рµ СЂРµРіРёСЃС‚СЂР°С†РёРё РґРѕР»Р¶РЅРѕ РїРѕСЏРІРёС‚СЊСЃСЏ СЃРѕРѕР±С‰РµРЅРёРµ "РџРёСЃСЊРјРѕ РѕС‚РїСЂР°РІР»РµРЅРѕ, РїРѕРґС‚РІРµСЂРґРёС‚Рµ email"

2. **РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ email:**
   - РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕС‡С‚Сѓ
   - РљР»РёРє РЅР° СЃСЃС‹Р»РєСѓ РІ РїРёСЃСЊРјРµ
   - Р”РѕР»Р¶РµРЅ СЂРµРґРёСЂРµРєС‚ РЅР° `/auth/confirmed`
   - РџРѕСЃР»Рµ РєР»РёРєР° "Р’РѕР№С‚Рё" в†’ РІС…РѕРґ РІ СЃРёСЃС‚РµРјСѓ

3. **Р’С…РѕРґ:**
   - РљР»РёРє РЅР° "Р’С…РѕРґ" РІ С€Р°РїРєРµ
   - Р’РІРµРґРёС‚Рµ email Рё РїР°СЂРѕР»СЊ
   - РџРѕСЃР»Рµ РІС…РѕРґР° в†’ Р°РІР°С‚Р°СЂ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РІ С€Р°РїРєРµ

4. **РЎР±СЂРѕСЃ РїР°СЂРѕР»СЏ:**
   - Р’ РјРѕРґР°Р»СЊРЅРѕРј РѕРєРЅРµ РІС…РѕРґР° в†’ "Р-Р°Р±С‹Р»Рё РїР°СЂРѕР»СЊ?"
   - Р’РІРµРґРёС‚Рµ email
   - РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕС‡С‚Сѓ
   - РљР»РёРє РЅР° СЃСЃС‹Р»РєСѓ в†’ `/auth/reset-password?access_token=...`
   - Р’РІРµРґРёС‚Рµ РЅРѕРІС‹Р№ РїР°СЂРѕР»СЊ
   - РџРѕСЃР»Рµ СЃРѕС…СЂР°РЅРµРЅРёСЏ в†’ СЂРµРґРёСЂРµРєС‚ РЅР° `/auth/login?success=1`

5. **OAuth (Google):**
   - Р’ РјРѕРґР°Р»СЊРЅРѕРј РѕРєРЅРµ в†’ "Р’РѕР№С‚Рё С‡РµСЂРµР· Google"
   - Р”РѕР»Р¶РµРЅ РѕС‚РєСЂС‹С‚СЊСЃСЏ OAuth РїСЂРѕРІР°Р№РґРµСЂ
   - РџРѕСЃР»Рµ Р°РІС‚РѕСЂРёР·Р°С†РёРё в†’ СЂРµРґРёСЂРµРєС‚ РЅР° `/auth/callback`
   - Р-Р°С‚РµРј в†’ `/dashboard`

## рџ”’ Р-Р°С‰РёС‰РµРЅРЅС‹Рµ РјР°СЂС€СЂСѓС‚С‹

Р’СЃРµ РјР°СЂС€СЂСѓС‚С‹ `/dashboard/*` Рё `/editor*` Р·Р°С‰РёС‰РµРЅС‹ С‡РµСЂРµР· `ProtectedRoute`:
- Р•СЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ Р°РІС‚РѕСЂРёР·РѕРІР°РЅ в†’ СЂРµРґРёСЂРµРєС‚ РЅР° `/auth/login`
- Р•СЃР»Рё Р°РІС‚РѕСЂРёР·РѕРІР°РЅ в†’ РґРѕСЃС‚СѓРї СЂР°Р·СЂРµС€РµРЅ

