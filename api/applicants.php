<?php
require_once __DIR__ . '/cors.php';
require_auth();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $db->prepare("SELECT * FROM applicants WHERE id = ?");
        $stmt->bind_param("i", $_GET['id']);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        send_json(['row' => $row]);
    }

    $q = $_GET['q'] ?? '';
    $program = $_GET['program'] ?? '';
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = 25;
    $offset = ($page - 1) * $limit;

    $where = ["1=1"];
    $params = [];
    $types = "";

    if ($q) {
        $where[] = "(full_name LIKE ? OR phone_number LIKE ? OR pin_moh LIKE ?)";
        $search = "%$q%";
        $params[] = $search; $params[] = $search; $params[] = $search;
        $types .= "sss";
    }
    if ($program) {
        $where[] = "program = ?";
        $params[] = $program;
        $types .= "s";
    }

    $where_sql = implode(" AND ", $where);
    
    // Count
    $count_stmt = $db->prepare("SELECT COUNT(*) FROM applicants WHERE $where_sql");
    if ($types) $count_stmt->bind_param($types, ...$params);
    $count_stmt->execute();
    $total = $count_stmt->get_result()->fetch_row()[0];

    // Rows
    $stmt = $db->prepare("SELECT * FROM applicants WHERE $where_sql ORDER BY created_at DESC LIMIT ? OFFSET ?");
    $types .= "ii";
    $params[] = $limit;
    $params[] = $offset;
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    send_json([
        'rows' => $rows,
        'pagination' => [
            'page' => $page,
            'pages' => ceil($total / $limit),
            'total' => $total
        ]
    ]);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("INSERT INTO applicants (full_name, phone_number, program, pin_moh, source) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $data['full_name'], $data['phone_number'], $data['program'], $data['pin_moh'], $data['source']);
    if ($stmt->execute()) send_json(['id' => $db->insert_id]);
    else send_json(['error' => 'Create failed'], 500);
}

if ($method === 'PUT') {
    $id = $_GET['id'];
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Bulk actions
    if (isset($data['ids'])) {
        $ids = implode(',', array_map('intval', $data['ids']));
        if ($data['action'] === 'shortlist') $db->query("UPDATE applicants SET is_shortlisted = 1 WHERE id IN ($ids)");
        if ($data['action'] === 'verify') {
            $db->query("UPDATE applicants SET is_verified = 1, admitted_at = NOW() WHERE id IN ($ids)");
        }
        if ($data['action'] === 'pay') $db->query("UPDATE applicants SET is_paid = 1 WHERE id IN ($ids)");
        send_json(['message' => 'Bulk action completed']);
    }

    // Single update
    if (isset($data['admin_comments'])) {
        $stmt = $db->prepare("UPDATE applicants SET admin_comments = ? WHERE id = ?");
        $stmt->bind_param("si", $data['admin_comments'], $id);
        $stmt->execute();
        send_json(['message' => 'Comment updated']);
    }

    $stmt = $db->prepare("UPDATE applicants SET full_name=?, phone_number=?, program=?, pin_moh=?, source=? WHERE id=?");
    $stmt->bind_param("sssssi", $data['full_name'], $data['phone_number'], $data['program'], $data['pin_moh'], $data['source'], $id);
    if ($stmt->execute()) send_json(['message' => 'Updated']);
    else send_json(['error' => 'Update failed'], 500);
}

if ($method === 'DELETE') {
    require_admin();
    $id = $_GET['id'];
    $db->query("DELETE FROM applicants WHERE id = $id");
    send_json(['message' => 'Deleted']);
}
