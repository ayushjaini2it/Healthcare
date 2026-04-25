@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "c:\Users\hp\Downloads\app"
npx tsc --noEmit --skipLibCheck src/pages/PatientRegistration.tsx
echo Checking PatientRegistration.tsx specifically...
pause
