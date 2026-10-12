$ErrorActionPreference = 'Stop'
$global:mockTasks = @{}
$global:mockCalls = [System.Collections.Generic.List[object]]::new()

function New-ScheduledTaskPrincipal {
  param([string]$UserId, [string]$LogonType, [string]$RunLevel)
  [pscustomobject]@{ UserId = $UserId; LogonType = $LogonType; RunLevel = $RunLevel }
}
function New-ScheduledTaskSettingsSet {
  param([timespan]$ExecutionTimeLimit, [int]$RestartCount, [timespan]$RestartInterval, [string]$MultipleInstances, [switch]$StartWhenAvailable, [switch]$AllowStartIfOnBatteries, [switch]$DontStopIfGoingOnBatteries)
  [pscustomobject]@{ ExecutionTimeLimit = $ExecutionTimeLimit; RestartCount = $RestartCount; RestartInterval = $RestartInterval; MultipleInstances = $MultipleInstances; StartWhenAvailable = [bool]$StartWhenAvailable; AllowStartIfOnBatteries = [bool]$AllowStartIfOnBatteries; DontStopIfGoingOnBatteries = [bool]$DontStopIfGoingOnBatteries }
}
function New-ScheduledTaskTrigger {
  param([switch]$AtLogOn, [string]$User, [switch]$Daily, [string]$At, [switch]$Once, [datetime]$AtDate, [timespan]$RepetitionInterval, [timespan]$RepetitionDuration)
  if ($AtLogOn) { return [pscustomobject]@{ TriggerType = 'MSFT_TaskLogonTrigger'; UserId = $User } }
  if ($Daily) { return [pscustomobject]@{ TriggerType = 'MSFT_TaskDailyTrigger'; DaysInterval = 1; StartBoundary = $At } }
  if ($Once) { return [pscustomobject]@{ TriggerType = 'MSFT_TaskTimeTrigger'; Repetition = [pscustomobject]@{ Interval = 'PT5M' }; StartBoundary = $AtDate } }
  throw 'Unexpected mocked trigger construction.'
}
function New-ScheduledTaskAction {
  param([string]$Execute, [string]$Argument, [string]$WorkingDirectory)
  [pscustomobject]@{ Execute = $Execute; Argument = $Argument; WorkingDirectory = $WorkingDirectory }
}
function Get-ScheduledTask {
  param([string]$TaskName, [string]$ErrorAction)
  return $global:mockTasks[$TaskName]
}
function Register-ScheduledTask {
  param([string]$TaskName, $Action, $Trigger, $Principal, $Settings, [string]$Description, [switch]$Force)
  $global:mockCalls.Add([pscustomobject]@{ Kind = 'Register'; Name = $TaskName; Action = $Action; Trigger = $Trigger; Principal = $Principal; Settings = $Settings; Description = $Description; Force = [bool]$Force })
  $global:mockTasks[$TaskName] = [pscustomobject]@{ Principal = $Principal; Triggers = @($Trigger); Actions = @($Action); Settings = $Settings; Description = $Description }
}
function Set-ScheduledTask {
  param([string]$TaskName, $Action, $Trigger, $Settings)
  $global:mockCalls.Add([pscustomobject]@{ Kind = 'Set'; Name = $TaskName; Action = $Action; Trigger = $Trigger; Settings = $Settings })
  $existing = $global:mockTasks[$TaskName]
  $existing.Actions = @($Action)
  if ($null -ne $Trigger) { $existing.Triggers = @($Trigger) }
  $existing.Settings = $Settings
}

