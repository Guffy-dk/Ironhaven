$ErrorActionPreference = 'Stop'

$project = Split-Path -Parent $PSScriptRoot
$release = Join-Path $project 'release'
$runtimeVersion = '45.3.3'
$runtimeHash = '49dd2d3875944f08de03d34595cd30093c588b9edcabb41a0ac481028a3a5a8a'
$runtimeName = "electron-v$runtimeVersion-win32-x64.zip"
$cache = Join-Path $release 'windows-cache'
$archive = Join-Path $cache $runtimeName
$gameVersion = (Get-Content (Join-Path $project 'package.json') -Raw | ConvertFrom-Json).version
$packageRoot = Join-Path $release "windows-$gameVersion"
$gameFolder = Join-Path $packageRoot 'Ironhaven'
$zip = Join-Path $release 'Ironhaven-Windows-x64.zip'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'

Push-Location $project
try {
  node scripts/build.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Game bundling failed.' }

  New-Item -ItemType Directory -Force -Path $cache, $gameFolder | Out-Null
  if (!(Test-Path -LiteralPath $archive) -or (Get-FileHash -LiteralPath $archive).Hash -ine $runtimeHash) {
    Invoke-WebRequest -Uri "https://github.com/electron/electron/releases/download/v$runtimeVersion/$runtimeName" -OutFile $archive
  }
  if ((Get-FileHash -LiteralPath $archive).Hash -ine $runtimeHash) { throw 'Electron runtime checksum mismatch.' }

  tar.exe -xf $archive -C $gameFolder
  if ($LASTEXITCODE -ne 0) { throw 'Electron runtime extraction failed.' }
  $executable = Join-Path $gameFolder 'Ironhaven.exe'
  Move-Item -LiteralPath (Join-Path $gameFolder 'electron.exe') -Destination $executable -Force
  Copy-Item -LiteralPath 'release/THIRD_PARTY_ASSETS.txt' -Destination $gameFolder -Force
  $resources = Join-Path $gameFolder 'resources'
  $defaultApp = Join-Path $resources 'default_app.asar'
  if (Test-Path -LiteralPath $defaultApp) { Remove-Item -LiteralPath $defaultApp }
  $game = Join-Path $resources 'app'
  New-Item -ItemType Directory -Force -Path $game | Out-Null
  Copy-Item -LiteralPath 'desktop/game.cjs', 'desktop/mod-loader.cjs', 'release/Ironhaven.html', 'release/Studio-Intro.html', 'release/mod-base.json', 'release/mod-worker.cjs' -Destination $game -Force
  Copy-Item -LiteralPath 'release/FENGARI-LICENSE.txt' -Destination $gameFolder -Force
  $modding = Join-Path $gameFolder 'Modding'
  New-Item -ItemType Directory -Force -Path $modding | Out-Null
  Copy-Item -LiteralPath 'docs/MODDING.md' -Destination $modding -Force
  Copy-Item -LiteralPath 'examples/mods' -Destination $modding -Recurse -Force
  @{ name = 'ironhaven'; productName = 'Ironhaven'; version = $gameVersion; main = 'game.cjs' } |
    ConvertTo-Json | Set-Content -LiteralPath (Join-Path $game 'package.json') -Encoding ascii

  $references = 'System.Net.Http.dll', 'System.IO.Compression.dll', 'System.IO.Compression.FileSystem.dll', 'System.Web.Extensions.dll'
  $compilerArgs = @('/nologo', '/optimize+', '/platform:x64', '/codepage:65001') + ($references | ForEach-Object { "/reference:$_" })
  $patcherSource = Join-Path $project 'desktop\patcher'
  & $compiler @compilerArgs /target:winexe /reference:System.Windows.Forms.dll /reference:System.Drawing.dll `
    "/out:$release\Ironhaven-Patcher.exe" "$patcherSource\Program.cs" "$patcherSource\Updates.cs"
  if ($LASTEXITCODE -ne 0) { throw 'Patcher compilation failed.' }
  & $compiler @compilerArgs /target:exe "/out:$packageRoot\PatcherTests.exe" "$patcherSource\Tests.cs" "$patcherSource\Updates.cs"
  if ($LASTEXITCODE -ne 0) { throw 'Patcher test compilation failed.' }
  & "$packageRoot\PatcherTests.exe"
  if ($LASTEXITCODE -ne 0) { throw 'Patcher tests failed.' }

  node scripts/windows-smoke-world.mjs (Join-Path $game 'smoke-world.json')
  if ($LASTEXITCODE -ne 0) { throw 'Windows renderer fixture failed.' }
  $smokeLog = Join-Path $packageRoot 'startup-test.log'
  $smoke = Start-Process -FilePath $executable -ArgumentList '--smoke-test' -RedirectStandardError $smokeLog -WindowStyle Hidden -PassThru
  # Software-rendered CI captures can take nearly three minutes after cold shader setup.
  if (!$smoke.WaitForExit(300000)) {
    Stop-Process -Id $smoke.Id
    Get-Content -LiteralPath $smokeLog -Tail 80 -ErrorAction SilentlyContinue
    throw 'Desktop smoke test timed out.'
  }
  Get-Content -LiteralPath $smokeLog
  if ($smoke.ExitCode -ne 0) {
    throw "Desktop startup smoke test failed ($($smoke.ExitCode))."
  }

  $modLog = Join-Path $packageRoot 'mod-startup-test.log'
  $modSmoke = Start-Process -FilePath $executable -ArgumentList '--mod-smoke-test' -RedirectStandardError $modLog -WindowStyle Hidden -PassThru
  if (!$modSmoke.WaitForExit(180000)) {
    Stop-Process -Id $modSmoke.Id
    Get-Content -LiteralPath $modLog -Tail 80 -ErrorAction SilentlyContinue
    throw 'Enabled-mod desktop smoke test timed out.'
  }
  Get-Content -LiteralPath $modLog
  if ($modSmoke.ExitCode -ne 0) { throw 'Enabled-mod desktop smoke test failed.' }

  Remove-Item -LiteralPath (Join-Path $game 'smoke-world.json')
  tar.exe -a -cf $zip -C $packageRoot Ironhaven
  if ($LASTEXITCODE -ne 0) { throw 'Windows packaging failed.' }
  @{
    tag = "v$gameVersion"
    digest = 'sha256:' + (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
    size = (Get-Item -LiteralPath $zip).Length
  } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $release 'Ironhaven-Windows-manifest.json') -Encoding ascii
  Write-Output "Built $zip and $release\Ironhaven-Patcher.exe"
} finally {
  Pop-Location
}
