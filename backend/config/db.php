<?php
// ============================================
// backend/config/db.php
// Database connection using mysqli
// ============================================

define('DB_HOST', 'localhost');
define('DB_USER', 'root');        // Change if your MySQL user is different
define('DB_PASS', '');            // Change to your MySQL password
define('DB_NAME', 'mealforme');

/**
 * Returns a mysqli connection object.
 * Exits with JSON error if connection fails.
 */
function getDB(): mysqli {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $conn->connect_error
        ]);
        exit;
    }

    // Ensure UTF-8 throughout
    $conn->set_charset('utf8mb4');
    return $conn;
}
