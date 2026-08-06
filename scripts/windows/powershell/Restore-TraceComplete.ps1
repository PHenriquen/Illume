[CmdletBinding()]
param(
    [string]$SourceDirectory = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Noa-Source'),
    [string]$ApplicationDirectory = (Join-Path $env:LOCALAPPDATA 'Programs\Noa')
)

$ErrorActionPreference = 'Stop'
$NoaRestore = Join-Path $PSScriptRoot 'Restore-NoaComplete.ps1'

Write-Warning 'Restore-TraceComplete.ps1 é um nome legado. Encaminhando para a restauração oficial da Noa.'
& $NoaRestore @PSBoundParameters
