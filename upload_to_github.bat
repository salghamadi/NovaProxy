@echo off
chcp 65001 >nul
title رفع مشروع NovaProxy إلى GitHub
color 0b

echo.
echo ========================================================
echo         🚀 أداة رفع مشروع NovaProxy إلى GitHub
echo ========================================================
echo.
echo 1. تأكد أنك قمت بإنشاء مستودع فارغ (New repository) في حسابك على GitHub.
echo 2. انسخ رابط المستودع الذي ينتهي بـ .git
echo    (مثال: https://github.com/Username/NovaProxy.git)
echo.
echo ========================================================
echo.

set /p REPO_URL=">> الصق رابط المستودع هنا ثم اضغط Enter: "

if "%REPO_URL%"=="" (
    echo.
    echo [خطأ] لم تقم بإدخال الرابط! حاول مرة أخرى.
    pause
    exit /b
)

echo.
echo جارٍ ربط المستودع...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo.
echo جارٍ رفع الملفات إلى فرع main...
echo (ملاحظة: إذا ظهرت نافذة تسجيل الدخول إلى GitHub في المتصفح، وافق عليها لإكمال الرفع)
echo.

git branch -M main
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  🎉 تم رفع جميع ملفات المشروع إلى GitHub بنجاح!
    echo ========================================================
) else (
    echo.
    echo [ملاحظة] حدث خطأ أو تم إلغاء تسجيل الدخول. تأكد من صحة الرابط والصلاحيات.
)

echo.
pause
