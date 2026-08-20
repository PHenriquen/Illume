[CmdletBinding()]
param(
    [string]$Destination,
    [switch]$WithoutOllamaModels
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
if ([string]::IsNullOrWhiteSpace($Destination)) {
    $Destination = Join-Path ([Environment]::GetFolderPath('Desktop')) "Noa-Backup-$timestamp"
}

$Destination = [IO.Path]::GetFullPath($Destination)
$SourceBackup = Join-Path $Destination 'source'
$RuntimeBackup = Join-Path $Destination 'runtime-data'
$NoaRuntimeBackup = Join-Path $RuntimeBackup 'noa'
$LegacyRuntimeBackup = Join-Path $RuntimeBackup 'trace-legacy'
$OllamaBackup = Join-Path $Destination 'ollama-models'
$ApplicationBackup = Join-Path $Destination 'application'
$RuntimeProgramsBackup = Join-Path $Destination 'runtime-programs'
$ToolsBackup = Join-Path $Destination 'restore-tools'

function Copy-Tree([string]$Source, [string]$Target, [string[]]$ExcludeDirectories = @()) {
    if ([string]::IsNullOrWhiteSpace($Source) -or -not (Test-Path $Source)) {
        return $false
    }

    New-Item -ItemType Directory -Force -Path $Target | Out-Null
    $arguments = @($Source, $Target, '/E', '/COPY:DAT', '/DCOPY:DAT', '/R:2', '/W:2', '/XJ', '/NFL', '/NDL', '/NP')
    foreach ($item in $ExcludeDirectories) {
        $arguments += @('/XD', (Join-Path $Source $item))
    }

    & robocopy @arguments | Out-Null
    if ($LASTEXITCODE -ge 8) {
        throw "Falha ao copiar $Source."
    }
    return $true
}

function First-ExistingPath([string[]]$Candidates) {
    foreach ($candidate in $Candidates) {
        if (-not [string]::IsNullOrWhiteSpace($candidate) -and (Test-Path $candidate)) {
            return (Resolve-Path $candidate).Path
        }
    }
    return $null
}

Write-Host "Criando backup completo da Noa em: $Destination" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $Destination | Out-Null

Copy-Tree $ProjectRoot $SourceBackup @('.git', 'node_modules', 'dist', 'release', '.venv', '__pycache__', '.trace-data', '.noa-data') | Out-Null

$noaRuntime = Join-Path $env:LOCALAPPDATA 'Noa'
$legacyRuntime = Join-Path $env:LOCALAPPDATA 'TRACE-AI'
$hasNoaRuntime = Copy-Tree $noaRuntime $NoaRuntimeBackup
$hasLegacyRuntime = Copy-Tree $legacyRuntime $LegacyRuntimeBackup

$hasOllamaModels = $false
if (-not $WithoutOllamaModels) {
    $models = Join-Path $env:USERPROFILE '.ollama\models'
    $hasOllamaModels = Copy-Tree $models $OllamaBackup
}

$portableApplication = Join-Path $ProjectRoot 'release\win-unpacked'
$hasApplication = Copy-Tree $portableApplication $ApplicationBackup
if (-not $hasApplication) {
    Write-Warning 'A versão portátil não existe. O backup terá o código, mas precisará recompilar o aplicativo na restauração.'
}

$pythonHome = First-ExistingPath @(
    (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python313'),
    (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python312')
)
$hasPython = Copy-Tree $pythonHome (Join-Path $RuntimeProgramsBackup 'Python')

$ollamaHome = First-ExistingPath @(
    (Join-Path $env:LOCALAPPDATA 'Programs\Ollama'),
    (Join-Path $env:LOCALAPPDATA 'Ollama')
)
$hasOllamaRuntime = Copy-Tree $ollamaHome (Join-Path $RuntimeProgramsBackup 'Ollama')

New-Item -ItemType Directory -Force -Path $ToolsBackup | Out-Null
Copy-Item (Join-Path $PSScriptRoot 'Restore-NoaComplete.ps1') $ToolsBackup -Force
Copy-Item (Join-Path $ProjectRoot 'scripts\windows\RESTAURAR_NOA_COMPLETO.bat') $Destination -Force

$package = Get-Content (Join-Path $ProjectRoot 'package.json') -Raw | ConvertFrom-Json
$manifest = [ordered]@{
    format = 3
    product = 'Noa'
    version = [string]$package.version
    createdAt = (Get-Date).ToString('o')
    computer = $env:COMPUTERNAME
    architecture = $env:PROCESSOR_ARCHITECTURE
    compatibility = [ordered]@{
        preservesTraceData = $true
        legacyProduct = 'TRACE AI'
    }
    includesSource = $true
    includesPortableApplication = [bool]$hasApplication
    includesNoaRuntimeData = [bool]$hasNoaRuntime
    includesLegacyRuntimeData = [bool]$hasLegacyRuntime
    includesOllamaModels = [bool]$hasOllamaModels
    includesPythonRuntime = [bool]$hasPython
    includesOllamaRuntime = [bool]$hasOllamaRuntime
    runtimeSources = [ordered]@{
        noa = $noaRuntime
        traceLegacy = $legacyRuntime
    }
    ollamaModelsSource = (Join-Path $env:USERPROFILE '.ollama\models')
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 (Join-Path $Destination 'backup-manifest.json')

@'
NOA — BACKUP COMPLETO

Execute RESTAURAR_NOA_COMPLETO.bat para restaurar em outro Windows x64.

O backup preserva separadamente os dados atuais da Noa e os dados legados do TRACE.
Isso evita sobrescrever preferências antigas durante a migração de identidade.

Quando os componentes existiam durante a criação, esta pasta contém:
- aplicativo portátil pronto;
- código-fonte organizado;
- Python usado pelo núcleo;
- Ollama e seus modelos;
- Whisper e o modelo de transcrição;
- Piper e a voz neural pt-BR;
- leitor de documentos;
- memória e preferências locais.

A pasta pode ocupar vários gigabytes. Copie-a para um HD externo ou armazenamento confiável.
Não envie runtime-data, runtime-programs ou ollama-models para o Git comum.
'@ | Set-Content -Encoding UTF8 (Join-Path $Destination 'LEIA-ME.txt')

Write-Host "`nBackup concluído." -ForegroundColor Green
if (-not $hasApplication -or (-not $hasNoaRuntime -and -not $hasLegacyRuntime) -or -not $hasOllamaModels -or -not $hasPython -or -not $hasOllamaRuntime) {
    Write-Warning 'Alguns componentes não existiam neste computador e não foram incluídos. Consulte backup-manifest.json.'
}
Start-Process explorer.exe $Destination
