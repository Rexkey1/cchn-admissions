<?php
// api/upload.php — CSV upload for bulk applicant import
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/db.php';
require_auth();

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

$inserted = 0; $skipped = 0; $errors = [];
$header = null; $lineNo = 0;

while (($row = fgetcsv($handle, 1000, ',')) !== false) {
    $lineNo++;
    if ($lineNo === 1) {
        // Normalize header
        $header = array_map(fn($h) => strtolower(trim($h)), $row);
        continue;
    }
    if (count($row) < 2) continue;

    // Map columns
    $data = [];
    if ($header) {
        foreach ($header as $i => $col) {
            $data[$col] = trim($row[$i] ?? '');
        }
    } else {
        // No header - assume: pin_moh, full_name, program, phone_number, source
        $data = [
            'pin_moh'      => trim($row[0] ?? ''),
            'full_name'    => trim($row[1] ?? ''),
            'program'      => trim($row[2] ?? ''),
            'phone_number' => trim($row[3] ?? ''),
            'source'       => trim($row[4] ?? ''),
        ];
    }

    $name  = $data['full_name'] ?? $data['name'] ?? '';
    $prog  = $data['program'] ?? '';
    $phone = $data['phone_number'] ?? $data['phone'] ?? '';
    $pin   = ($data['pin_moh'] ?? $data['pin'] ?? '') ?: null;
    $src   = ($data['source'] ?? '') ?: null;

    // Normalize program
    $progNorm = '';
    if (stripos($prog, 'dip') !== false) $progNorm = 'Diploma';
    elseif (stripos($prog, 'cert') !== false) $progNorm = 'Certificate';
    else $progNorm = $prog;

    if (!$name || !in_array($progNorm, ['Diploma','Certificate'], true) || !$phone) {
        $errors[] = "Row $lineNo skipped: name='$name', program='$prog', phone='$phone'";
        $skipped++;
        continue;
    }

    // Check duplicate
    $sd = $mysqli->prepare("SELECT id FROM applicants WHERE phone_number=?" . ($pin ? " OR pin_moh=?" : "") . " LIMIT 1");
    if ($pin) $sd->bind_param('ss', $phone, $pin); else $sd->bind_param('s', $phone);
    $sd->execute(); $sd->store_result();
    if ($sd->num_rows > 0) { $skipped++; $sd->close(); continue; }
    $sd->close();

    $st = $mysqli->prepare("INSERT INTO applicants (pin_moh, full_name, program, phone_number, source) VALUES(?,?,?,?,?)");
    $st->bind_param('sssss', $pin, $name, $progNorm, $phone, $src);
    if ($st->execute()) $inserted++;
    else { $errors[] = "Row $lineNo DB error: " . $st->error; $skipped++; }
}
fclose($handle);

send_json(['ok' => true, 'inserted' => $inserted, 'skipped' => $skipped, 'errors' => $errors]);
