<?php
// api/bulk_schedule.php — Bulk upload: full_name + pin_moh + interview_date
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/db.php';
require_admin(); // admin-only

if ($_SERVER['REQUEST_METHOD'] !== 'POST') send_json(['ok' => false, 'error' => 'POST required'], 405);

$file = $_FILES['file'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    send_json(['ok' => false, 'error' => 'File upload failed or no file provided.'], 422);
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, ['csv', 'txt'])) {
    send_json(['ok' => false, 'error' => 'Only CSV files are accepted.'], 422);
}

$handle = fopen($file['tmp_name'], 'r');
if (!$handle) send_json(['ok' => false, 'error' => 'Could not read file.'], 500);

$inserted = 0; $updated  = 0; $skipped  = 0; $errors   = [];
$header   = null; $lineNo   = 0;

while (($row = fgetcsv($handle, 2000, ',')) !== false) {
    $lineNo++;
    if ($lineNo === 1) { $header = array_map(fn($h) => strtolower(trim($h)), $row); continue; }
    if (count(array_filter($row, fn($v) => trim($v) !== '')) === 0) continue;

    $data = [];
    if ($header) {
        foreach ($header as $i => $col) $data[$col] = trim($row[$i] ?? '');
    } else {
        $data = ['full_name'=>trim($row[0]??''),'pin_moh'=>trim($row[1]??''),'interview_date'=>trim($row[2]??'')];
    }

    $name    = $data['full_name']      ?? $data['name'] ?? '';
    $pin     = $data['pin_moh']        ?? $data['pin']  ?? '';
    $dateRaw = $data['interview_date'] ?? $data['date'] ?? '';

    if (!$name || !$pin || !$dateRaw || !strtotime($dateRaw)) { $skipped++; continue; }
    $dateVal = date('Y-m-d', strtotime($dateRaw));

    $st = $mysqli->prepare("SELECT id FROM applicants WHERE pin_moh = ? LIMIT 1");
    $st->bind_param('s', $pin); $st->execute(); $st->bind_result($appId); $found = $st->fetch(); $st->close();

    if ($found && $appId) {
        $upd = $mysqli->prepare("UPDATE applicants SET interview_date = ?, full_name = ? WHERE id = ?");
        $upd->bind_param('ssi', $dateVal, $name, $appId); $upd->execute(); $upd->close();
        $updated++;
    } else {
        $program = 'Diploma'; $phone = $data['phone_number'] ?? $data['phone'] ?? ''; $src = ($data['source'] ?? '') ?: null;
        $progRaw = $data['program'] ?? '';
        if ($progRaw !== '') {
            if (stripos($progRaw, 'cert') !== false) $program = 'Certificate';
            elseif (stripos($progRaw, 'dip') !== false) $program = 'Diploma';
            else $program = $progRaw;
        }
        $ins = $mysqli->prepare("INSERT INTO applicants (pin_moh, full_name, program, phone_number, source, interview_date) VALUES (?, ?, ?, ?, ?, ?)");
        $ins->bind_param('ssssss', $pin, $name, $program, $phone, $src, $dateVal);
        if ($ins->execute()) $inserted++; else $skipped++;
        $ins->close();
    }
}
fclose($handle);
send_json(['ok'=>true, 'inserted'=>$inserted, 'updated'=>$updated, 'skipped'=>$skipped, 'errors'=>$errors]);
