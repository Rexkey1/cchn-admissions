<?php
require_once __DIR__ . '/cors.php';
require_auth();

$type = $_GET['type'] ?? 'all';
$program = $_GET['program'] ?? '';

$where = ["1=1"];
if ($type === 'shortlisted') $where[] = "is_shortlisted = 1";
if ($type === 'verified') $where[] = "is_verified = 1";
if ($type === 'paid') $where[] = "is_paid = 1";

if ($program) $where[] = "program = '$program'";

$where_sql = implode(" AND ", $where);
$rows = $db->query("SELECT full_name, phone_number, program, pin_moh, source, created_at FROM applicants WHERE $where_sql ORDER BY full_name ASC")->fetch_all(MYSQLI_ASSOC);

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="'.$type.'_applicants.csv"');

$output = fopen('php://output', 'w');
fputcsv($output, ['Full Name', 'Phone Number', 'Program', 'PIN/MOH', 'Source', 'Registered At']);
foreach ($rows as $r) {
    fputcsv($output, $r);
}
fclose($output);
