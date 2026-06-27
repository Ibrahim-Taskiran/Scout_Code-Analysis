@echo off
title Scout Code Analysis
set PATH=C:\Program Files\nodejs;%~dp0node_modules\.bin;%PATH%
cd /d "%~dp0"
call npx electron .
pause
