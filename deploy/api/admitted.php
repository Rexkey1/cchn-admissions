<?php
// api/admitted.php — Daily admission report (admin-gated)
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/db.php';
require_auth();

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ── GET ?action=  → daily summary (grouped by admitted_at date) ─────────────
if ($method === 'GET' && $action === '') {
    $prog  = trim($_GET['program'] ?? '');
    $from  = trim($_GET['from']    ?? '');   // YYYY-MM-DD
    $to    = trim($_GET['to']      ?? '');   // YYYY-MM-DD

    $where = " WHERE is_verified=1 AND admitted_at IS NOT NULL";
    $params = []; $types = '';

    if (in_array($prog, ['Diploma','Certificate'], true)) {
        $where .= " AND program=?"; $params[] = $prog; $types .= 's';
    }
    if ($from && strtotime($from)) {
        $where .= " AND DATE(admitted_at) >= ?"; $params[] = date('Y-m-d', strtotime($from)); $types .= 's';
    }
    if ($to && strtotime($to)) {
        $where .= " AND DATE(admitted_at) <= ?"; $params[] = date('Y-m-d', strtotime($to)); $types .= 's';
    }

    // Daily totals
    $sql = "SELECT
                DATE(admitted_at)                                              AS admit_date,
                COUNT(*)                                                       AS total,
                SUM(CASE WHEN program='Diploma'     THEN 1 ELSE 0 END)        AS diploma,
                SUM(CASE WHEN program='Certificate' THEN 1 ELSE 0 END)        AS certificate
            FROM applicants$where
            GROUP BY DATE(admitted_at)
            ORDER BY DATE(admitted_at) DESC";
    $st = $mysqli->prepare($sql);
    if ($params) $st->bind_param($types, ...$params);
    $st->execute();
    $groups = []; $res = $st->get_result();
    while ($r = $res->fetch_assoc()) $groups[] = $r;
    $st->close();

    // Overall totals
    $tot = $mysqli->prepare("SELECT COUNT(*),
        SUM(CASE WHEN program='Diploma' THEN 1 ELSE 0 END),
        SUM(CASE WHEN program='Certificate' THEN 1 ELSE 0 END)
        FROM applicants$where");
    if ($params) $tot->bind_param($types, ...$params);
    $tot->execute();
    [$grandTotal, $totalDiploma, $totalCert] = $tot->get_result()->fetch_row();
    $tot->close();

    send_json([
        'ok'     => true,
        'groups' => $groups,
        'totals' => [
            'total'       => (int)($grandTotal   ?? 0),
            'diploma'     => (int)($totalDiploma ?? 0),
            'certificate' => (int)($totalCert    ?? 0),
        ],
    ]);
}

// ── GET ?action=day&date=YYYY-MM-DD → individual applicants for that day ──
if ($method === 'GET' && $action === 'day') {
    $date = trim($_GET['date'] ?? '');
    $q    = trim($_GET['q']    ?? '');
    $prog = trim($_GET['program'] ?? '');

    if (!$date || !strtotime($date)) send_json(['ok' => false, 'error' => 'Invalid date'], 422);
    $dateVal = date('Y-m-d', strtotime($date));

    $where = " WHERE is_verified=1 AND DATE(admitted_at)=?";
    $params = [$dateVal]; $types = 's';

    if (in_array($prog, ['Diploma','Certificate'], true)) {
        $where .= " AND program=?"; $params[] = $prog; $types .= 's';
    }
    if ($q !== '') {
        $where .= " AND (full_name LIKE ? OR pin_moh LIKE ? OR phone_number LIKE ?)";
        for ($i = 0; $i < 3; $i++) { $params[] = "%$q%"; $types .= 's'; }
    }

    $sql = "SELECT id, pin_moh, full_name, program, phone_number, source, is_paid, admitted_at, interview_date
            FROM applicants$where ORDER BY admitted_at ASC";
    $st = $mysqli->prepare($sql);
    $st->bind_param($types, ...$params);
    $st->execute();
    $rows = []; $res = $st->get_result();
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    $st->close();

    send_json(['ok' => true, 'date' => $dateVal, 'rows' => $rows]);
}

send_json(['ok' => false, 'error' => 'Invalid request'], 400);
