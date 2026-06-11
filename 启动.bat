@echo off
chcp 65001 >nul
title AI 角色工坊 — 本地服务器

echo.
echo   ================================
echo     AI 角色工坊
echo     http://localhost:8080
echo   ================================
echo.
echo   浏览器会自动打开。关闭这个窗口 = 停止服务。
echo.

where python >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] 用 Python 启动...
    start http://localhost:8080
    python -m http.server 8080 --directory "%CD%"
    goto :end
)

where python3 >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] 用 Python3 启动...
    start http://localhost:8080
    python3 -m http.server 8080 --directory "%CD%"
    goto :end
)

where npx >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] 用 Node.js 启动...
    start http://localhost:8080
    npx serve . --single -l 8080 --no-clipboard
    goto :end
)

echo.
echo   [X] 没找到 Python 或 Node.js
echo.
echo   请安装 Python: https://www.python.org/downloads/
echo   安装时勾选 "Add Python to PATH"
echo.
echo   装好后重新双击 启动.bat
echo.
pause

:end
