<?php
// public/health.php
// Used by uptime monitors/load balancers to check if PHP is serving requests.
header('Content-Type: text/plain');
echo "OK";