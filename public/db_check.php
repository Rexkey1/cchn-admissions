<?php
ini_set('display_errors',1); error_reporting(E_ALL);
require_once __DIR__.'/../config/db.php';
echo $mysqli->connect_errno ? "DB FAIL: ".$mysqli->connect_error : "DB OK";
