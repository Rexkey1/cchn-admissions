<?php
// api/cors.php - Shared bootstrap for all API endpoints

// 1. Safe session start
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 2. CORS headers - allow Vite dev server + same-origin production
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// 3. Handle pre-flight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 4. JSON response header
header('Content-Type: application/json');

// 5. Helper: read JSON body
function get_body(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

// 6. Helper: require authenticated session
function require_auth(): array {
    if (empty($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Unauthenticated']);
        exit;
    }
    return $_SESSION['user'];
}

// 7. Helper: require admin role
function require_admin(): array {
    $u = require_auth();
    if ($u['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Forbidden: admin only']);
        exit;
    }
    return $u;
}

// 8. Helper: send JSON
function send_json($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}
