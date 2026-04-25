@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "c:\Users\hp\Downloads\app"
npx tsc --project . --noEmit --skipLibCheck src/main.tsx
echo Checking main.tsx with project config...
pause
