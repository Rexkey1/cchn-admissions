<?php
require_once __DIR__ . '/cors.php';
require_auth();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $q = $_GET['q'] ?? '';
    $program = $_GET['program'] ?? '';
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = 25;
    $offset = ($page - 1) * $limit;

    $where = ["is_shortlisted = 1"];
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
    $stmt = $db->prepare("SELECT * FROM applicants WHERE $where_sql ORDER BY full_name ASC LIMIT ? OFFSET ?");
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
