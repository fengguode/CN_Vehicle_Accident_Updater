$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$nodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
$accountName = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $accountName -LogonType Interactive -RunLevel Limited
$watchdogTrigger = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddMinutes(1)) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)

function Get-TriggerKind {
  param([Parameter(Mandatory = $true)]$Trigger)
  if ($Trigger.CimClass -and $Trigger.CimClass.CimClassName) { return [string]$Trigger.CimClass.CimClassName }
  if ($Trigger.CimSystemProperties -and $Trigger.CimSystemProperties.ClassName) { return [string]$Trigger.CimSystemProperties.ClassName }
  if ($Trigger.TriggerType) { return [string]$Trigger.TriggerType }
  return [string]$Trigger.GetType().Name
}

function Test-CurrentUser {
  param([Parameter(Mandatory = $true)][string]$UserId)
  $currentSid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
  if ($UserId -match '^S-1-') { return $UserId -eq $currentSid }
  try {
    $actualSid = (New-Object Security.Principal.NTAccount($UserId)).Translate([Security.Principal.SecurityIdentifier]).Value
    return $actualSid -eq $currentSid
  } catch {
    return $false
  }
}

function Assert-TaskPrincipal {
  param([Parameter(Mandatory = $true)]$Task, [Parameter(Mandatory = $true)][string]$Name)
  $logon = [string]$Task.Principal.LogonType
  $runLevel = [string]$Task.Principal.RunLevel
  if (-not (Test-CurrentUser ([string]$Task.Principal.UserId)) -or $runLevel -ne 'Limited') {
    throw "Task '$Name' has an unexpected user or run level; expected current user '$accountName' with Limited run level. No changes were made to this task."
  }
  if ($logon -notin @('Interactive', 'Password')) {
    throw "Task '$Name' has unsupported logon type '$logon'; expected Interactive or Password. No changes were made to this task."
  }
  return $logon
}

function Assert-SingleTrigger {
  param([Parameter(Mandatory = $true)]$Task, [Parameter(Mandatory = $true)][string]$Name)
  $triggers = @($Task.Triggers)
  if ($triggers.Count -ne 1) { throw "Task '$Name' has $($triggers.Count) triggers; expected exactly one supported trigger. No changes were made to this task." }
  return $triggers[0]
}

function Assert-ServiceTrigger {
  param($Task, [string]$Name, [string]$LogonType)
  $trigger = Assert-SingleTrigger $Task $Name
  $kind = Get-TriggerKind $trigger
  if ($LogonType -eq 'Interactive' -and $kind -match 'LogonTrigger') {
    if ($trigger.UserId -and -not (Test-CurrentUser ([string]$trigger.UserId))) { throw "Task '$Name' has a logon trigger for another user. No changes were made to this task." }
    return $trigger
  }
  if ($LogonType -eq 'Password' -and $kind -match 'BootTrigger') { return $trigger }
  throw "Task '$Name' has unsupported trigger '$kind' for logon type '$LogonType'; expected Interactive/Logon or Password/Boot. No changes were made to this task."
}

function Assert-WatchdogTrigger {
  param($Task, [string]$Name)
  $trigger = Assert-SingleTrigger $Task $Name
  $kind = Get-TriggerKind $trigger
  $interval = [string]$trigger.Repetition.Interval
  $minutes = $null
  try { $minutes = [System.Xml.XmlConvert]::ToTimeSpan($interval).TotalMinutes } catch { }
  if ($kind -notmatch 'TimeTrigger' -or $minutes -ne 5) {
    throw "Task '$Name' has unsupported periodic trigger '$kind' with interval '$interval'; expected one five-minute periodic trigger. No changes were made to this task."
  }
  return $trigger
}

function Assert-DailyTrigger {
  param($Task, [string]$Name)
  $trigger = Assert-SingleTrigger $Task $Name
  $kind = Get-TriggerKind $trigger
  if ($kind -notmatch 'DailyTrigger' -or [int]$trigger.DaysInterval -ne 1) {
    throw "Task '$Name' has unsupported trigger '$kind'; expected one daily trigger. No changes were made to this task."
  }
  return $trigger
}

