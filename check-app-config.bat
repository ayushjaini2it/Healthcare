@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "c:\Users\hp\Downloads\app"
npx tsc --project . --noEmit --skipLibCheck
echo TypeScript check completed with tsconfig.json settings
pause