function Reset-Mocks {
  $global:mockTasks = @{}
  $global:mockCalls.Clear()
}
function Assert-True([bool]$Condition, [string]$Message) { if (-not $Condition) { throw "ASSERTION FAILED: $Message" } }
function Assert-Settings($Settings, [int]$LimitMinutes, [int]$RestartCount = 0, [int]$RestartMinutes = 0) {
  $actualRestartCount = if ($null -eq $Settings.RestartCount) { 0 } else { [int]$Settings.RestartCount }
  $actualRestartMinutes = if ($null -eq $Settings.RestartInterval) { 0 } else { $Settings.RestartInterval.TotalMinutes }
  Assert-True ($Settings -is [pscustomobject]) 'Settings should be a structured ScheduledTask settings object.'
  Assert-True ($Settings.ExecutionTimeLimit.TotalMinutes -eq $LimitMinutes) "ExecutionTimeLimit should be $LimitMinutes minutes."
  Assert-True ($actualRestartCount -eq $RestartCount) "RestartCount should be $RestartCount."
  Assert-True ($actualRestartMinutes -eq $RestartMinutes) "RestartInterval should be $RestartMinutes minutes."
  Assert-True ($Settings.MultipleInstances -eq 'IgnoreNew') 'MultipleInstances should be IgnoreNew.'
  Assert-True ($Settings.StartWhenAvailable -and $Settings.AllowStartIfOnBatteries -and $Settings.DontStopIfGoingOnBatteries) 'Start/battery settings should all be enabled.'
}
function Add-TaskFixture([string]$Name, [string]$LogonType, [string]$TriggerType, [string]$Interval = $null) {
  $principal = [pscustomobject]@{ UserId = [Security.Principal.WindowsIdentity]::GetCurrent().Name; LogonType = $LogonType; RunLevel = 'Limited' }
  $trigger = switch ($TriggerType) {
    'Boot' { [pscustomobject]@{ TriggerType = 'MSFT_TaskBootTrigger' } }
    'Logon' { [pscustomobject]@{ TriggerType = 'MSFT_TaskLogonTrigger'; UserId = $principal.UserId } }
    'Time' { [pscustomobject]@{ TriggerType = 'MSFT_TaskTimeTrigger'; Repetition = [pscustomobject]@{ Interval = $Interval } } }
    'Daily' { [pscustomobject]@{ TriggerType = 'MSFT_TaskDailyTrigger'; DaysInterval = 1; StartBoundary = '00:00' } }
    default { throw "Unknown fixture trigger $TriggerType" }
  }
  $global:mockTasks[$Name] = [pscustomobject]@{ Principal = $principal; Triggers = @($trigger); Actions = @([pscustomobject]@{ Execute = 'old.exe'; Argument = 'old'; WorkingDirectory = 'C:\old' }); Settings = 'old-settings'; Description = 'old description' }
}

$installer = Join-Path $PSScriptRoot '..\scripts\install-vnext-tasks.ps1'

# Fresh install: all four tasks are registered with the current checkout and Interactive/Limited principal.
Reset-Mocks
& $installer | Out-Null
Assert-True ($global:mockCalls.Count -eq 4) 'Fresh install should register exactly four tasks.'
foreach ($call in $global:mockCalls) {
  Assert-True ($call.Kind -eq 'Register') "Fresh task $($call.Name) should be registered."
  Assert-True ($call.Name -in @('China ADAS vNext Service', 'China ADAS vNext Watchdog', 'China ADAS vNext Daily', 'China ADAS vNext Backup')) "Unexpected task name $($call.Name)."
  Assert-True ($call.Principal.LogonType -eq 'Interactive' -and $call.Principal.RunLevel -eq 'Limited') "Fresh task $($call.Name) should use Interactive/Limited."
  Assert-True ($call.Action.WorkingDirectory -eq (Resolve-Path (Join-Path $PSScriptRoot '..')).Path) "Fresh task $($call.Name) should use current checkout working directory."
  Assert-True ($null -ne $call.Settings -and $null -ne $call.Trigger) "Fresh task $($call.Name) should include settings and a trigger."
  switch ($call.Name) {
    'China ADAS vNext Service' { Assert-True ($call.Action.Argument -eq 'apps/api/server.js' -and $call.Trigger.TriggerType -eq 'MSFT_TaskLogonTrigger') 'Service should run the API on logon.'; Assert-Settings $call.Settings 0 3 1 }
    'China ADAS vNext Watchdog' { Assert-True ($call.Action.Execute -eq 'powershell.exe' -and $call.Action.Argument -match 'vnext-watchdog.ps1' -and $call.Trigger.Repetition.Interval -eq 'PT5M') 'Watchdog should use PowerShell and a five-minute trigger.'; Assert-Settings $call.Settings 2 }
    'China ADAS vNext Daily' { Assert-True ($call.Action.Argument -eq 'scripts/vnext-daily.mjs' -and $call.Trigger.TriggerType -eq 'MSFT_TaskDailyTrigger' -and $call.Trigger.StartBoundary -eq '08:20') 'Daily task should use the 08:20 schedule and daily runner.'; Assert-Settings $call.Settings 45 }
    'China ADAS vNext Backup' { Assert-True ($call.Action.Argument -eq 'scripts/vnext-backup.mjs' -and $call.Trigger.TriggerType -eq 'MSFT_TaskDailyTrigger' -and $call.Trigger.StartBoundary -eq '09:30') 'Backup task should use the 09:30 schedule and backup runner.'; Assert-Settings $call.Settings 20 }
  }
}

