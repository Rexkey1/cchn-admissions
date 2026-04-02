<?php
// api/applicants.php — Full CRUD + search + bulk + comment
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/db.php';
$user = require_auth();
$role = $user['role'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── GET /api/applicants.php  (search/paginate) ────────────────────────────
if ($method === 'GET' && $action === '') {
    $q     = trim($_GET['q'] ?? '');
    $prog  = trim($_GET['program'] ?? '');
    $page  = max(1, intval($_GET['page'] ?? 1));
    $per   = max(1, intval($_GET['per'] ?? 25));
    $offs  = ($page - 1) * $per;

    $where = " WHERE 1=1"; $params = []; $types = '';
    if ($q !== '') {
        $where .= " AND (full_name LIKE ? OR pin_moh LIKE ? OR phone_number LIKE ?)";
        for ($i = 0; $i < 3; $i++) { $params[] = "%$q%"; $types .= 's'; }
    }
    if (in_array($prog, ['Diploma','Certificate'], true)) {
        $where .= " AND program=?"; $params[] = $prog; $types .= 's';
    }

    // Live summary counts (globally, not filtered)
    $gc = $mysqli->query("SELECT
        SUM(CASE WHEN program='Diploma'     THEN 1 ELSE 0 END) dip,
        SUM(CASE WHEN program='Certificate' THEN 1 ELSE 0 END) cert,
        SUM(CASE WHEN is_paid=1             THEN 1 ELSE 0 END) paid
        FROM applicants")->fetch_assoc();
    $counts = ['Diploma' => (int)$gc['dip'], 'Certificate' => (int)$gc['cert'], 'Paid' => (int)$gc['paid']];

    $stc = $mysqli->prepare("SELECT COUNT(*) FROM applicants$where");
    if ($params) $stc->bind_param($types, ...$params);
    $stc->execute(); $stc->bind_result($total); $stc->fetch(); $stc->close();

    $sql = "SELECT id, pin_moh, full_name, program, phone_number, source,
                   is_shortlisted, is_verified, is_paid, admin_comments, interview_date, created_at
            FROM applicants$where ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $st = $mysqli->prepare($sql);
    $t2 = $types . 'ii'; $p2 = array_merge($params, [$per, $offs]);
    $st->bind_param($t2, ...$p2); $st->execute();
    $rows = []; $res = $st->get_result();
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    $st->close();

    send_json(['ok' => true, 'rows' => $rows, 'counts' => $counts,
        'pagination' => ['page' => $page, 'per' => $per, 'total' => (int)$total,
                         'pages' => (int)ceil($total / $per)]]);
}

// ── GET /api/applicants.php?action=single&id=N ───────────────────────────
if ($method === 'GET' && $action === 'single') {
    $id = intval($_GET['id'] ?? 0);
    $st = $mysqli->prepare("SELECT * FROM applicants WHERE id=? LIMIT 1");
    $st->bind_param('i', $id); $st->execute();
    $row = $st->get_result()->fetch_assoc();
    if (!$row) send_json(['ok' => false, 'error' => 'Not found'], 404);
    send_json(['ok' => true, 'row' => $row]);
}

// ── POST /api/applicants.php  (create) ───────────────────────────────────
if ($method === 'POST' && $action === '') {
    $b = get_body();
    $pin    = trim($b['pin_moh'] ?? '') ?: null;
    $name   = trim($b['full_name'] ?? '');
    $prog   = $b['program'] ?? '';
    $phone  = trim($b['phone_number'] ?? '');
    $source = trim($b['source'] ?? '') ?: null;

    if (!$name) send_json(['ok' => false, 'error' => 'Full Name is required.'], 422);
    if (!in_array($prog, ['Diploma','Certificate'], true)) send_json(['ok' => false, 'error' => 'Valid program required.'], 422);
    if (!$phone) send_json(['ok' => false, 'error' => 'Phone Number is required.'], 422);

    // Duplicate check
    $sd = $mysqli->prepare("SELECT id FROM applicants WHERE phone_number=?" . ($pin ? " OR pin_moh=?" : "") . " LIMIT 1");
    if ($pin) $sd->bind_param('ss', $phone, $pin); else $sd->bind_param('s', $phone);
    $sd->execute(); $sd->store_result();
    if ($sd->num_rows > 0) send_json(['ok' => false, 'error' => 'Applicant with this phone/PIN already exists.'], 409);
    $sd->close();

    $st = $mysqli->prepare("INSERT INTO applicants (pin_moh, full_name, program, phone_number, source) VALUES(?,?,?,?,?)");
    $st->bind_param('sssss', $pin, $name, $prog, $phone, $source);
    if ($st->execute()) {
        send_json(['ok' => true, 'id' => $mysqli->insert_id], 201);
    }
    send_json(['ok' => false, 'error' => $st->error], 500);
}

// ── PUT /api/applicants.php?id=N  (update) ───────────────────────────────
if ($method === 'PUT') {
    $id = intval($_GET['id'] ?? 0);
    $b  = get_body();
    $pin    = trim($b['pin_moh'] ?? '') ?: null;
    $name   = trim($b['full_name'] ?? '');
    $prog   = $b['program'] ?? '';
    $phone  = trim($b['phone_number'] ?? '');
    $source = trim($b['source'] ?? '') ?: null;

    if (!$name) send_json(['ok' => false, 'error' => 'Full Name is required.'], 422);
    if (!in_array($prog, ['Diploma','Certificate'], true)) send_json(['ok' => false, 'error' => 'Valid program required.'], 422);
    if (!$phone) send_json(['ok' => false, 'error' => 'Phone Number is required.'], 422);

    $st = $mysqli->prepare("UPDATE applicants SET pin_moh=?,full_name=?,program=?,phone_number=?,source=? WHERE id=?");
    $st->bind_param('sssssi', $pin, $name, $prog, $phone, $source, $id);
    if ($st->execute()) send_json(['ok' => true]);
    send_json(['ok' => false, 'error' => $st->error], 500);
}

// ── DELETE /api/applicants.php?id=N  (admin only) ────────────────────────
if ($method === 'DELETE') {
    if ($role !== 'admin') send_json(['ok' => false, 'error' => 'Admin only'], 403);
    $id = intval($_GET['id'] ?? 0);
    $st = $mysqli->prepare("DELETE FROM applicants WHERE id=?");
    $st->bind_param('i', $id); $st->execute();
    send_json(['ok' => true, 'affected' => $st->affected_rows]);
}

// ── POST /api/applicants.php?action=bulk ─────────────────────────────────
if ($method === 'POST' && $action === 'bulk') {
    $b      = get_body();
    $ids    = array_map('intval', $b['ids'] ?? []);
    $act    = $b['action'] ?? '';
    if (empty($ids)) send_json(['ok' => false, 'error' => 'No IDs'], 422);

    $map = [
        'shortlist'    => "UPDATE applicants SET is_shortlisted=1 WHERE id IN (",
        'unshortlist'  => "UPDATE applicants SET is_shortlisted=0 WHERE id IN (",
        'verify'       => "UPDATE applicants SET is_verified=1, admitted_at=NOW() WHERE id IN (",
        'unverify'     => "UPDATE applicants SET is_verified=0, admitted_at=NULL WHERE id IN (",
        'mark_paid'    => "UPDATE applicants SET is_paid=1        WHERE id IN (",
        'unmark_paid'  => "UPDATE applicants SET is_paid=0        WHERE id IN (",
    ];

    if ($act === 'delete') {
        if ($role !== 'admin') send_json(['ok' => false, 'error' => 'Admin only'], 403);
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $st = $mysqli->prepare("DELETE FROM applicants WHERE id IN ($ph)");
        $tp = str_repeat('i', count($ids));
        $st->bind_param($tp, ...$ids); $st->execute();
        send_json(['ok' => true, 'affected' => $st->affected_rows]);
    }

    if (!isset($map[$act])) send_json(['ok' => false, 'error' => 'Unknown action'], 400);
    if (in_array($act, ['verify','unverify'], true) && $role !== 'admin')
        send_json(['ok' => false, 'error' => 'Admin only'], 403);

    $ph = implode(',', array_fill(0, count($ids), '?'));
    $st = $mysqli->prepare($map[$act] . "$ph)");
    $tp = str_repeat('i', count($ids));
    $st->bind_param($tp, ...$ids); $st->execute();
    send_json(['ok' => true, 'affected' => $st->affected_rows]);
}

// ── POST /api/applicants.php?action=comment ──────────────────────────────
if ($method === 'POST' && $action === 'comment') {
    $b  = get_body();
    $id = intval($b['id'] ?? 0);
    $cm = $b['comment'] ?? '';
    $st = $mysqli->prepare("UPDATE applicants SET admin_comments=? WHERE id=?");
    $st->bind_param('si', $cm, $id); $st->execute();
    send_json(['ok' => true]);
}

send_json(['ok' => false, 'error' => 'Invalid request'], 400);
