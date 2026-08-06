[CmdletBinding()]
param(
    [string]$Destination,
    [switch]$WithoutOllamaModels
)

$ErrorActionPreference = 'Stop'
$NoaBackup = Join-Path $PSScriptRoot 'Backup-NoaComplete.ps1'

Write-Warning 'Backup-TraceComplete.ps1 é um nome legado. Encaminhando para o backup oficial da Noa.'
& $NoaBackup @PSBoundParameters