$definitions = @(
  @{
    Name = 'China ADAS vNext Service'
    Description = 'Run the local ADAS vNext web API while this user is signed in.'
    Argument = 'apps/api/server.js'
    FreshTrigger = New-ScheduledTaskTrigger -AtLogOn -User $accountName
    Settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Seconds 0) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    Kind = 'Service'
  },
  @{
    Name = 'China ADAS vNext Watchdog'
    Description = 'Check the local vNext health endpoint every five minutes and restart its service task if needed.'
    Executable = 'powershell.exe'
    Argument = '-NoProfile -ExecutionPolicy Bypass -File scripts/vnext-watchdog.ps1'
    FreshTrigger = $watchdogTrigger
    Settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 2) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    Kind = 'Watchdog'
  },
  @{
    Name = 'China ADAS vNext Daily'
    Description = 'While the user is signed in, collect public news and import validated social inbox records under the shared ingestion mutex.'
    Argument = 'scripts/vnext-daily.mjs'
    FreshTrigger = New-ScheduledTaskTrigger -Daily -At '08:20'
    Settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 45) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    Kind = 'Daily'
  },
  @{
    Name = 'China ADAS vNext Backup'
    Description = 'Take and verify an online backup of the local vNext SQLite database each day.'
    Argument = 'scripts/vnext-backup.mjs'
    FreshTrigger = New-ScheduledTaskTrigger -Daily -At '09:30'
    Settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 20) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    Kind = 'Daily'
  }
)

$plans = @()
foreach ($definition in $definitions) {
  $name = $definition.Name
  try {
    $existing = Get-ScheduledTask -TaskName $name -ErrorAction Stop
  } catch {
    if ($_.CategoryInfo.Category -eq [System.Management.Automation.ErrorCategory]::ObjectNotFound) {
      $existing = $null
    } else {
      throw
    }
  }
  $executable = if ($definition.Executable) { $definition.Executable } else { $nodeExecutable }
  $action = New-ScheduledTaskAction -Execute $executable -Argument $definition.Argument -WorkingDirectory $projectRoot

  if (-not $existing) {
    $plans += @{ Definition = $definition; Existing = $null; Action = $action; Trigger = $definition.FreshTrigger; LogonType = $null }
    continue
  }

  $logonType = Assert-TaskPrincipal $existing $name
  if ($definition.Kind -eq 'Service') {
    $trigger = Assert-ServiceTrigger $existing $name $logonType
  } elseif ($definition.Kind -eq 'Watchdog') {
    $trigger = Assert-WatchdogTrigger $existing $name
  } else {
    if ($logonType -ne 'Interactive') { throw "Task '$name' uses '$logonType' logon; Daily and Backup must remain Interactive under the signed-in-only policy. No changes were made to this task." }
    $null = Assert-DailyTrigger $existing $name
    $trigger = $definition.FreshTrigger
  }

  $plans += @{ Definition = $definition; Existing = $existing; Action = $action; Trigger = $trigger; LogonType = $logonType }
}

# Service and Watchdog are one availability pair: both are either in the initial
# Interactive setup or in the converted Password setup. Do not create or reconcile
# a partial/mixed pair implicitly.
$servicePlan = @($plans | Where-Object { $_.Definition.Kind -eq 'Service' })[0]
$watchdogPlan = @($plans | Where-Object { $_.Definition.Kind -eq 'Watchdog' })[0]
if ([bool]$servicePlan.Existing -ne [bool]$watchdogPlan.Existing) {
  throw 'Service and Watchdog task pair is incomplete; inspect both definitions and repair them together. No changes were made.'
}
if ($servicePlan.Existing -and $servicePlan.LogonType -ne $watchdogPlan.LogonType) {
  throw "Service and Watchdog use mixed logon types ('$($servicePlan.LogonType)' and '$($watchdogPlan.LogonType)'); inspect and repair the pair together. No changes were made."
}

# Validate every existing definition before changing any task, so unknown drift cannot leave
# a partially updated set of scheduled tasks.
foreach ($plan in $plans) {
  $definition = $plan.Definition
  $name = $definition.Name
  if (-not $plan.Existing) {
    Register-ScheduledTask -TaskName $name -Action $plan.Action -Trigger $plan.Trigger -Principal $principal -Settings $definition.Settings -Description $definition.Description | Out-Null
    Write-Output "Registered: $name"
    continue
  }

  if ($plan.LogonType -eq 'Password') {
    # Preserve the saved Windows credential, principal, trigger, and description. Re-registering
    # Password-logon tasks would require a password prompt and could replace the stored credential.
    Set-ScheduledTask -TaskName $name -Action $plan.Action -Trigger $plan.Trigger -Settings $definition.Settings | Out-Null
    Write-Output "Reconciled action/settings (preserved Password principal, trigger, and description): $name"
    continue
  }

  Register-ScheduledTask -TaskName $name -Action $plan.Action -Trigger $plan.Trigger -Principal $plan.Existing.Principal -Settings $definition.Settings -Description $definition.Description -Force | Out-Null
  Write-Output "Reconciled definition: $name"
}
