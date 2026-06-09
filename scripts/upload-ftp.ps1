param(
  [Parameter(Mandatory = $true)]
  [string]$Server,

  [Parameter(Mandatory = $true)]
  [string]$Username,

  [Parameter(Mandatory = $true)]
  [string]$LocalPath,

  [string]$RemotePath = "/",
  [int]$Port = 21,
  [switch]$UseFtps
)

$ErrorActionPreference = "Stop"

if (!(Test-Path -LiteralPath $LocalPath)) {
  throw "LocalPath does not exist: $LocalPath"
}

$password = Read-Host "FTP password for $Username" -AsSecureString
$credential = [System.Net.NetworkCredential]::new($Username, $password)
$localItem = Get-Item -LiteralPath $LocalPath -Force
$root = (Resolve-Path -LiteralPath $LocalPath).Path.TrimEnd("\", "/")
$remoteRoot = "/" + $RemotePath.Trim("/")

if ($remoteRoot -eq "/") {
  $remoteRoot = ""
}

function ConvertTo-FtpPath([string]$path) {
  return ($path -replace "\\", "/").Trim("/")
}

function New-FtpRequest([string]$remoteFilePath, [string]$method) {
  $encodedPath = ($remoteFilePath -split "/" | ForEach-Object { [uri]::EscapeDataString($_) }) -join "/"
  $uri = [Uri]::new("ftp://${Server}:${Port}/${encodedPath}")
  $request = [System.Net.FtpWebRequest]::Create($uri)
  $request.Method = $method
  $request.Credentials = $credential
  $request.EnableSsl = [bool]$UseFtps
  $request.UseBinary = $true
  $request.KeepAlive = $false
  return $request
}

function Ensure-RemoteDirectory([string]$remoteDirectory) {
  $parts = (ConvertTo-FtpPath $remoteDirectory).Split("/", [System.StringSplitOptions]::RemoveEmptyEntries)
  $current = ""

  foreach ($part in $parts) {
    $current = if ($current) { "$current/$part" } else { $part }
    $request = New-FtpRequest $current ([System.Net.WebRequestMethods+Ftp]::MakeDirectory)

    try {
      $response = $request.GetResponse()
      $response.Close()
    } catch [System.Net.WebException] {
      # Directory probably already exists. FTP servers do not expose this consistently.
      if ($_.Exception.Response) {
        $_.Exception.Response.Close()
      }
    }
  }
}

function Send-File([string]$localFile, [string]$remoteFile) {
  $remoteDirectory = Split-Path -Parent (ConvertTo-FtpPath $remoteFile)
  if ($remoteDirectory) {
    Ensure-RemoteDirectory $remoteDirectory
  }

  $request = New-FtpRequest (ConvertTo-FtpPath $remoteFile) ([System.Net.WebRequestMethods+Ftp]::UploadFile)
  $bytes = [System.IO.File]::ReadAllBytes($localFile)
  $request.ContentLength = $bytes.Length

  $stream = $request.GetRequestStream()
  try {
    $stream.Write($bytes, 0, $bytes.Length)
  } finally {
    $stream.Close()
  }

  $response = $request.GetResponse()
  $response.Close()
}

if (!$localItem.PSIsContainer) {
  $remoteFile = if ($remoteRoot -and !$remoteRoot.EndsWith("/")) {
    $remoteRoot
  } else {
    "$remoteRoot/$($localItem.Name)"
  }

  Write-Host "[1/1] $($localItem.Name)"
  Send-File $localItem.FullName $remoteFile
} else {
  $files = Get-ChildItem -LiteralPath $root -Recurse -File -Force
  $total = $files.Count
  $index = 0

  foreach ($file in $files) {
    $index += 1
    $relative = $file.FullName.Substring($root.Length).TrimStart("\", "/")
    $remoteFile = ConvertTo-FtpPath ("$remoteRoot/$relative")

    Write-Host "[$index/$total] $relative"
    Send-File $file.FullName $remoteFile
  }
}

Write-Host "FTP upload finished."
