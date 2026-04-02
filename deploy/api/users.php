<?php
// api/users.php — User management (admin only)
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/db.php';
$user   = require_admin();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET /api/users.php  (list) ────────────────────────────────────────────
if ($method === 'GET') {
    $q    = trim($_GET['q'] ?? '');
    $sql  = "SELECT id, full_name, username, phone_number, role, created_at FROM users WHERE 1=1";
    $params = []; $types = '';
    if ($q !== '') {
        $sql .= " AND (full_name LIKE ? OR username LIKE ?)";
        $params[] = "%$q%"; $params[] = "%$q%"; $types .= 'ss';
    }
    $sql .= " ORDER BY created_at DESC";
    $st = $mysqli->prepare($sql);
    if ($params) $st->bind_param($types, ...$params);
    $st->execute(); $rows = []; $res = $st->get_result();
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    send_json(['ok' => true, 'rows' => $rows]);
}

// ── POST /api/users.php  (create) ─────────────────────────────────────────
if ($method === 'POST') {
    $b      = get_body();
    $name   = trim($b['full_name'] ?? '');
    $uname  = trim($b['username'] ?? '');
    $phone  = trim($b['phone_number'] ?? '');
    $pass   = $b['password'] ?? '';
    $role   = in_array($b['role'] ?? '', ['admin','manager'], true) ? $b['role'] : 'manager';

    if (!$name || !$uname || !$phone || !$pass) send_json(['ok' => false, 'error' => 'All fields required.'], 422);

    // Check duplicate username
    $sc = $mysqli->prepare("SELECT id FROM users WHERE username=? LIMIT 1");
    $sc->bind_param('s', $uname); $sc->execute(); $sc->store_result();
    if ($sc->num_rows > 0) send_json(['ok' => false, 'error' => 'Username already taken.'], 409);
    $sc->close();

    $hash = password_hash($pass, PASSWORD_BCRYPT);
    $st = $mysqli->prepare("INSERT INTO users (full_name, username, phone_number, password, role) VALUES(?,?,?,?,?)");
    $st->bind_param('sssss', $name, $uname, $phone, $hash, $role);
    if ($st->execute()) send_json(['ok' => true, 'id' => $mysqli->insert_id], 201);
    send_json(['ok' => false, 'error' => $st->error], 500);
}

// ── PUT /api/users.php?id=N  (update) ─────────────────────────────────────
if ($method === 'PUT') {
    $id    = intval($_GET['id'] ?? 0);
    $b     = get_body();
    $name  = trim($b['full_name'] ?? '');
    $phone = trim($b['phone_number'] ?? '');
    $role  = in_array($b['role'] ?? '', ['admin','manager'], true) ? $b['role'] : 'manager';
    $pass  = $b['password'] ?? '';

    if (!$name || !$phone) send_json(['ok' => false, 'error' => 'Name and phone required.'], 422);

    if ($pass !== '') {
        $hash = password_hash($pass, PASSWORD_BCRYPT);
        $st = $mysqli->prepare("UPDATE users SET full_name=?,phone_number=?,role=?,password=? WHERE id=?");
        $st->bind_param('ssssi', $name, $phone, $role, $hash, $id);
    } else {
        $st = $mysqli->prepare("UPDATE users SET full_name=?,phone_number=?,role=? WHERE id=?");
        $st->bind_param('sssi', $name, $phone, $role, $id);
    }
    if ($st->execute()) send_json(['ok' => true]);
    send_json(['ok' => false, 'error' => $st->error], 500);
}

// ── GET /api/users.php?action=single&id=N ────────────────────────────────
if ($method === 'GET' && ($_GET['action'] ?? '') === 'single') {
    $id = intval($_GET['id'] ?? 0);
    $st = $mysqli->prepare("SELECT id,full_name,username,phone_number,role FROM users WHERE id=? LIMIT 1");
    $st->bind_param('i', $id); $st->execute();
    $row = $st->get_result()->fetch_assoc();
    if (!$row) send_json(['ok' => false, 'error' => 'Not found'], 404);
    send_json(['ok' => true, 'row' => $row]);
}

// ── DELETE /api/users.php?id=N  (delete) ──────────────────────────────────
if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    // Prevent self-delete
    if ($id === (int)$user['id']) send_json(['ok' => false, 'error' => 'Cannot delete yourself.'], 400);
    $st = $mysqli->prepare("DELETE FROM users WHERE id=?");
    $st->bind_param('i', $id); $st->execute();
    send_json(['ok' => true, 'affected' => $st->affected_rows]);
}

send_json(['ok' => false, 'error' => 'Invalid request'], 400);
