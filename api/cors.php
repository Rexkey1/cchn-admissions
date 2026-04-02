<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Session bootstrap
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax');

session_start();

require_once __DIR__ . '/../config/db.php';

function send_json($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function require_auth() {
    if (!isset($_SESSION['user_id'])) {
        send_json(['error' => 'Unauthorized'], 401);
    }
}

function require_admin() {
    require_auth();
    if ($_SESSION['role'] !== 'admin') {
        send_json(['error' => 'Forbidden: Admin access required'], 403);
    }
}
