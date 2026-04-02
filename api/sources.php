<?php
// api/sources.php — Sources breakdown API
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/db.php';
require_auth();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET /api/sources.php — list all sources with totals
if ($method === 'GET' && $action === '') {
    $prog = trim($_GET['program'] ?? '');
    $where = ''; $params = []; $types = '';
    if (in_array($prog, ['Diploma','Certificate'], true)) {
        $where = " WHERE program=?"; $params[] = $prog; $types .= 's';
    }

    $sql = "SELECT
                COALESCE(NULLIF(TRIM(source),''), 'Direct / Unknown') AS source_label,
                COUNT(*)                                               AS total,
                SUM(CASE WHEN program='Diploma'     THEN 1 ELSE 0 END) AS diploma,
                SUM(CASE WHEN program='Certificate' THEN 1 ELSE 0 END) AS certificate,
                SUM(CASE WHEN is_shortlisted=1      THEN 1 ELSE 0 END) AS shortlisted,
                SUM(CASE WHEN is_verified=1         THEN 1 ELSE 0 END) AS verified,
                SUM(CASE WHEN is_paid=1             THEN 1 ELSE 0 END) AS paid
            FROM applicants$where
            GROUP BY source_label
            ORDER BY total DESC";
    $st = $mysqli->prepare($sql);
    if ($params) $st->bind_param($types, ...$params);
    $st->execute(); $rows = []; $res = $st->get_result();
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    $st->close();
    send_json(['ok' => true, 'groups' => $rows]);
}

// GET /api/sources.php?action=detail&source=X  — applicants from a source
if ($method === 'GET' && $action === 'detail') {
    $source = trim($_GET['source'] ?? '');
    $prog   = trim($_GET['program'] ?? '');
    $q      = trim($_GET['q'] ?? '');
    $page   = max(1, intval($_GET['page'] ?? 1));
    $limit  = 25; $offset = ($page - 1) * $limit;

    // "Direct / Unknown" maps to NULL or empty string
    if ($source === 'Direct / Unknown') {
        $where = " WHERE (source IS NULL OR TRIM(source)='')"; $params = []; $types = '';
    } else {
        $where = " WHERE source=?"; $params = [$source]; $types = 's';
    }

    if (in_array($prog, ['Diploma','Certificate'], true)) {
        $where .= " AND program=?"; $params[] = $prog; $types .= 's';
    }
    if ($q !== '') {
        $where .= " AND (full_name LIKE ? OR pin_moh LIKE ? OR phone_number LIKE ?)";
        for ($i=0;$i<3;$i++) { $params[] = "%$q%"; $types .= 's'; }
    }

    $stc = $mysqli->prepare("SELECT COUNT(*) FROM applicants$where");
    if ($params) $stc->bind_param($types, ...$params);
    $stc->execute(); $stc->bind_result($total); $stc->fetch(); $stc->close();

    $sql = "SELECT id, pin_moh, full_name, program, phone_number, source,
                   interview_date, is_shortlisted, is_verified, is_paid
            FROM applicants$where ORDER BY full_name ASC LIMIT ? OFFSET ?";
    $p2 = array_merge($params, [$limit, $offset]); $t2 = $types . 'ii';
    $st = $mysqli->prepare($sql);
    $st->bind_param($t2, ...$p2);
    $st->execute(); $rows = []; $res = $st->get_result();
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    $st->close();

    send_json([
        'ok'    => true,
        'rows'  => $rows,
        'pagination' => [
            'total' => $total, 'page' => $page,
            'pages' => max(1, ceil($total/$limit)),
        ],
    ]);
}

send_json(['ok'=>false,'error'=>'Invalid request'], 400);
