@echo off
REM ===== DushanbeMotion - DEV start with auto-firewall =====

REM Переходим в папку с проектом (где лежит этот файл)
cd /d "%~dp0"

echo ========================================
echo   DushanbeMotion - DEV START
echo ========================================
echo.

REM Проверка наличия Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found!
  echo Install from: https://nodejs.org
  pause
  exit /b 1
)

REM Устанавливаем зависимости, только если нет node_modules
if not exist "node_modules" (
  echo [1/3] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
  echo.
)

REM Определяем локальный IP
echo [2/3] Detecting local IP...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
  set LOCAL_IP=%%a
  goto :ip_found
)
:ip_found
REM Убираем пробелы
set LOCAL_IP=%LOCAL_IP: =%

REM Открываем порт в брандмауэре (тихо, без ошибок если уже открыт)
echo [3/3] Opening firewall port 5173...
netsh advfirewall firewall show rule name="Vite Dev 5173" >nul 2>nul
if errorlevel 1 (
  REM Правило не существует, пытаемся создать
  netsh advfirewall firewall add rule name="Vite Dev 5173" dir=in action=allow protocol=TCP localport=5173 >nul 2>nul
  if errorlevel 1 (
    echo [WARN] Could not open port automatically.
    echo Run this script as Administrator or open port 5173 manually.
  ) else (
    echo Port 5173 opened successfully!
  )
) else (
  echo Port 5173 already open.
)

echo.
echo ========================================
echo   SERVER STARTING...
echo ========================================
echo.
echo   PC:     http://localhost:5173
if defined LOCAL_IP (
  echo   Mobile: http://%LOCAL_IP%:5173
)
echo.
echo Keep this window open while testing.
echo Press Ctrl+C to stop the server.
echo ========================================
echo.

REM Запуск Vite с доступом из сети
call npm run dev -- --host 0.0.0.0 --port 5173

echo.
echo ========================================
echo   Server stopped.
echo ========================================
pause
