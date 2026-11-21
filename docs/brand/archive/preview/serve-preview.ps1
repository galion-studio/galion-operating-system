param([int]$Port = 8790)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$prefix = "http://127.0.0.1:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Galion archive preview at $prefix"

$types = @{
  ".html" = "text/html; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".mjs" = "text/javascript; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".svg" = "image/svg+xml"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif" = "image/gif"
  ".woff2" = "font/woff2"
  ".json" = "application/json"
  ".ico" = "image/x-icon"
  ".mp3" = "audio/mpeg"
  ".wav" = "audio/wav"
  ".ogg" = "audio/ogg"
  ".mp4" = "video/mp4"
  ".webm" = "video/webm"
  ".gltf" = "model/gltf+json"
  ".glb" = "model/gltf-binary"
  ".wasm" = "application/wasm"
}

$rootFull = [IO.Path]::GetFullPath($root).TrimEnd('\', '/')

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $relative = [Uri]::UnescapeDataString($context.Request.Url.LocalPath)
    if ([string]::IsNullOrEmpty($relative) -or $relative -eq "/") {
      $relative = "/index.html"
    }
    $relative = $relative.TrimStart("/", "\").Replace("/", [IO.Path]::DirectorySeparatorChar)
    $target = [IO.Path]::GetFullPath((Join-Path $rootFull $relative))
    $response = $context.Response
    if (-not $target.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
      $response.StatusCode = 403
      $response.Close()
      continue
    }
    if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
      $response.StatusCode = 404
      $bytes = [Text.Encoding]::UTF8.GetBytes("Not found")
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
      $response.Close()
      continue
    }
    $payload = [IO.File]::ReadAllBytes($target)
    $extension = [IO.Path]::GetExtension($target).ToLowerInvariant()
    if ($types.ContainsKey($extension)) {
      $response.ContentType = $types[$extension]
    } else {
      $response.ContentType = "application/octet-stream"
    }
    $response.ContentLength64 = $payload.Length
    $response.OutputStream.Write($payload, 0, $payload.Length)
    $response.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
