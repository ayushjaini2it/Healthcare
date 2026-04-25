@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "c:\Users\hp\Downloads\app"
npx tsc --noEmit --skipLibCheck src/main.tsx
echo Checking main.tsx specifically...
pause
