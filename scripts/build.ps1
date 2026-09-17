#Requires -Version 5.1
<#
.SYNOPSIS
  Build script for Pro To-Do Application.
  Copies source files into dist/pro-todo-<version>/ and zips the result.
  Exits with code 1 on any error.
#>

$ErrorActionPreference = 'Stop'

try {
    # Read version from package.json
    $pkg = Get-Content -Raw "$PSScriptRoot\..\package.json" | ConvertFrom-Json
    $version = $pkg.version
    $appName = "pro-todo-$version"

    $distRoot = "$PSScriptRoot\..\dist"
    $outDir   = "$distRoot\$appName"
    $zipPath  = "$distRoot\$appName.zip"

    Write-Host "Building $appName ..."

    # Clean previous build for this version
    if (Test-Path $outDir)  { Remove-Item -Recurse -Force $outDir }
    if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

    New-Item -ItemType Directory -Force $outDir | Out-Null

    # Copy top-level files
    foreach ($file in @('todoServer.js', 'index.html', 'package.json', 'package-lock.json')) {
        $src = "$PSScriptRoot\..\$file"
        if (-not (Test-Path $src)) { throw "Required file not found: $src" }
        Copy-Item $src "$outDir\$file"
    }

    # Copy public/ directory
    $publicSrc = "$PSScriptRoot\..\public"
    if (-not (Test-Path $publicSrc)) { throw "public/ directory not found" }
    Copy-Item -Recurse $publicSrc "$outDir\public"

    # Create zip
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($outDir, $zipPath)

    Write-Host "Build complete: $zipPath"
    exit 0
} catch {
    Write-Error "Build failed: $_"
    exit 1
}
