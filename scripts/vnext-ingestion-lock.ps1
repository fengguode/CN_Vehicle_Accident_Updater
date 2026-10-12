param(
  [Parameter(Mandatory = $true)]
  [string]$MutexName
)

$ErrorActionPreference = 'Stop'
$mutex = $null
$ownsMutex = $false

function New-CurrentUserMutexSecurity {
  $currentSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
  $requiredRights = [System.Security.AccessControl.MutexRights]::Modify -bor
    [System.Security.AccessControl.MutexRights]::Synchronize -bor
    [System.Security.AccessControl.MutexRights]::ReadPermissions
  $security = New-Object System.Security.AccessControl.MutexSecurity
  $security.SetAccessRuleProtection($true, $false)
  $rule = New-Object System.Security.AccessControl.MutexAccessRule(
    $currentSid,
    $requiredRights,
    [System.Security.AccessControl.AccessControlType]::Allow
  )
  [void]$security.AddAccessRule($rule)
  return @{ Sid = $currentSid; Rights = $requiredRights; Security = $security }
}

function Assert-CurrentUserMutexSecurity($targetMutex, $currentSid, $requiredRights) {
  $security = $targetMutex.GetAccessControl()
  $ownerSid = $security.GetOwner([System.Security.Principal.SecurityIdentifier])
  $rules = @($security.GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier]))
  if (-not $security.AreAccessRulesProtected -or
      $ownerSid.Value -ne $currentSid.Value -or
      $rules.Count -ne 1) {
    throw 'The existing ingestion mutex has an unsafe or unexpected access control list; refusing to continue.'
  }

  $rule = $rules[0]
  if ($rule.IsInherited -or
      $rule.AccessControlType -ne [System.Security.AccessControl.AccessControlType]::Allow -or
      $rule.IdentityReference.Value -ne $currentSid.Value -or
      $rule.MutexRights -ne $requiredRights) {
    throw 'The existing ingestion mutex has an unsafe or unexpected access control list; refusing to continue.'
  }
}

try {
  $identity = New-CurrentUserMutexSecurity
  $requiredOpenRights = $identity.Rights

  # Open an existing object with only the rights needed to wait, release, and
  # read its DACL. Never rewrite an existing mutex's security descriptor.
  try {
    $mutex = [System.Threading.Mutex]::OpenExisting($MutexName, $requiredOpenRights)
  } catch [System.Threading.WaitHandleCannotBeOpenedException] {
    # The named object may appear between OpenExisting and creation. If so,
    # dispose the constructor handle and reopen it with the minimum rights.
    $createdNew = $false
    $openedExisting = $false
    try {
      $mutex = [System.Threading.Mutex]::new($false, $MutexName, [ref]$createdNew, $identity.Security)
    } catch [System.UnauthorizedAccessException] {
      # A concurrently-created existing mutex may not grant the constructor's
      # broader access request. Retry only with the required wait/release/ACL
      # read rights; exact DACL validation below still fails closed if unsafe.
      $mutex = [System.Threading.Mutex]::OpenExisting($MutexName, $requiredOpenRights)
      $openedExisting = $true
    }
    if (-not $createdNew -and -not $openedExisting) {
      if ($null -ne $mutex) { $mutex.Dispose() }
      $mutex = [System.Threading.Mutex]::OpenExisting($MutexName, $requiredOpenRights)
    }
  }

  Assert-CurrentUserMutexSecurity $mutex $identity.Sid $identity.Rights

  try {
    $ownsMutex = $mutex.WaitOne(0)
  } catch [System.Threading.AbandonedMutexException] {
    # The previous process ended without releasing. WaitOne grants ownership
    # when it throws this exception, so the new owner can safely continue.
    $ownsMutex = $true
  }

  if (-not $ownsMutex) {
    [Console]::Out.WriteLine('BUSY')
    [Console]::Out.Flush()
    exit 75
  }

  [Console]::Out.WriteLine("ACQUIRED:$PID")
  [Console]::Out.Flush()
  [void][Console]::In.ReadLine()
} catch {
  [Console]::Error.WriteLine($_.Exception.ToString())
  exit 1
} finally {
  if ($ownsMutex -and $null -ne $mutex) {
    try { $mutex.ReleaseMutex() } catch { [Console]::Error.WriteLine($_.Exception.ToString()) }
  }
  if ($null -ne $mutex) { $mutex.Dispose() }
}
