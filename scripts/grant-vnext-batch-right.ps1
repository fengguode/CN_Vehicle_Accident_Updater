$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$logDir = Join-Path $projectRoot 'data\logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$exportPath = Join-Path $logDir 'vnext-rights-export.inf'
$templatePath = Join-Path $logDir 'vnext-batch-grant.inf'
$databasePath = Join-Path $logDir 'vnext-batch-grant.sdb'
$resultPath = Join-Path $logDir 'vnext-batch-grant.json'
$target = (Get-ScheduledTask -TaskName 'China ADAS vNext Service').Principal.UserId
$sid = ([Security.Principal.NTAccount]$target).Translate([Security.Principal.SecurityIdentifier]).Value
$admin = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $admin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Administrator elevation is required.' }

$stage = 'export'
try {
  & secedit.exe /export /cfg $exportPath /areas USER_RIGHTS | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Policy export failed: $LASTEXITCODE" }
  $allow = @(Get-Content -LiteralPath $exportPath -Encoding Unicode | Where-Object { $_ -match '^SeBatchLogonRight\s*=' })
  if ($allow.Count -ne 1 -or $allow[0] -notmatch '\*S-1-5-32-544') { throw 'Unexpected batch-logon policy; leaving it unchanged.' }
  $original = $allow[0]
  $targetPattern = '(^|[=,])\s*' + [regex]::Escape($target) + '(\s*,|$)'
  $alreadyAllowed = ($original -match [regex]::Escape("*$sid") -or $original -match $targetPattern)
  if (-not $alreadyAllowed) {
    $stage = 'configure'
    $updated = "$original,*$sid"
    @('[Unicode]', 'Unicode=yes', '[Version]', 'signature="$CHICAGO$"', 'Revision=1', '[Privilege Rights]', $updated) |
      Set-Content -LiteralPath $templatePath -Encoding Unicode
    & secedit.exe /configure /db $databasePath /cfg $templatePath /areas USER_RIGHTS /quiet | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Policy update failed: $LASTEXITCODE" }
  }
  $stage = 'verify'
  & secedit.exe /export /cfg $exportPath /areas USER_RIGHTS | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Verification export failed: $LASTEXITCODE" }
  $verified = @(Get-Content -LiteralPath $exportPath -Encoding Unicode | Where-Object { $_ -match '^SeBatchLogonRight\s*=' })
  $verifiedText = [string]$verified[0]
  if ($verified.Count -ne 1 -or ($verifiedText -notmatch [regex]::Escape("*$sid") -and $verifiedText -notmatch $targetPattern)) { throw 'The batch-logon right was not applied.' }
  @{ ok = $true; target = $target; sid = $sid; changed = (-not $alreadyAllowed); previous = [string]$original; current = $verifiedText; time = (Get-Date).ToString('o') } |
    ConvertTo-Json -Compress | Set-Content -LiteralPath $resultPath -Encoding utf8
} catch {
  @{ ok = $false; target = $target; sid = $sid; stage = $stage; error = $_.Exception.Message; type = $_.Exception.GetType().FullName; time = (Get-Date).ToString('o') } |
    ConvertTo-Json -Compress | Set-Content -LiteralPath $resultPath -Encoding utf8
  throw
} finally {
  foreach ($file in @($exportPath, $templatePath, $databasePath, "$databasePath.jfm")) {
    if (Test-Path -LiteralPath $file -PathType Leaf) { Remove-Item -LiteralPath $file -Force }
  }
}
