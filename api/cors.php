<?php
// api/cors.php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

function send_json($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function get_body() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function require_auth() {
    if (!isset($_SESSION['user_id'])) {
        send_json(['ok' => false, 'error' => 'Unauthorized'], 401);
    }
    return $_SESSION;
}
