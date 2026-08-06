[CmdletBinding()]
param(
    [string]$SourceDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Noa-Source'),
    [string]$ApplicationDirectory = (Join-Path $env:LOCALAPPDATA 'Programs\Noa')
)

$ErrorActionPreference = 'Stop'
$BackupRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$SourceBackup = Join-Path $BackupRoot 'source'
$RuntimeBackup = Join-Path $BackupRoot 'runtime-data'
$NoaRuntimeBackup = Join-Path $RuntimeBackup 'noa'
$LegacyRuntimeBackup = Join-Path $RuntimeBackup 'trace-legacy'
$OllamaBackup = Join-Path $BackupRoot 'ollama-models'
$ApplicationBackup = Join-Path $BackupRoot 'application'
$ProgramsBackup = Join-Path $BackupRoot 'runtime-programs'

function Copy-Tree([string]$Source, [string]$Target) {
    if (-not (Test-Path $Source)) {
        return $false
    }

    New-Item -ItemType Directory -Force -Path $Target | Out-Null
    & robocopy $Source $Target /E /COPY:DAT /DCOPY:DAT /R:2 /W:2 /XJ /NFL /NDL /NP | Out-Null
    if ($LASTEXITCODE -ge 8) {
        throw "Falha ao restaurar $Source."
    }
    return $true
}

function New-DesktopShortcut([string]$Target) {
    if (-not (Test-Path $Target)) {
        return
    }

    $desktop = [Environment]::GetFolderPath('Desktop')
    $shortcutPath = Join-Path $desktop 'Noa.lnk'
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $Target
    $shortcut.WorkingDirectory = Split-Path $Target
    $shortcut.IconLocation = "$Target,0"
    $shortcut.Save()
}

function Find-RestoredExecutable([string]$Directory) {
    foreach ($name in @('Noa.exe', 'TRACE.exe', 'TRACE AI.exe')) {
        $candidate = Join-Path $Directory $name
        if (Test-Path $candidate) {
            return $candidate
        }
    }
    return $null
}

Write-Host 'Restaurando a Noa...' -ForegroundColor Cyan

Copy-Tree $SourceBackup $SourceDirectory | Out-Null
Copy-Tree $OllamaBackup (Join-Path $env:USERPROFILE '.ollama\models') | Out-Null

$hasSeparatedRuntime = (Test-Path $NoaRuntimeBackup) -or (Test-Path $LegacyRuntimeBackup)
if ($hasSeparatedRuntime) {
    Copy-Tree $NoaRuntimeBackup (Join-Path $env:LOCALAPPDATA 'Noa') | Out-Null
    Copy-Tree $LegacyRuntimeBackup (Join-Path $env:LOCALAPPDATA 'TRACE-AI') | Out-Null
}
elseif (Test-Path $RuntimeBackup) {
    Write-Warning 'Backup no formato antigo detectado. Os dados serão restaurados na pasta legada TRACE-AI.'
    Copy-Tree $RuntimeBackup (Join-Path $env:LOCALAPPDATA 'TRACE-AI') | Out-Null
}

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
$restoredExecutable = Find-RestoredExecutable $ApplicationDirectory

if ($hasPortableApplication -and $restoredExecutable) {
    New-DesktopShortcut $restoredExecutable
    Write-Host "`nBackup restaurado sem recompilação." -ForegroundColor Green
    Write-Host "Aplicativo: $restoredExecutable"
    Start-Process $restoredExecutable
    exit 0
}

Write-Warning 'O backup não contém um aplicativo portátil utilizável. O código será recompilado usando a internet quando necessário.'
$installer = Join-Path $SourceDirectory 'scripts\windows\powershell\Install-NoaComplete.ps1'
if (-not (Test-Path $installer)) {
    $installer = Join-Path $SourceDirectory 'scripts\windows\powershell\Install-TraceComplete.ps1'
}
if (-not (Test-Path $installer)) {
    throw 'O instalador completo não foi encontrado no código restaurado.'
}

& powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $installer
if ($LASTEXITCODE -ne 0) {
    throw 'Os dados foram restaurados, mas a recompilação da Noa falhou.'
}

Write-Host "`nRestauração concluída." -ForegroundColor Green
