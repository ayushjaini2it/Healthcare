@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "c:\Users\hp\Downloads\app"
npx tsc --noEmit --skipLibCheck src/App.tsx
echo Checking App.tsx specifically...
pause
