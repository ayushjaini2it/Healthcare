@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "c:\Users\hp\Downloads\app"
npx tsc --noEmit --skipLibCheck src/pages/Pharmacy.tsx
echo Checking Pharmacy.tsx specifically...
pause
