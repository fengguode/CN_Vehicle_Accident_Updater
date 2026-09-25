$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$logDir = Join-Path $projectRoot 'data\logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$resultPath = Join-Path $logDir 'vnext-password-boot-setup.json'
$serviceName = 'China ADAS vNext Service'
$watchdogName = 'China ADAS vNext Watchdog'
$admin = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $admin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Administrator elevation is required.' }

function Test-Service {
  try {
    $response = Invoke-RestMethod -Uri 'http://127.0.0.1:8788/health' -TimeoutSec 3
    return ($response.ok -eq $true -and $response.service -eq 'adas-vnext')
  } catch { return $false }
}

function Wait-Service {
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    if (Test-Service) { return $true }
    Start-Sleep -Seconds 1
  }
  return $false
}

$service = Get-ScheduledTask -TaskName $serviceName -ErrorAction Stop
$watchdog = Get-ScheduledTask -TaskName $watchdogName -ErrorAction Stop
if ($service.Principal.LogonType -eq 'Password' -and $watchdog.Principal.LogonType -eq 'Password') {
  @{ ok = $true; mode = 'already_configured'; service_logon = 'Password'; watchdog_logon = 'Password'; time = (Get-Date).ToString('o') } |
    ConvertTo-Json -Compress | Set-Content -LiteralPath $resultPath -Encoding utf8
  exit 0
}
if ($service.Principal.LogonType -eq 'Password' -or $watchdog.Principal.LogonType -eq 'Password') {
  throw 'Tasks have mixed logon modes; inspect them before running this setup again.'
}
$serviceOriginal = Export-ScheduledTask -TaskName $serviceName
$watchdogOriginal = Export-ScheduledTask -TaskName $watchdogName
$serviceOriginal | Set-Content -LiteralPath (Join-Path $logDir 'vnext-service-before.xml') -Encoding utf8
$watchdogOriginal | Set-Content -LiteralPath (Join-Path $logDir 'vnext-watchdog-before.xml') -Encoding utf8
$target = $service.Principal.UserId
if ($target -notmatch '[\\@]') { $target = "$env:COMPUTERNAME\$target" }
$phase = 'credential_prompt'
$password = $null
try {
  $credential = Get-Credential -UserName $target -Message "Enter the Windows password for $target. It is used only to register the ADAS background tasks with Windows Task Scheduler."
  if (-not $credential -or $credential.UserName -ine $target) { throw 'The requested account credential was not provided.' }
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential.Password)
  try { $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }

  $phase = 'registration'
  Register-ScheduledTask -TaskName $serviceName -Action $service.Actions -Trigger (New-ScheduledTaskTrigger -AtStartup) -Settings $service.Settings -Description $service.Description -User $target -Password $password -RunLevel Limited -Force | Out-Null
  Register-ScheduledTask -TaskName $watchdogName -Action $watchdog.Actions -Trigger $watchdog.Triggers -Settings $watchdog.Settings -Description $watchdog.Description -User $target -Password $password -RunLevel Limited -Force | Out-Null
  $password = $null
  $credential = $null

  $serviceAfter = Get-ScheduledTask -TaskName $serviceName
  $watchdogAfter = Get-ScheduledTask -TaskName $watchdogName
  if ($serviceAfter.Principal.LogonType -ne 'Password' -or $watchdogAfter.Principal.LogonType -ne 'Password') {
    throw 'The tasks did not retain password-backed background logon mode.'
  }
  @{ ok = $true; target = $target; service_logon = 'Password'; trigger = 'AtStartup'; watchdog_logon = 'Password'; restart = 'test_separately'; reboot = 'not_tested'; time = (Get-Date).ToString('o') } |
    ConvertTo-Json -Compress | Set-Content -LiteralPath $resultPath -Encoding utf8
  exit 0
} catch {
  $message = $_.Exception.Message
  $password = $null
  $credential = $null
  $rollback = 'passed'
  try {
    Register-ScheduledTask -TaskName $serviceName -Xml $serviceOriginal -Force | Out-Null
    Register-ScheduledTask -TaskName $watchdogName -Xml $watchdogOriginal -Force | Out-Null
    if (-not (Test-Service)) { Start-ScheduledTask -TaskName $serviceName; if (-not (Wait-Service)) { throw 'Service did not recover after rollback.' } }
  } catch { $rollback = $_.Exception.Message }
  @{ ok = $false; phase = $phase; error = $message; rollback = $rollback; time = (Get-Date).ToString('o') } |
    ConvertTo-Json -Compress | Set-Content -LiteralPath $resultPath -Encoding utf8
  exit 1
}
