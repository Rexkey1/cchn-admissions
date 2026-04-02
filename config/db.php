<?php
// config/db.php

// 1. Enable error reporting for local debugging
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// 2. Database Credentials (XAMPP Default)
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'applicant_manager'); // Corrected: Using underscore

try {
    // 3. Connect
    $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $mysqli->set_charset("utf8mb4");

} catch (mysqli_sql_exception $e) {
    // 4. Error Handling
    die("<h1>Database Connection Failed</h1>
         <p><strong>Error Message:</strong> " . $e->getMessage() . "</p>
         <p>Please check:</p>
         <ul>
            <li>Is XAMPP running?</li>
            <li>Does the database <code>applicant_manager</code> exist in phpMyAdmin?</li>
         </ul>");
}
