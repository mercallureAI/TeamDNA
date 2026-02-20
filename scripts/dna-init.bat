@echo off
REM dna-init.bat — Initialize TeamDNA: clone repo, write config, install skills
setlocal

set "REPO_URL=%~1"
if "%REPO_URL%"=="" (
  echo Usage: dna-init.bat ^<repo-url^> [clone-path]
  exit /b 1
)

set "SCRIPT_DIR=%~dp0.."
set "CLONE_DIR=%~2"
if "%CLONE_DIR%"=="" set "CLONE_DIR=%USERPROFILE%\teamdna-repo"
set "CONFIG_DIR=%USERPROFILE%\.teamdna"
set "SKILLS_DIR=%USERPROFILE%\.claude\skills"

REM 1. Clone repo
if exist "%CLONE_DIR%" (
  echo [dna-init] Repo already exists at %CLONE_DIR%, pulling latest...
  git -C "%CLONE_DIR%" pull
) else (
  echo [dna-init] Cloning %REPO_URL% to %CLONE_DIR%...
  git clone "%REPO_URL%" "%CLONE_DIR%"
)

REM 2. Write config
if not exist "%CONFIG_DIR%\" mkdir "%CONFIG_DIR%"
echo repo_path=%CLONE_DIR%> "%CONFIG_DIR%\config"
echo [dna-init] Config written to %CONFIG_DIR%\config

REM 3. Install skills
if not exist "%SKILLS_DIR%\" mkdir "%SKILLS_DIR%"
copy /y "%SCRIPT_DIR%\skills\*.md" "%SKILLS_DIR%\" >nul
echo [dna-init] Skills installed to %SKILLS_DIR%

echo [dna-init] Done! Use /dna-search, /dna-push, /dna-pull, /dna-index in Claude Code.
