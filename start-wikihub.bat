@echo off
title WikiHub

echo Starting WikiHub...

start "WikiHub API" cmd /k "cd WikiHub.Api && dotnet run"

timeout /t 3 /nobreak > nul

start "WikiHub UI" cmd /k "cd wikihub-ui && npm run dev"

timeout /t 3 /nobreak > nul

start http://localhost:5173

echo WikiHub is running!
echo Close the two terminal windows to stop.
