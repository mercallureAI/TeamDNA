@echo off
REM dna-index.bat — Scan MD files and generate .teamdna\index.md
setlocal enabledelayedexpansion

set "REPO_DIR=%~1"
if "%REPO_DIR%"=="" set "REPO_DIR=."
set "INDEX_FILE=%REPO_DIR%\.teamdna\index.md"

if not exist "%REPO_DIR%\.teamdna" mkdir "%REPO_DIR%\.teamdna"

echo | 标题 | 标签 | 路径 | 摘要 |> "%INDEX_FILE%"
echo |------|------|------|------|>> "%INDEX_FILE%"

for %%D in (pitfalls standards solutions) do (
  if exist "%REPO_DIR%\%%D" (
    for /r "%REPO_DIR%\%%D" %%F in (*.md) do (
      set "FILEPATH=%%F"
      set "RELPATH=!FILEPATH:%REPO_DIR%\=!"
      set "TITLE="
      set "TAGS=-"
      set "SCENE=-"
      for /f "usebackq tokens=*" %%L in ("%%F") do (
        if not defined TITLE (
          set "LINE=%%L"
          if "!LINE:~0,2!"=="# " set "TITLE=!LINE:~2!"
        )
      )
      if not defined TITLE set "TITLE=%%~nF"
      echo | !TITLE! | !TAGS! | !RELPATH! | !SCENE! |>> "%INDEX_FILE%"
    )
  )
)

echo [dna-index] Index rebuilt: %INDEX_FILE%
