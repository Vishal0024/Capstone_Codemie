$ErrorActionPreference = 'Stop'

try {
  $version = node -p "require('./package.json').version"
  $dest = "dist/pro-todo-$version"

  New-Item -ItemType Directory -Path $dest -Force | Out-Null

  Copy-Item todoServer.js   $dest
  Copy-Item index.html      $dest
  Copy-Item package.json    $dest
  Copy-Item package-lock.json $dest -ErrorAction SilentlyContinue

  Copy-Item public $dest/public -Recurse -Force

  Compress-Archive -Path $dest -DestinationPath "$dest.zip" -Force

  Write-Host "Build complete: $dest.zip"
} catch {
  Write-Error "Build failed: $_"
  exit 1
}
