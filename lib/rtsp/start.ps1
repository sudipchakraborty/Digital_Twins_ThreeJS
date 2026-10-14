param([string]$AdvertisedHost = '', [string]$ConfigPath = '')
$ErrorActionPreference = 'Stop'
$rtspRuntimeDir = Join-Path $PSScriptRoot '.runtime'
New-Item -ItemType Directory -Force -Path $rtspRuntimeDir | Out-Null
if (-not $ConfigPath) { $ConfigPath = Join-Path $PSScriptRoot 'config.local.json' }
if (Test-Path -LiteralPath $ConfigPath) { $rtspLaunchConfig = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json } else { $rtspLaunchConfig = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'config.example.json') -Raw | ConvertFrom-Json }
if ($AdvertisedHost) { $rtspLaunchConfig.advertisedHost = $AdvertisedHost }
elseif (-not (Test-Path -LiteralPath $ConfigPath)) {
    $rtspNetworkConfig = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1
    $rtspLaunchConfig.advertisedHost = if ($rtspNetworkConfig) { $rtspNetworkConfig.IPv4Address.IPAddress } else { '127.0.0.1' }
}
$rtspExistingOwnership = Join-Path $rtspRuntimeDir 'ownership.json'
if (Test-Path -LiteralPath $rtspExistingOwnership) {
    $rtspExisting = Get-Content -LiteralPath $rtspExistingOwnership -Raw | ConvertFrom-Json
    $rtspExistingProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($rtspExisting.nodePid)" -ErrorAction SilentlyContinue
    if ($rtspExistingProcess -and $rtspExistingProcess.CommandLine.Contains($rtspExisting.serverPath)) {
        Write-Output "RTSP service already running. URL: rtsp://$($rtspLaunchConfig.advertisedHost):$($rtspLaunchConfig.rtspPort)/$($rtspLaunchConfig.stream)"
        return
    }
}
$rtspLaunchConfigPath = Join-Path $rtspRuntimeDir 'launch.json'
[System.IO.File]::WriteAllText($rtspLaunchConfigPath, ($rtspLaunchConfig | ConvertTo-Json), [System.Text.UTF8Encoding]::new($false))
$rtspServerPath = Join-Path $PSScriptRoot 'server.js'
$rtspNodePath = (Get-Command node.exe).Source
$rtspProcess = Start-Process -FilePath $rtspNodePath -ArgumentList @('"' + $rtspServerPath + '"', '"' + $rtspLaunchConfigPath + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $rtspRuntimeDir 'service.log') -RedirectStandardError (Join-Path $rtspRuntimeDir 'service-error.log') -PassThru
for ($rtspAttempt = 0; $rtspAttempt -lt 40; $rtspAttempt++) {
    $rtspProcess.Refresh()
    if ($rtspProcess.HasExited) { throw "RTSP launch failed: $(Get-Content -LiteralPath (Join-Path $rtspRuntimeDir 'service-error.log') -Raw)" }
    try {
        $rtspHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$($rtspLaunchConfig.bridgePort)/rtsp/health" -TimeoutSec 1
        Write-Output "RTSP service ready. Open the simulation to publish images. URL: $($rtspHealth.rtspUrl)"
        return
    } catch { Start-Sleep -Milliseconds 250 }
}
throw 'RTSP readiness timed out; inspect .runtime/service-error.log'
