@echo off
echo Starting Cloudflare Tunnel...
echo.
C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe tunnel --url http://localhost:3000
pause
