$ErrorActionPreference = 'Stop'
$rtspOwnershipPath = Join-Path $PSScriptRoot '.runtime/ownership.json'
if (-not (Test-Path -LiteralPath $rtspOwnershipPath)) { Write-Output 'No owned RTSP runtime recorded.'; return }
$rtspOwnership = Get-Content -LiteralPath $rtspOwnershipPath -Raw | ConvertFrom-Json
function Stop-OwnedRtspProcess([int]$RtspProcessId, [string]$RtspCommandMarker, [string]$RtspExecutable = '') {
    $rtspCandidate = Get-CimInstance Win32_Process -Filter "ProcessId=$RtspProcessId" -ErrorAction SilentlyContinue
    if (-not $rtspCandidate) { return }
    if (-not $rtspCandidate.CommandLine -or -not $rtspCandidate.CommandLine.Contains($RtspCommandMarker)) { throw "Refusing to stop process ${RtspProcessId}: ownership marker does not match" }
    if ($RtspExecutable -and $rtspCandidate.ExecutablePath -ne $RtspExecutable) { throw "Refusing to stop process ${RtspProcessId}: executable does not match" }
    Stop-Process -Id $RtspProcessId -Force
}
$rtspController = Get-CimInstance Win32_Process -Filter "ProcessId=$($rtspOwnership.nodePid)" -ErrorAction SilentlyContinue
if ($rtspController -and $rtspController.CommandLine.Contains($rtspOwnership.serverPath)) {
    try { $rtspHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$($rtspOwnership.bridgePort)/rtsp/health" -TimeoutSec 2 } catch { $rtspHealth = $null }
    if ($rtspHealth) { foreach ($rtspStream in $rtspHealth.streams.PSObject.Properties) {
        if ($rtspStream.Value.encoder.pid) { Stop-OwnedRtspProcess $rtspStream.Value.encoder.pid "rtsp://127.0.0.1:$($rtspOwnership.rtspPort)/$($rtspStream.Name)" $rtspOwnership.ffmpegExecutable }
    } }
}
Stop-OwnedRtspProcess $rtspOwnership.mediaPid $rtspOwnership.mediaConfig $rtspOwnership.mediaExecutable
Stop-OwnedRtspProcess $rtspOwnership.nodePid $rtspOwnership.serverPath
Remove-Item -LiteralPath $rtspOwnershipPath -Force
Write-Output 'Owned RTSP service processes stopped. Simulation browser remains open.'
