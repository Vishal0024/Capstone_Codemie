$ErrorActionPreference = 'Stop'
try {
    $pkg = Get-Content -Raw 'package.json' | ConvertFrom-Json
    $version = $pkg.version
    $destDir = "dist\pro-todo-$version"
    $zipFile = "dist\pro-todo-$version.zip"

    if (Test-Path $destDir) { Remove-Item $destDir -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null

    Copy-Item 'todoServer.js'  "$destDir\todoServer.js"  -Force
    Copy-Item 'index.html'     "$destDir\index.html"     -Force
    Copy-Item 'package.json'   "$destDir\package.json"   -Force
    if (Test-Path 'package-lock.json') {
        Copy-Item 'package-lock.json' "$destDir\package-lock.json" -Force
    }
    Copy-Item 'public' $destDir -Recurse -Force

    if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
    Compress-Archive -Path $destDir -DestinationPath $zipFile

    Write-Host "Build complete: $zipFile"
    exit 0
} catch {
    Write-Error "Build failed: $_"
    exit 1
}
