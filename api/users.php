<?php
require_once __DIR__ . '/cors.php';
require_admin();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $db->prepare("SELECT id, username, full_name, phone_number, role, created_at FROM users WHERE id = ?");
        $stmt->bind_param("i", $_GET['id']);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        send_json(['row' => $row]);
    }

    $q = $_GET['q'] ?? '';
    $stmt = $db->prepare("SELECT id, username, full_name, phone_number, role, created_at FROM users WHERE full_name LIKE ? OR username LIKE ? ORDER BY full_name ASC");
    $search = "%$q%";
    $stmt->bind_param("ss", $search, $search);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    send_json(['rows' => $rows]);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Check duplicate username
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param("s", $data['username']);
    $stmt->execute();
    if ($stmt->get_result()->fetch_assoc()) {
        send_json(['error' => 'Username already exists'], 400);
    }

    $pass = password_hash($data['password'], PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT INTO users (username, password, full_name, role, phone_number) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $data['username'], $pass, $data['full_name'], $data['role'], $data['phone_number']);
    
    if ($stmt->execute()) send_json(['id' => $db->insert_id]);
    else send_json(['error' => 'Create failed'], 500);
}

if ($method === 'PUT') {
    $id = $_GET['id'];
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['password']) && !empty($data['password'])) {
        $pass = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE users SET full_name=?, role=?, phone_number=?, password=? WHERE id=?");
        $stmt->bind_param("ssssi", $data['full_name'], $data['role'], $data['phone_number'], $pass, $id);
    } else {
        $stmt = $db->prepare("UPDATE users SET full_name=?, role=?, phone_number=? WHERE id=?");
        $stmt->bind_param("sssi", $data['full_name'], $data['role'], $data['phone_number'], $id);
    }
    
    if ($stmt->execute()) send_json(['message' => 'Updated']);
    else send_json(['error' => 'Update failed'], 500);
}

if ($method === 'DELETE') {
    $id = $_GET['id'];
    $db->query("DELETE FROM users WHERE id = $id");
    send_json(['message' => 'Deleted']);
}
