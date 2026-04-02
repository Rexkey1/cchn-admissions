<?php
// api/dashboard.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/db.php';
require_auth();

// Check which optional columns exist
$hasVerified = (bool) $mysqli->query("SHOW COLUMNS FROM applicants LIKE 'is_verified'")->num_rows;
$hasPaid     = (bool) $mysqli->query("SHOW COLUMNS FROM applicants LIKE 'is_paid'")->num_rows;

$sql = "SELECT
    COUNT(*)                                                       AS total,
    SUM(CASE WHEN program='Diploma'      THEN 1 ELSE 0 END)        AS total_dip,
    SUM(CASE WHEN program='Certificate'  THEN 1 ELSE 0 END)        AS total_cert,
    SUM(CASE WHEN is_shortlisted=1       THEN 1 ELSE 0 END)        AS sl_total,
    SUM(CASE WHEN is_shortlisted=1 AND program='Diploma'     THEN 1 ELSE 0 END) AS sl_dip,
    SUM(CASE WHEN is_shortlisted=1 AND program='Certificate' THEN 1 ELSE 0 END) AS sl_cert"
    . ($hasVerified ? ",
    SUM(CASE WHEN is_verified=1 THEN 1 ELSE 0 END)                 AS v_total,
    SUM(CASE WHEN is_verified=1 AND program='Diploma'     THEN 1 ELSE 0 END) AS v_dip,
    SUM(CASE WHEN is_verified=1 AND program='Certificate' THEN 1 ELSE 0 END) AS v_cert" : "")
    . ($hasPaid ? ",
    SUM(CASE WHEN is_paid=1 THEN 1 ELSE 0 END)                     AS paid_total" : "")
    . " FROM applicants";

$result = $mysqli->query($sql);
$stats  = $result->fetch_assoc();

// Cast to int
foreach ($stats as $k => $v) $stats[$k] = (int)$v;

send_json(['ok' => true, 'stats' => $stats, 'hasVerified' => $hasVerified, 'hasPaid' => $hasPaid]);
