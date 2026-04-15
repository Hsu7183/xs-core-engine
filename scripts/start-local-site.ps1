$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$port = 8765
$url = "http://127.0.0.1:$port/index.html"
$pythonCommand = Get-Command python -ErrorAction Stop

function Test-LocalSiteReady {
    param([string]$TargetUrl)

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $TargetUrl -TimeoutSec 1
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
    } catch {
        return $false
    }
}

if (-not (Test-LocalSiteReady -TargetUrl $url)) {
    $serverCommand = "Set-Location '$repoRoot'; Write-Host 'Serving xs-core-engine at $url'; Write-Host 'Press Ctrl+C to stop.'; & '$($pythonCommand.Source)' -m http.server $port --bind 127.0.0.1"
    Start-Process -FilePath powershell.exe -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $serverCommand | Out-Null

    $ready = $false
    for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
        Start-Sleep -Milliseconds 500
        if (Test-LocalSiteReady -TargetUrl $url) {
            $ready = $true
            break
        }
    }

    if (-not $ready) {
        throw "本機站台沒有成功啟動：$url"
    }
}

Start-Process $url
Write-Host "Opened xs-core-engine at $url"
