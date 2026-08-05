[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$SkipInstaller,
    [switch]$SkipComponentDownloads
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
Set-Location $ProjectRoot

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Refresh-Path {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user"
}

function Test-Command([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Install-WingetPackage([string]$Id, [string]$DisplayName) {
    if (-not (Test-Command 'winget')) {
        throw 'winget não foi encontrado. Atualize o App Installer pela Microsoft Store.'
    }
    Write-Step "Instalando $DisplayName"
    & winget install --id $Id -e --scope user --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        & winget install --id $Id -e --silent --accept-package-agreements --accept-source-agreements
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao instalar $DisplayName."
    }
    Refresh-Path
}

function Resolve-Python {
    if (Test-Command 'py') {
        return [pscustomobject]@{ Exe = 'py'; Arguments = @('-3') }
    }
    if (Test-Command 'python') {
        return [pscustomobject]@{ Exe = 'python'; Arguments = @() }
    }
    $candidate = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python313\python.exe'
    if (Test-Path $candidate) {
        return [pscustomobject]@{ Exe = $candidate; Arguments = @() }
    }
    throw 'Python não foi encontrado mesmo depois da instalação.'
}

Write-Host 'TRACE AI — instalação completa e restaurável' -ForegroundColor White
Write-Host 'Código, aplicativo, IA local, reconhecimento de voz, voz neural e documentos.'

if (-not (Test-Command 'node')) {
    Install-WingetPackage 'OpenJS.NodeJS.LTS' 'Node.js LTS'
}
if (-not (Test-Command 'npm')) {
    Refresh-Path
}
if (-not (Test-Command 'npm')) {
    throw 'npm não foi encontrado. Reinicie o Windows e execute este instalador novamente.'
}

if (-not (Test-Command 'py') -and -not (Test-Command 'python')) {
    Install-WingetPackage 'Python.Python.3.13' 'Python 3.13'
}

if (-not (Test-Command 'ollama')) {
    Install-WingetPackage 'Ollama.Ollama' 'Ollama'
}

$pythonCommand = Resolve-Python

Write-Step 'Criando ambiente Python isolado'
if (-not (Test-Path '.venv\Scripts\python.exe')) {
    $pythonArguments = @($pythonCommand.Arguments)
    & $pythonCommand.Exe @pythonArguments -m venv .venv
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar o ambiente Python.' }
}
$venvPython = (Resolve-Path '.venv\Scripts\python.exe').Path

Write-Step 'Instalando dependências do projeto'
& npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Falha no npm ci.' }

Write-Step 'Validando código e testes'
& npm run check
if ($LASTEXITCODE -ne 0) { throw 'A validação do projeto falhou.' }

if (-not $SkipBuild) {
    Write-Step 'Compilando interface'
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw 'O build da interface falhou.' }
}

if (-not $SkipComponentDownloads) {
    Write-Step 'Preparando IA, Whisper, Piper e leitor de documentos'
    & $venvPython -m backend.setup --all
    if ($LASTEXITCODE -ne 0) {
        throw 'Um ou mais componentes locais não foram preparados. Revise a mensagem acima.'
    }
}

if (-not $SkipInstaller) {
    Write-Step 'Gerando instalador do Windows'
    & npm run desktop:installer
    if ($LASTEXITCODE -ne 0) { throw 'A geração do instalador falhou.' }
}

Write-Step 'Verificando componentes locais'
& $venvPython -m backend.setup --status
if ($LASTEXITCODE -ne 0) {
    Write-Warning 'O aplicativo foi preparado, mas algum componente opcional ainda está ausente.'
}

Write-Host "`nTRACE AI preparado com sucesso." -ForegroundColor Green
Write-Host "Dados locais: $env:LOCALAPPDATA\TRACE-AI"
Write-Host "Modelos Ollama: $env:USERPROFILE\.ollama\models"
if (Test-Path 'release') {
    Start-Process explorer.exe (Resolve-Path 'release').Path
}
