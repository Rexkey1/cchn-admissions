<?php
require_once __DIR__ . '/cors.php';
require_auth();

// Simplified dashboard stats
$stats = [
    'total' => $db->query("SELECT COUNT(*) FROM applicants")->fetch_row()[0],
    'shortlisted' => $db->query("SELECT COUNT(*) FROM applicants WHERE is_shortlisted = 1")->fetch_row()[0],
    'verified' => $db->query("SELECT COUNT(*) FROM applicants WHERE is_verified = 1")->fetch_row()[0],
    'paid' => $db->query("SELECT COUNT(*) FROM applicants WHERE is_paid = 1")->fetch_row()[0],
];

// Recent activity (last 5 applicants)
$recent = $db->query("SELECT id, full_name, program, created_at FROM applicants ORDER BY created_at DESC LIMIT 5")->fetch_all(MYSQLI_ASSOC);

send_json(['stats' => $stats, 'recent' => $recent]);
