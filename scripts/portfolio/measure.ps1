$ErrorActionPreference = "Stop"

function Measure-Step {
    param(
        [string]$Name,
        [scriptblock]$Command
    )

    $watch = [System.Diagnostics.Stopwatch]::StartNew()
    & $Command
    $exit = $LASTEXITCODE
    $watch.Stop()

    if ($exit -ne $null -and $exit -ne 0) {
        throw "$Name failed with exit code $exit"
    }

    return [ordered]@{
        name = $Name
        duration_ms = [math]::Round($watch.Elapsed.TotalMilliseconds)
    }
}

$results = @()
$results += Measure-Step "typecheck" { npm run typecheck }
$results += Measure-Step "node_tests" { npm test }
$results += Measure-Step "backend_tests" { npm run test:backend }
$results += Measure-Step "build" { npm run build }

$distBytes = 0
if (Test-Path "dist") {
    $distBytes = (Get-ChildItem "dist" -File -Recurse | Measure-Object -Property Length -Sum).Sum
}

$report = [ordered]@{
    measured_at_utc = (Get-Date).ToUniversalTime().ToString("o")
    machine = [ordered]@{
        os = [System.Environment]::OSVersion.VersionString
        processor_count = [System.Environment]::ProcessorCount
        node = (node --version)
        python = (python --version 2>&1)
    }
    steps = $results
    dist_bytes = [int64]$distBytes
}

$report | ConvertTo-Json -Depth 6
