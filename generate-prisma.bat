@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."
node_modules\.bin\prisma generate
