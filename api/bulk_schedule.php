<?php
// api/bulk_schedule.php — Bulk upload: full_name + pin_moh + interview_date
// Creates new applicants OR updates existing ones by PIN/name match.
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

$inserted = 0;
$updated  = 0;
$skipped  = 0;
$errors   = [];
$header   = null;
$lineNo   = 0;

while (($row = fgetcsv($handle, 2000, ',')) !== false) {
    $lineNo++;

    // First row = header
    if ($lineNo === 1) {
        $header = array_map(fn($h) => strtolower(trim($h)), $row);
        continue;
    }

    // Skip completely empty lines
    if (count(array_filter($row, fn($v) => trim($v) !== '')) === 0) continue;

    // Map columns by header or positional fallback
    $data = [];
    if ($header) {
        foreach ($header as $i => $col) {
            $data[$col] = trim($row[$i] ?? '');
        }
    } else {
        // Positional fallback: full_name, pin_moh, interview_date
        $data = [
            'full_name'      => trim($row[0] ?? ''),
            'pin_moh'        => trim($row[1] ?? ''),
            'interview_date' => trim($row[2] ?? ''),
        ];
    }

    $name    = $data['full_name']      ?? $data['name'] ?? '';
    $pin     = $data['pin_moh']        ?? $data['pin']  ?? '';
    $dateRaw = $data['interview_date'] ?? $data['date'] ?? '';

    // Validate required fields
    if (!$name) {
        $errors[] = "Row $lineNo skipped: full_name is required.";
        $skipped++;
        continue;
    }
    if (!$pin) {
        $errors[] = "Row $lineNo skipped: pin_moh is required (name='$name').";
        $skipped++;
        continue;
    }
    if (!$dateRaw || !strtotime($dateRaw)) {
        $errors[] = "Row $lineNo skipped: invalid interview_date '$dateRaw' (name='$name').";
        $skipped++;
        continue;
    }

    $dateVal = date('Y-m-d', strtotime($dateRaw));

    // Look up existing applicant by pin_moh (primary) or full_name (fallback)
    $st = $mysqli->prepare("SELECT id FROM applicants WHERE pin_moh = ? LIMIT 1");
    $st->bind_param('s', $pin);
    $st->execute();
    $st->bind_result($appId);
    $found = $st->fetch();
    $st->close();

    if ($found && $appId) {
        // Update existing applicant's interview date AND full_name (keep PIN authoritative)
        $upd = $mysqli->prepare("UPDATE applicants SET interview_date = ?, full_name = ? WHERE id = ?");
        $upd->bind_param('ssi', $dateVal, $name, $appId);
        if ($upd->execute()) {
            $updated++;
        } else {
            $errors[] = "Row $lineNo DB error updating id=$appId: " . $upd->error;
            $skipped++;
        }
        $upd->close();
    } else {
        // Insert new applicant — program/phone are not in this CSV so default gracefully
        $program     = 'Diploma'; // default; can be overridden by optional column
        $phone       = $data['phone_number'] ?? $data['phone'] ?? '';
        $src         = ($data['source'] ?? '') ?: null;
        $progRaw     = $data['program'] ?? '';

        if ($progRaw !== '') {
            if (stripos($progRaw, 'cert') !== false) $program = 'Certificate';
            elseif (stripos($progRaw, 'dip') !== false) $program = 'Diploma';
            else $program = $progRaw;
        }

        // pin_moh must be unique — check again to avoid race condition
        $ck = $mysqli->prepare("SELECT id FROM applicants WHERE pin_moh = ? LIMIT 1");
        $ck->bind_param('s', $pin);
        $ck->execute();
        $ck->store_result();
        $dup = $ck->num_rows > 0;
        $ck->close();
        if ($dup) {
            // Was inserted between our first check and now — update instead
            $upd2 = $mysqli->prepare("UPDATE applicants SET interview_date = ?, full_name = ? WHERE pin_moh = ?");
            $upd2->bind_param('sss', $dateVal, $name, $pin);
            $upd2->execute();
            $upd2->close();
            $updated++;
            continue;
        }

        $ins = $mysqli->prepare(
            "INSERT INTO applicants (pin_moh, full_name, program, phone_number, source, interview_date)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $ins->bind_param('ssssss', $pin, $name, $program, $phone, $src, $dateVal);
        if ($ins->execute()) {
            $inserted++;
        } else {
            $errors[] = "Row $lineNo DB error inserting '$name': " . $ins->error;
            $skipped++;
        }
        $ins->close();
    }
}

fclose($handle);

send_json([
    'ok'       => true,
    'inserted' => $inserted,
    'updated'  => $updated,
    'skipped'  => $skipped,
    'errors'   => $errors,
]);
