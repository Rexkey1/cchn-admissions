<?php
require_once __DIR__ . '/cors.php';
require_auth();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Grouped summary
    if (isset($_GET['summary'])) {
        $program = $_GET['program'] ?? '';
        $where = ["interview_date IS NOT NULL"];
        if ($program) $where[] = "program = '$program'";
        $where_sql = implode(" AND ", $where);

        $rows = $db->query("SELECT 
            interview_date, 
            COUNT(*) as total,
            SUM(CASE WHEN program='Diploma' THEN 1 ELSE 0 END) as diploma,
            SUM(CASE WHEN program='Certificate' THEN 1 ELSE 0 END) as certificate,
            SUM(CASE WHEN is_verified=1 THEN 1 ELSE 0 END) as verified
            FROM applicants 
            WHERE $where_sql
            GROUP BY interview_date 
            ORDER BY interview_date ASC")->fetch_all(MYSQLI_ASSOC);
        send_json(['groups' => $rows]);
    }

    // Detail for a specific date
    if (isset($_GET['date'])) {
        $date = $_GET['date'];
        $program = $_GET['program'] ?? '';
        $q = $_GET['q'] ?? '';
        
        $where = ["interview_date = '$date'"];
        if ($program) $where[] = "program = '$program'";
        if ($q) $where[] = "(full_name LIKE '%$q%' OR phone_number LIKE '%$q%')";
        $where_sql = implode(" AND ", $where);

        $rows = $db->query("SELECT * FROM applicants WHERE $where_sql ORDER BY full_name ASC")->fetch_all(MYSQLI_ASSOC);
        send_json(['rows' => $rows]);
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Bulk assignment
    if (isset($data['ids']) && isset($data['interview_date'])) {
        $date = $data['interview_date'];
        $ids = implode(',', array_map('intval', $data['ids']));
        $db->query("UPDATE applicants SET interview_date = '$date' WHERE id IN ($ids)");
        send_json(['message' => 'Interview dates assigned']);
    }

    // CSV Upload for dates
    if (isset($_FILES['file'])) {
        $h = fopen($_FILES['file']['tmp_name'], "r");
        fgetcsv($h); // skip headers
        $updated = 0; $skipped = 0; $errors = [];

        while (($row = fgetcsv($h)) !== false) {
            $phone = trim($row[0]);
            $date = trim($row[1]);
            if (!$phone || !$date) { $skipped++; continue; }

            $stmt = $db->prepare("UPDATE applicants SET interview_date = ? WHERE phone_number = ?");
            $stmt->bind_param("ss", $date, $phone);
            if ($stmt->execute() && $db->affected_rows > 0) $updated++;
            else $skipped++;
        }
        fclose($h);
        send_json(['updated' => $updated, 'skipped' => $skipped, 'errors' => $errors]);
    }
}

if ($method === 'DELETE') {
    $id = $_GET['id'];
    $db->query("UPDATE applicants SET interview_date = NULL WHERE id = $id");
    send_json(['message' => 'Date cleared']);
}
