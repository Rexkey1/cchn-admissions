<?php
// api/verified.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/db.php';
require_auth();

$q    = trim($_GET['q'] ?? '');
$prog = trim($_GET['program'] ?? '');
$page = max(1, intval($_GET['page'] ?? 1));
$per  = max(1, intval($_GET['per'] ?? 25));
$offs = ($page - 1) * $per;

$where = " WHERE is_verified=1"; $params = []; $types = '';
if (in_array($prog, ['Diploma','Certificate'], true)) {
    $where .= " AND program=?"; $params[] = $prog; $types .= 's';
}
if ($q !== '') {
    $where .= " AND (full_name LIKE ? OR pin_moh LIKE ? OR phone_number LIKE ?)";
    for ($i = 0; $i < 3; $i++) { $params[] = "%$q%"; $types .= 's'; }
}

$stc = $mysqli->prepare("SELECT COUNT(*) FROM applicants$where");
if ($params) $stc->bind_param($types, ...$params);
$stc->execute(); $stc->bind_result($total); $stc->fetch(); $stc->close();

$sql = "SELECT id, pin_moh, full_name, program, phone_number, source, is_paid, created_at
        FROM applicants$where ORDER BY created_at DESC LIMIT ? OFFSET ?";
$st = $mysqli->prepare($sql);
$t2 = $types . 'ii'; $p2 = array_merge($params, [$per, $offs]);
$st->bind_param($t2, ...$p2); $st->execute();
$rows = []; $res = $st->get_result();
while ($r = $res->fetch_assoc()) $rows[] = $r;
$st->close();

send_json(['ok' => true, 'rows' => $rows,
    'pagination' => ['page' => $page, 'per' => $per, 'total' => (int)$total,
                     'pages' => (int)ceil($total / $per)]]);
