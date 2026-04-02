<?php
// api/auth.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? '';

if ($action === 'check') {
    if (isset($_SESSION['user_id'])) {
        send_json(['ok' => true, 'user' => [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'name' => $_SESSION['full_name'],
            'role' => $_SESSION['role']
        ]]);
    }
    send_json(['ok' => false], 401);
}

if ($action === 'login') {
    $b = get_body();
    $u = $b['username'] ?? '';
    $p = $b['password'] ?? '';

    $st = $mysqli->prepare("SELECT id, username, password, full_name, role FROM users WHERE username = ?");
    $st->bind_param('s', $u);
    $st->execute();
    $res = $st->get_result();
    $user = $res->fetch_assoc();

    if ($user && password_verify($p, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['role'] = $user['role'];

        send_json(['ok' => true, 'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'name' => $user['full_name'],
            'role' => $user['role']
        ]]);
    }
    send_json(['ok' => false, 'error' => 'Invalid credentials'], 401);
}

if ($action === 'logout') {
    session_destroy();
    send_json(['ok' => true]);
}
