<?php
// api/auth.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'check';

// GET /api/auth.php?action=check
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'check') {
    if (!empty($_SESSION['user'])) {
        send_json(['ok' => true, 'user' => $_SESSION['user']]);
    } else {
        send_json(['ok' => false, 'error' => 'Not logged in'], 401);
    }
}

// POST /api/auth.php?action=login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $body = get_body();
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';

    if ($username === '' || $password === '') {
        send_json(['ok' => false, 'error' => 'Username and password are required.'], 422);
    }

    $sql = "SELECT id, full_name, username, phone_number, password, role FROM users WHERE username=? LIMIT 1";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) send_json(['ok' => false, 'error' => 'DB error: ' . $mysqli->error], 500);

    $stmt->bind_param('s', $username);
    $stmt->execute();
    $row = null;

    if (function_exists('mysqli_stmt_get_result')) {
        $res = $stmt->get_result();
        if ($res) $row = $res->fetch_assoc();
    } else {
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            $stmt->bind_result($id, $full, $user, $phone, $hash, $role);
            $stmt->fetch();
            $row = ['id' => $id, 'full_name' => $full, 'username' => $user, 'phone_number' => $phone, 'password' => $hash, 'role' => $role];
        }
    }
    $stmt->close();

    if ($row && password_verify($password, $row['password'])) {
        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id'       => $row['id'],
            'name'     => $row['full_name'],
            'username' => $row['username'],
            'role'     => $row['role'],
            'phone'    => $row['phone_number'],
        ];
        send_json(['ok' => true, 'user' => $_SESSION['user']]);
    } else {
        send_json(['ok' => false, 'error' => 'Invalid username or password.'], 401);
    }
}

// POST /api/auth.php?action=logout
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'logout') {
    $_SESSION = [];
    session_destroy();
    send_json(['ok' => true]);
}

send_json(['ok' => false, 'error' => 'Invalid request'], 400);
