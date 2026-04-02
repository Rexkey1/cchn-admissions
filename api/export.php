<?php
// api/export.php — CSV export for shortlisted / verified / paid
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/db.php';
require_auth();

$type = $_GET['type'] ?? 'shortlisted'; // shortlisted | verified | paid
$prog = trim($_GET['program'] ?? '');

$where = " WHERE 1=1"; $params = []; $types = '';
if ($type === 'shortlisted') { $where .= " AND is_shortlisted=1"; }
elseif ($type === 'verified') { $where .= " AND is_verified=1"; }
elseif ($type === 'paid')     { $where .= " AND is_paid=1"; }

if (in_array($prog, ['Diploma','Certificate'], true)) {
    $where .= " AND program=?"; $params[] = $prog; $types .= 's';
}

$sql = "SELECT pin_moh, full_name, program, phone_number, source, created_at
        FROM applicants$where ORDER BY created_at DESC";
$st = $mysqli->prepare($sql);
if ($params) $st->bind_param($types, ...$params);
$st->execute(); $res = $st->get_result();

// Override Content-Type for CSV download
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $type . '_applicants.csv"');

$out = fopen('php://output', 'w');
fputcsv($out, ['PIN/MOH','Full Name','Program','Phone Number','Source','Registered Date']);
while ($r = $res->fetch_assoc()) {
    fputcsv($out, [
        $r['pin_moh'] ?? '',
        $r['full_name'],
        $r['program'],
        $r['phone_number'],
        $r['source'] ?? '',
        date('Y-m-d', strtotime($r['created_at'])),
    ]);
}
fclose($out);
exit;
