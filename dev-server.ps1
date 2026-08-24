$port = 8080
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Output "Serving $root on http://localhost:$port/"

$mime = @{
  ".html" = "text/html"; ".js" = "application/javascript"; ".json" = "application/json";
  ".css" = "text/css"; ".png" = "image/png"; ".svg" = "image/svg+xml"; ".ico" = "image/x-icon"
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response
  try {
    $path = $request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    $filePath = Join-Path $root ($path.TrimStart("/"))
    if (Test-Path $filePath -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($filePath)
      $contentType = $mime[$ext]
      if (-not $contentType) { $contentType = "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $response.ContentType = $contentType
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $response.StatusCode = 404
      $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $response.OutputStream.Write($notFound, 0, $notFound.Length)
    }
  } catch {
    $response.StatusCode = 500
  } finally {
    $response.OutputStream.Close()
  }
}