# Rerun: password-converted Service/Watchdog retain principal, boot/periodic trigger, and description;
# interactive tasks repair their daily schedules and descriptions.
Reset-Mocks
Add-TaskFixture 'China ADAS vNext Service' 'Password' 'Boot'
Add-TaskFixture 'China ADAS vNext Watchdog' 'Password' 'Time' 'PT5M'
Add-TaskFixture 'China ADAS vNext Daily' 'Interactive' 'Daily'
Add-TaskFixture 'China ADAS vNext Backup' 'Interactive' 'Daily'
$serviceBefore = $global:mockTasks['China ADAS vNext Service']
$watchdogBefore = $global:mockTasks['China ADAS vNext Watchdog']
& $installer | Out-Null
$serviceCall = $global:mockCalls | Where-Object Name -eq 'China ADAS vNext Service'
$watchdogCall = $global:mockCalls | Where-Object Name -eq 'China ADAS vNext Watchdog'
Assert-True ($serviceCall.Kind -eq 'Set' -and $watchdogCall.Kind -eq 'Set') 'Password tasks should use the safe Set path.'
Assert-True ($serviceCall.Action.WorkingDirectory -eq (Resolve-Path (Join-Path $PSScriptRoot '..')).Path) 'Password Service should receive current checkout action.'
Assert-True ($watchdogCall.Action.WorkingDirectory -eq (Resolve-Path (Join-Path $PSScriptRoot '..')).Path) 'Password Watchdog should receive current checkout action.'
Assert-Settings $serviceCall.Settings 0 3 1
Assert-Settings $watchdogCall.Settings 2
Assert-True ($serviceBefore.Principal.LogonType -eq 'Password' -and $watchdogBefore.Principal.LogonType -eq 'Password') 'Password logon must remain unchanged.'
Assert-True ($serviceBefore.Triggers[0].TriggerType -eq 'MSFT_TaskBootTrigger' -and $watchdogBefore.Triggers[0].Repetition.Interval -eq 'PT5M') 'Password task triggers must remain unchanged.'
Assert-True ([object]::ReferenceEquals($serviceBefore.Triggers[0], $serviceCall.Trigger)) 'Password Service trigger must be passed through unchanged.'
Assert-True ([object]::ReferenceEquals($watchdogBefore.Triggers[0], $watchdogCall.Trigger)) 'Password Watchdog trigger must be passed through unchanged.'
Assert-True ($serviceBefore.Description -eq 'old description' -and $watchdogBefore.Description -eq 'old description') 'Password task descriptions must remain unchanged without credentials.'
foreach ($name in @('China ADAS vNext Daily', 'China ADAS vNext Backup')) {
  $call = $global:mockCalls | Where-Object Name -eq $name
  Assert-True ($call.Kind -eq 'Register' -and $call.Force) "$name should be reconciled with Register-ScheduledTask."
  Assert-True ($call.Description -ne 'old description') "$name should receive the current description."
  Assert-True ($call.Principal.LogonType -eq 'Interactive' -and $call.Principal.RunLevel -eq 'Limited') "$name must remain Interactive/Limited."
  Assert-True ($call.Trigger.TriggerType -eq 'MSFT_TaskDailyTrigger' -and $call.Trigger.DaysInterval -eq 1) "$name must be reconciled to a daily trigger."
  Assert-True ($call.Action.WorkingDirectory -eq (Resolve-Path (Join-Path $PSScriptRoot '..')).Path) "$name should repair its current checkout working directory."
  if ($name -eq 'China ADAS vNext Daily') {
    Assert-True ($call.Trigger.StartBoundary -eq '08:20' -and $call.Action.Argument -eq 'scripts/vnext-daily.mjs') 'Daily should be reconciled to the 08:20 schedule and current runner.'
    Assert-Settings $call.Settings 45
  } else {
    Assert-True ($call.Trigger.StartBoundary -eq '09:30' -and $call.Action.Argument -eq 'scripts/vnext-backup.mjs') 'Backup should be reconciled to the 09:30 schedule and current runner.'
    Assert-Settings $call.Settings 20
  }
}

