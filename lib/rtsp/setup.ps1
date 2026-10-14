param([string]$MediaMtxVersion = '1.21.1')
$ErrorActionPreference = 'Stop'
$rtspToolsDir = Join-Path $PSScriptRoot 'tools'
New-Item -ItemType Directory -Force -Path $rtspToolsDir | Out-Null
& npm.cmd ci --prefix $PSScriptRoot --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'RTSP npm dependency installation failed' }
if (-not (Test-Path -LiteralPath (Join-Path $rtspToolsDir 'mediamtx/mediamtx.exe'))) {
    $rtspMediaZip = Join-Path $rtspToolsDir 'mediamtx.zip'
    Invoke-WebRequest -Uri "https://github.com/bluenviron/mediamtx/releases/download/v$MediaMtxVersion/mediamtx_v${MediaMtxVersion}_windows_amd64.zip" -OutFile $rtspMediaZip
    Expand-Archive -LiteralPath $rtspMediaZip -DestinationPath (Join-Path $rtspToolsDir 'mediamtx') -Force
}
$rtspFfmpeg = Get-Command ffmpeg.exe -ErrorAction SilentlyContinue
$rtspFfmpegPath = if ($rtspFfmpeg) { $rtspFfmpeg.Source } else { $null }
if (-not $rtspFfmpegPath) {
    $rtspWingetDir = Join-Path $env:LOCALAPPDATA 'Microsoft/WinGet/Packages'
    if (Test-Path -LiteralPath $rtspWingetDir) {
        $rtspPackageDirs = Get-ChildItem -LiteralPath $rtspWingetDir -Directory | Where-Object Name -Like 'Gyan.FFmpeg_*'
        foreach ($rtspPackageDir in $rtspPackageDirs) {
            $rtspInstalledBinary = Get-ChildItem -LiteralPath $rtspPackageDir.FullName -Filter ffmpeg.exe -File -Recurse | Select-Object -First 1
            if ($rtspInstalledBinary) { $rtspFfmpegPath = $rtspInstalledBinary.FullName; break }
        }
    }
}
if (-not $rtspFfmpegPath) {
    $rtspLocalBinary = Get-ChildItem -LiteralPath $rtspToolsDir -Filter ffmpeg.exe -File -Recurse | Select-Object -First 1
    if ($rtspLocalBinary) { $rtspFfmpegPath = $rtspLocalBinary.FullName }
}
if (-not $rtspFfmpegPath) {
    # This Windows build provider is linked from https://ffmpeg.org/download.html.
    $rtspFfmpegZip = Join-Path $rtspToolsDir 'ffmpeg.zip'
    Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile $rtspFfmpegZip
    Expand-Archive -LiteralPath $rtspFfmpegZip -DestinationPath (Join-Path $rtspToolsDir 'ffmpeg') -Force
    $rtspFfmpegPath = (Get-ChildItem -LiteralPath (Join-Path $rtspToolsDir 'ffmpeg') -Filter ffmpeg.exe -Recurse -File | Select-Object -First 1).FullName
}
$rtspProbePath = Join-Path (Split-Path $rtspFfmpegPath) 'ffprobe.exe'
if (-not (Test-Path -LiteralPath $rtspProbePath)) { throw 'ffprobe.exe must accompany FFmpeg; configure paths in config.local.json' }
& $rtspFfmpegPath -hide_banner -encoders 2>&1 | Select-String 'libx264'
if ($LASTEXITCODE -ne 0) { throw 'FFmpeg executable check failed' }
& $rtspProbePath -version | Select-Object -First 1
& (Join-Path $rtspToolsDir 'mediamtx/mediamtx.exe') --version
Write-Output 'RTSP dependencies ready. Licenses remain alongside downloaded tools. Run start.ps1 next.'
