$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$distDir = Join-Path $projectRoot "dist"
$stageDir = Join-Path $projectRoot ".build-stage"
$zipPath = Join-Path $distDir "zotero-note-preview-column-1.1.0.zip"
$xpiPath = Join-Path $distDir "zotero-note-preview-column-1.1.0.xpi"

if (Test-Path -LiteralPath $stageDir) {
  Remove-Item -LiteralPath $stageDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stageDir | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stageDir "icons") | Out-Null
New-Item -ItemType Directory -Path $distDir -Force | Out-Null

$rootFiles = @(
  "manifest.json",
  "bootstrap.js",
  "prefs.js",
  "note-preview-column.js",
  "preferences.xhtml",
  "preferences.js"
)
foreach ($file in $rootFiles) {
  Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination $stageDir
}
Copy-Item -LiteralPath (Join-Path $projectRoot "icons/note-preview-column.svg") -Destination (Join-Path $stageDir "icons")

if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
if (Test-Path -LiteralPath $xpiPath) { Remove-Item -LiteralPath $xpiPath -Force }

Compress-Archive -Path (Join-Path $stageDir "*") -DestinationPath $zipPath -CompressionLevel Optimal
Move-Item -LiteralPath $zipPath -Destination $xpiPath
Remove-Item -LiteralPath $stageDir -Recurse -Force

Write-Output "Built: $xpiPath"
