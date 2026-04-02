<?php
// api/dates.php — Interview date management
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/db.php';
$user   = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── GET /api/dates.php  (summary: distinct dates + counts) ───────────────
if ($method === 'GET' && $action === '') {
    $q    = trim($_GET['q'] ?? '');
    $prog = trim($_GET['program'] ?? '');
    $date = trim($_GET['date'] ?? '');   // filter to single date

    $where = " WHERE interview_date IS NOT NULL"; $params = []; $types = '';

    if ($date !== '') {
        $where .= " AND interview_date = ?"; $params[] = $date; $types .= 's';
    }
    if (in_array($prog, ['Diploma','Certificate'], true)) {
        $where .= " AND program = ?"; $params[] = $prog; $types .= 's';
    }
    if ($q !== '') {
        $where .= " AND (full_name LIKE ? OR pin_moh LIKE ? OR phone_number LIKE ?)";
        for ($i=0; $i<3; $i++) { $params[] = "%$q%"; $types .= 's'; }
    }

    // If filtering by a single date (detail view), return rows directly
    if ($date !== '') {
        $sql = "SELECT id, pin_moh, full_name, program, phone_number, source,
                       interview_date, is_shortlisted, is_verified, is_paid
                FROM applicants$where ORDER BY full_name ASC";
        $st = $mysqli->prepare($sql);
        if ($params) $st->bind_param($types, ...$params);
        $st->execute(); $rows = []; $res = $st->get_result();
        while ($r = $res->fetch_assoc()) $rows[] = $r;
        $st->close();
        send_json(['ok' => true, 'rows' => $rows]);
    }

    // Otherwise return grouped summary by date
    $sql = "SELECT interview_date,
                   COUNT(*)                                                AS total,
                   SUM(CASE WHEN program='Diploma'     THEN 1 ELSE 0 END) AS diploma,
                   SUM(CASE WHEN program='Certificate' THEN 1 ELSE 0 END) AS certificate
            FROM applicants$where
            GROUP BY interview_date
            ORDER BY interview_date ASC";
    $st = $mysqli->prepare($sql);
    if ($params) $st->bind_param($types, ...$params);
    $st->execute(); $groups = []; $res = $st->get_result();
    while ($r = $res->fetch_assoc()) $groups[] = $r;
    $st->close();

    // Total without date assigned
    $noDate = (int)$mysqli->query("SELECT COUNT(*) FROM applicants WHERE interview_date IS NULL")->fetch_row()[0];

    send_json(['ok' => true, 'groups' => $groups, 'unscheduled' => $noDate]);
}

// ── POST /api/dates.php?action=assign  (assign a date to selected IDs) ──
if ($method === 'POST' && $action === 'assign') {
    $b    = get_body();
    $ids  = array_map('intval', $b['ids'] ?? []);
    $date = trim($b['date'] ?? '');
    if (empty($ids)) send_json(['ok' => false, 'error' => 'No applicant IDs provided'], 422);
    // $date = '' clears the date
    $dateVal = ($date !== '' && strtotime($date)) ? date('Y-m-d', strtotime($date)) : null;
    $ph = implode(',', array_fill(0, count($ids), '?'));
    $st = $mysqli->prepare("UPDATE applicants SET interview_date=? WHERE id IN ($ph)");
    $tp = 's' . str_repeat('i', count($ids));
    $args = array_merge([$dateVal], $ids);
    $st->bind_param($tp, ...$args);
    $st->execute();
    send_json(['ok' => true, 'affected' => $st->affected_rows]);
}

// ── POST /api/dates.php?action=upload  (CSV: phone/pin → date mapping) ──
if ($method === 'POST' && $action === 'upload') {
    $file = $_FILES['file'] ?? null;
    if (!$file || $file['error'] !== UPLOAD_ERR_OK) send_json(['ok'=>false,'error'=>'Upload failed'],422);
    $handle = fopen($file['tmp_name'], 'r');
    if (!$handle) send_json(['ok'=>false,'error'=>'Cannot read file'],500);

    $updated = 0; $skipped = 0; $errors = [];
    $header = null; $line = 0;
    while (($row = fgetcsv($handle, 1000, ',')) !== false) {
        $line++;
        if ($line === 1) { $header = array_map(fn($h)=>strtolower(trim($h)), $row); continue; }
        if (count($row) < 2) continue;
        $data = [];
        if ($header) foreach ($header as $i => $col) $data[$col] = trim($row[$i] ?? '');
        else $data = ['phone_number'=>trim($row[0]??''), 'interview_date'=>trim($row[1]??'')];

        $phone = $data['phone_number'] ?? $data['phone'] ?? '';
        $pin   = $data['pin_moh'] ?? $data['pin'] ?? '';
        $date  = $data['interview_date'] ?? $data['date'] ?? '';

        if (!$phone && !$pin) { $skipped++; $errors[] = "Row $line: no phone or PIN"; continue; }
        if (!$date || !strtotime($date)) { $skipped++; $errors[] = "Row $line: invalid date '$date'"; continue; }
        $dateVal = date('Y-m-d', strtotime($date));

        // Find matching applicant
        if ($pin) {
            $st = $mysqli->prepare("SELECT id FROM applicants WHERE pin_moh=? OR phone_number=? LIMIT 1");
            $st->bind_param('ss', $pin, $phone);
        } else {
            $st = $mysqli->prepare("SELECT id FROM applicants WHERE phone_number=? LIMIT 1");
            $st->bind_param('s', $phone);
        }
        $st->execute(); $st->bind_result($appId); $found = $st->fetch(); $st->close();

        if (!$found) { $skipped++; $errors[] = "Row $line: applicant not found (phone=$phone, pin=$pin)"; continue; }

        $su = $mysqli->prepare("UPDATE applicants SET interview_date=? WHERE id=?");
        $su->bind_param('si', $dateVal, $appId); $su->execute();
        $updated++;
    }
    fclose($handle);
    send_json(['ok'=>true,'updated'=>$updated,'skipped'=>$skipped,'errors'=>$errors]);
}

// ── DELETE /api/dates.php?action=clear&id=N  (clear one applicant's date) ──
if ($method === 'DELETE' && $action === 'clear') {
    $id = intval($_GET['id'] ?? 0);
    $st = $mysqli->prepare("UPDATE applicants SET interview_date=NULL WHERE id=?");
    $st->bind_param('i', $id); $st->execute();
    send_json(['ok'=>true]);
}

send_json(['ok'=>false,'error'=>'Invalid request'], 400);
