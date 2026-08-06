[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$SkipInstaller,
    [switch]$SkipComponentDownloads
)

$ErrorActionPreference = 'Stop'
$NoaInstaller = Join-Path $PSScriptRoot 'Install-NoaComplete.ps1'

Write-Warning 'Install-TraceComplete.ps1 é um nome legado. Encaminhando para o instalador oficial da Noa.'
& $NoaInstaller @PSBoundParameters
