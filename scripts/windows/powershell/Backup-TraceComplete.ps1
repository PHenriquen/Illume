[CmdletBinding()]
param(
    [string]$Destination,
    [switch]$WithoutOllamaModels
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
if ([string]::IsNullOrWhiteSpace($Destination)) {
    $Destination = Join-Path ([Environment]::GetFolderPath('Desktop')) "TRACE-AI-Backup-$timestamp"
}
$Destination = [IO.Path]::GetFullPath($Destination)
$SourceBackup = Join-Path $Destination 'source'
$RuntimeBackup = Join-Path $Destination 'runtime-data'
$OllamaBackup = Join-Path $Destination 'ollama-models'
$ApplicationBackup = Join-Path $Destination 'application'
$RuntimeProgramsBackup = Join-Path $Destination 'runtime-programs'
$ToolsBackup = Join-Path $Destination 'restore-tools'

function Copy-Tree([string]$Source, [string]$Target, [string[]]$ExcludeDirectories = @()) {
    if ([string]::IsNullOrWhiteSpace($Source) -or -not (Test-Path $Source)) { return $false }
    New-Item -ItemType Directory -Force -Path $Target | Out-Null
    $arguments = @($Source, $Target, '/E', '/COPY:DAT', '/DCOPY:DAT', '/R:2', '/W:2', '/XJ', '/NFL', '/NDL', '/NP')
    foreach ($item in $ExcludeDirectories) {
        $arguments += @('/XD', (Join-Path $Source $item))
    }
    & robocopy @arguments | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Falha ao copiar $Source." }
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

Write-Host "Criando backup completo em: $Destination" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $Destination | Out-Null

Copy-Tree $ProjectRoot $SourceBackup @('.git', 'node_modules', 'dist', 'release', '.venv', '__pycache__', '.trace-data') | Out-Null

$runtime = Join-Path $env:LOCALAPPDATA 'TRACE-AI'
$hasRuntimeData = Copy-Tree $runtime $RuntimeBackup

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
Copy-Item (Join-Path $PSScriptRoot 'Restore-TraceComplete.ps1') $ToolsBackup -Force
Copy-Item (Join-Path $ProjectRoot 'backup-tools\RESTAURAR_TRACE_COMPLETO.bat') $Destination -Force

$manifest = [ordered]@{
    format = 2
    product = 'TRACE AI'
    version = '1.0.2'
    createdAt = (Get-Date).ToString('o')
    computer = $env:COMPUTERNAME
    architecture = $env:PROCESSOR_ARCHITECTURE
    includesSource = $true
    includesPortableApplication = [bool]$hasApplication
    includesRuntimeData = [bool]$hasRuntimeData
    includesOllamaModels = [bool]$hasOllamaModels
    includesPythonRuntime = [bool]$hasPython
    includesOllamaRuntime = [bool]$hasOllamaRuntime
    runtimeSource = $runtime
    ollamaModelsSource = (Join-Path $env:USERPROFILE '.ollama\models')
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 (Join-Path $Destination 'backup-manifest.json')

@'
TRACE AI — BACKUP COMPLETO

Execute RESTAURAR_TRACE_COMPLETO.bat para restaurar em outro Windows x64.

Quando todos os itens estavam instalados durante a criação, este backup contém:
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
if (-not $hasApplication -or -not $hasRuntimeData -or -not $hasOllamaModels -or -not $hasPython -or -not $hasOllamaRuntime) {
    Write-Warning 'Alguns componentes não existiam neste computador e não foram incluídos. Consulte backup-manifest.json.'
}
Start-Process explorer.exe $Destination
