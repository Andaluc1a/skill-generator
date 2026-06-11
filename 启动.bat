@echo off
chcp 65001 >nul
title AI 角色工坊

echo ================================
echo   AI 角色工坊
echo ================================
echo.
echo 正在启动本地服务器...
echo.

REM 尝试用 Python 启动
where python >nul 2>&1
if %errorlevel% equ 0 (
    start http://localhost:8080
    python -m http.server 8080 --directory "%CD%"
    exit
)

REM 尝试用 npx 启动（需要 Node.js）
where npx >nul 2>&1
if %errorlevel% equ 0 (
    start http://localhost:8080
    npx serve . -l 8080 --no-clipboard --single
    exit
)

REM 都不行，给出提示
echo 请安装 Python 或 Node.js 后重试。
echo Python: https://www.python.org/downloads/
echo Node.js: https://nodejs.org/
echo.
echo 或者手动把 dist 文件夹拖到浏览器网址栏里看看。
pause
