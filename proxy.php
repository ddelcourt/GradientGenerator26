<?php
/**
 * PEXELS PROXY (PHP VERSION)
 * Handles two routes:
 *   ?action=search&query=...   → forwards to Pexels API (needs x-api-key header)
 *   ?action=img&url=...        → proxies images.pexels.com images (no auth needed)
 * 
 * Drop-in replacement for proxy.js for Apache/PHP hosting
 */

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, x-api-key');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$action = $_GET['action'] ?? '';

// ══════════════════════════════════════════════════════════════════════════════
// /search → Pexels API
// ══════════════════════════════════════════════════════════════════════════════
if ($action === 'search') {
  $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
  if (empty($apiKey)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing x-api-key header']);
    exit;
  }

  $query = $_GET['query'] ?? '';
  $perPage = $_GET['per_page'] ?? 21;
  $page = $_GET['page'] ?? 1;
  
  $pexelsUrl = sprintf(
    'https://api.pexels.com/v1/search?query=%s&per_page=%d&page=%d',
    urlencode($query),
    intval($perPage),
    intval($page)
  );

  error_log("[proxy.php] API → $pexelsUrl");

  // Use cURL if available, otherwise file_get_contents
  if (function_exists('curl_init')) {
    $ch = curl_init($pexelsUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
      'Authorization: ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    error_log("[proxy.php] API ← $httpCode");
    
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo $response;
  } else {
    // Fallback to file_get_contents
    $context = stream_context_create([
      'http' => [
        'header' => "Authorization: $apiKey\r\n"
      ]
    ]);
    
    $response = @file_get_contents($pexelsUrl, false, $context);
    
    if ($response === false) {
      http_response_code(502);
      header('Content-Type: application/json');
      echo json_encode(['error' => 'Failed to fetch from Pexels API']);
    } else {
      header('Content-Type: application/json');
      echo $response;
    }
  }
  exit;
}

// ══════════════════════════════════════════════════════════════════════════════
// /img → Image Proxy
// ══════════════════════════════════════════════════════════════════════════════
if ($action === 'img') {
  $imgUrl = $_GET['url'] ?? '';
  if (empty($imgUrl)) {
    http_response_code(400);
    echo 'Missing url param';
    exit;
  }

  // Only allow pexels.com domains for safety
  $parsed = parse_url($imgUrl);
  if (!$parsed || !isset($parsed['host']) || substr($parsed['host'], -10) !== 'pexels.com') {
    http_response_code(403);
    echo 'Only pexels.com images allowed';
    exit;
  }

  error_log("[proxy.php] IMG → $imgUrl");

  // Use cURL if available
  if (function_exists('curl_init')) {
    $ch = curl_init($imgUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
      'User-Agent: Mozilla/5.0'
    ]);
    
    $imageData = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    
    error_log("[proxy.php] IMG ← $httpCode");
    
    http_response_code($httpCode);
    header('Content-Type: ' . ($contentType ?: 'image/jpeg'));
    header('Cache-Control: public, max-age=86400'); // Cache for 1 day
    echo $imageData;
  } else {
    // Fallback to file_get_contents
    $context = stream_context_create([
      'http' => [
        'header' => "User-Agent: Mozilla/5.0\r\n"
      ]
    ]);
    
    $imageData = @file_get_contents($imgUrl, false, $context);
    
    if ($imageData === false) {
      http_response_code(502);
      echo 'Image fetch failed';
    } else {
      header('Content-Type: image/jpeg');
      header('Cache-Control: public, max-age=86400');
      echo $imageData;
    }
  }
  exit;
}

// Unknown action
http_response_code(404);
echo 'Not found';