# Unknown/mixed state: validation completes before any register/set mutation.
Reset-Mocks
Add-TaskFixture 'China ADAS vNext Service' 'Password' 'Boot'
Add-TaskFixture 'China ADAS vNext Watchdog' 'Interactive' 'Time' 'PT3M'
Add-TaskFixture 'China ADAS vNext Daily' 'Interactive' 'Daily'
Add-TaskFixture 'China ADAS vNext Backup' 'Interactive' 'Daily'
$failedClosed = $false
try { & $installer | Out-Null } catch { $failedClosed = $_.Exception.Message -match 'five-minute periodic trigger' }
Assert-True $failedClosed 'Unexpected Watchdog trigger should fail with a clear diagnostic.'
Assert-True ($global:mockCalls.Count -eq 0) 'Unknown state should be rejected before changing any task.'

Reset-Mocks
Add-TaskFixture 'China ADAS vNext Service' 'S4U' 'Logon'
Add-TaskFixture 'China ADAS vNext Watchdog' 'Interactive' 'Time' 'PT5M'
Add-TaskFixture 'China ADAS vNext Daily' 'Interactive' 'Daily'
Add-TaskFixture 'China ADAS vNext Backup' 'Interactive' 'Daily'
$failedClosed = $false
try { & $installer | Out-Null } catch { $failedClosed = $_.Exception.Message -match 'unsupported logon type .S4U' }
Assert-True $failedClosed 'Unsupported principal/logon mode should fail with a clear diagnostic.'
Assert-True ($global:mockCalls.Count -eq 0) 'Unsupported principal should be rejected before changing any task.'

Reset-Mocks
Add-TaskFixture 'China ADAS vNext Service' 'Password' 'Boot'
Add-TaskFixture 'China ADAS vNext Watchdog' 'Interactive' 'Time' 'PT5M'
Add-TaskFixture 'China ADAS vNext Daily' 'Interactive' 'Daily'
Add-TaskFixture 'China ADAS vNext Backup' 'Interactive' 'Daily'
$failedClosed = $false
try { & $installer | Out-Null } catch { $failedClosed = $_.Exception.Message -match 'mixed logon types' }
Assert-True $failedClosed 'Mixed Service/Watchdog logon modes should fail with a clear diagnostic.'
Assert-True ($global:mockCalls.Count -eq 0) 'Mixed Service/Watchdog state should be rejected before changing any task.'

Reset-Mocks
Add-TaskFixture 'China ADAS vNext Service' 'Password' 'Boot'
Add-TaskFixture 'China ADAS vNext Daily' 'Interactive' 'Daily'
$failedClosed = $false
try { & $installer | Out-Null } catch { $failedClosed = $_.Exception.Message -match 'pair is incomplete' }
Assert-True $failedClosed 'Incomplete Service/Watchdog pair should fail with a clear diagnostic.'
Assert-True ($global:mockCalls.Count -eq 0) 'Incomplete pair should be rejected before changing any task.'

Write-Output 'PASS: exact fresh schedules/actions, safe converted-task rerun, daily/backup reconciliation, and fail-closed trigger/principal/pair preflight.'
