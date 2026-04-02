<?php
require_once __DIR__ . '/cors.php';
require_auth();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Grouped summary
    if (!isset($_GET['source'])) {
        $program = $_GET['program'] ?? '';
        $where = ["source IS NOT NULL AND source != ''"];
        if ($program) $where[] = "program = '$program'";
        $where_sql = implode(" AND ", $where);

        $rows = $db->query("SELECT 
            source as source_label, 
            COUNT(*) as total,
            SUM(CASE WHEN program='Diploma' THEN 1 ELSE 0 END) as diploma,
            SUM(CASE WHEN program='Certificate' THEN 1 ELSE 0 END) as certificate,
            SUM(CASE WHEN is_shortlisted=1 THEN 1 ELSE 0 END) as shortlisted,
            SUM(CASE WHEN is_verified=1 THEN 1 ELSE 0 END) as verified
            FROM applicants 
            WHERE $where_sql
            GROUP BY source 
            ORDER BY total DESC")->fetch_all(MYSQLI_ASSOC);
        send_json(['groups' => $rows]);
    }

    // Detail for a specific source
    if (isset($_GET['source'])) {
        $source = $_GET['source'];
        $program = $_GET['program'] ?? '';
        $q = $_GET['q'] ?? '';
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = 25;
        $offset = ($page - 1) * $limit;

        $where = ["source = '$source'"];
        if ($program) $where[] = "program = '$program'";
        if ($q) $where[] = "(full_name LIKE '%$q%' OR phone_number LIKE '%$q%')";
        $where_sql = implode(" AND ", $where);

        // Count
        $total = $db->query("SELECT COUNT(*) FROM applicants WHERE $where_sql")->fetch_row()[0];

        // Rows
        $rows = $db->query("SELECT * FROM applicants WHERE $where_sql ORDER BY full_name ASC LIMIT $limit OFFSET $offset")->fetch_all(MYSQLI_ASSOC);

        send_json([
            'rows' => $rows,
            'pagination' => [
                'page' => $page,
                'pages' => ceil($total / $limit),
                'total' => $total
            ]
        ]);
    }
}
