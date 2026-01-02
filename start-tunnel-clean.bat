@echo off
echo Checking Cloudflare Tunnel Status...
echo.

REM Kill existing tunnels
taskkill /F /IM cloudflared.exe 2>nul

echo Starting fresh tunnel...
echo.

REM Start tunnel and capture output
C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe tunnel --url http://localhost:3000

pause
