$ErrorActionPreference = 'Stop'
$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectDir
$LogDir = Join-Path $ProjectDir 'data\logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Stamp = Get-Date -Format 'yyyy-MM-dd'
node src/apply-votes.js (Join-Path $ProjectDir '..\china-adas-accident-database\data\votes.json') *>> (Join-Path $LogDir "$Stamp.log")
if ($LASTEXITCODE -ne 0) { throw 'Vote import failed; daily update stopped.' }
node src/cli.js collect *>> (Join-Path $LogDir "$Stamp.log")
node src/cli.js export *>> (Join-Path $LogDir "$Stamp.log")
node src/publish.js (Join-Path $ProjectDir '..\china-adas-accident-database') *>> (Join-Path $LogDir "$Stamp.log")
