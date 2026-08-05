[CmdletBinding()]
param(
    [string]$SourceDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'TRACE-AI-Source'),
    [string]$ApplicationDirectory = (Join-Path $env:LOCALAPPDATA 'Programs\TRACE-AI')
)

$ErrorActionPreference = 'Stop'
$BackupRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$SourceBackup = Join-Path $BackupRoot 'source'
$RuntimeBackup = Join-Path $BackupRoot 'runtime-data'
$OllamaBackup = Join-Path $BackupRoot 'ollama-models'
$ApplicationBackup = Join-Path $BackupRoot 'application'
$ProgramsBackup = Join-Path $BackupRoot 'runtime-programs'

function Copy-Tree([string]$Source, [string]$Target) {
    if (-not (Test-Path $Source)) { return $false }
    New-Item -ItemType Directory -Force -Path $Target | Out-Null
    & robocopy $Source $Target /E /COPY:DAT /DCOPY:DAT /R:2 /W:2 /XJ /NFL /NDL /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Falha ao restaurar $Source." }
    return $true
}

function New-DesktopShortcut([string]$Target) {
    if (-not (Test-Path $Target)) { return }
    $desktop = [Environment]::GetFolderPath('Desktop')
    $shortcutPath = Join-Path $desktop 'TRACE AI.lnk'
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $Target
    $shortcut.WorkingDirectory = Split-Path $Target
    $shortcut.IconLocation = "$Target,0"
    $shortcut.Save()
}

Write-Host 'Restaurando TRACE AI...' -ForegroundColor Cyan

Copy-Tree $SourceBackup $SourceDirectory | Out-Null
Copy-Tree $RuntimeBackup (Join-Path $env:LOCALAPPDATA 'TRACE-AI') | Out-Null
Copy-Tree $OllamaBackup (Join-Path $env:USERPROFILE '.ollama\models') | Out-Null

$pythonBackup = Join-Path $ProgramsBackup 'Python'
if (Test-Path $pythonBackup) {
    $pythonDestination = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python313'
    Copy-Tree $pythonBackup $pythonDestination | Out-Null
}

$ollamaRuntimeBackup = Join-Path $ProgramsBackup 'Ollama'
if (Test-Path $ollamaRuntimeBackup) {
    $ollamaDestination = Join-Path $env:LOCALAPPDATA 'Programs\Ollama'
    Copy-Tree $ollamaRuntimeBackup $ollamaDestination | Out-Null
}

$hasPortableApplication = Copy-Tree $ApplicationBackup $ApplicationDirectory
$traceExecutable = Join-Path $ApplicationDirectory 'TRACE.exe'

if ($hasPortableApplication -and (Test-Path $traceExecutable)) {
    New-DesktopShortcut $traceExecutable
    Write-Host "`nBackup restaurado sem recompilação." -ForegroundColor Green
    Write-Host "Aplicativo: $traceExecutable"
    Start-Process $traceExecutable
    exit 0
}

Write-Warning 'O backup não contém o aplicativo portátil. O código será recompilado usando a internet quando necessário.'
$installer = Join-Path $SourceDirectory 'scripts\windows\powershell\Install-TraceComplete.ps1'
if (-not (Test-Path $installer)) {
    throw 'O instalador completo não foi encontrado no código restaurado.'
}

& powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $installer
if ($LASTEXITCODE -ne 0) {
    throw 'Os dados foram restaurados, mas a recompilação do aplicativo falhou.'
}

Write-Host "`nRestauração concluída." -ForegroundColor Green
