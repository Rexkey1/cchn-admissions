<?php
require_once __DIR__ . '/cors.php';
require_auth();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $file = $_FILES['file']['tmp_name'];
    $h = fopen($file, "r");

    $headers = fgetcsv($h); // Skip headers
    $inserted = 0; $skipped = 0; $errors = [];

    while (($row = fgetcsv($h)) !== false) {
        if (count($row) < 3) continue;
        $name = trim($row[0]);
        $phone = trim($row[1]);
        $prog = trim($row[2]);
        $pin = isset($row[3]) ? trim($row[3]) : '';
        $src = isset($row[4]) ? trim($row[4]) : '';

        if (!$name || !$phone || !$prog) {
            $skipped++;
            continue;
        }

        // Check duplicate
        $stmt = $db->prepare("SELECT id FROM applicants WHERE phone_number = ? AND program = ?");
        $stmt->bind_param("ss", $phone, $prog);
        $stmt->execute();
        if ($stmt->get_result()->fetch_assoc()) {
            $skipped++;
            continue;
        }

        $stmt = $db->prepare("INSERT INTO applicants (full_name, phone_number, program, pin_moh, source) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $name, $phone, $prog, $pin, $src);
        if ($stmt->execute()) $inserted++;
        else $errors[] = "Failed inserting $name";
    }
    fclose($h);
    send_json(['inserted' => $inserted, 'skipped' => $skipped, 'errors' => $errors]);
}
