param([string]$PublicRepo = "..\china-adas-accident-database")
$ErrorActionPreference = 'Stop'
node (Join-Path $PSScriptRoot '..\src\publish.js') (Resolve-Path $PublicRepo)
