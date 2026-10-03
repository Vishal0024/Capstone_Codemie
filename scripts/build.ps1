# Packages the Pro To-Do app into dist/pro-todo-<version>.zip
# Runtime data files (todos.json, users.json, sessions.json) are intentionally excluded.
$ErrorActionPreference = 'Stop'

try {
    $root = Split-Path -Parent $PSScriptRoot
    $pkg = Get-Content -Raw -Path (Join-Path $root 'package.json') | ConvertFrom-Json
    $version = $pkg.version
    $dist = Join-Path $root 'dist'
    $stage = Join-Path $dist "pro-todo-$version"
    $zip = Join-Path $dist "pro-todo-$version.zip"

    if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
    New-Item -ItemType Directory -Force -Path $stage | Out-Null

    $items = @('todoServer.js', 'index.html', 'package.json', 'package-lock.json', 'public')
    foreach ($item in $items) {
        $src = Join-Path $root $item
        if (Test-Path $src) {
            Copy-Item -Recurse -Force -Path $src -Destination $stage
        } elseif ($item -ne 'package-lock.json') {
            throw "Required build input not found: $item"
        }
    }

    Compress-Archive -Force -Path (Join-Path $stage '*') -DestinationPath $zip
    Write-Host "Build complete: $zip"
    exit 0
} catch {
    Write-Error "Build failed: $_"
    exit 1
}
