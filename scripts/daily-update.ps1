$ErrorActionPreference = 'Stop'
$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectDir
$LogDir = Join-Path $ProjectDir 'data\logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Stamp = Get-Date -Format 'yyyy-MM-dd'
node src/cli.js collect *>> (Join-Path $LogDir "$Stamp.log")
node src/cli.js export *>> (Join-Path $LogDir "$Stamp.log")
