<?php
// ============================================
// backend/utils/response.php
// Helper functions for consistent JSON responses
// ============================================

/**
 * Sends a JSON success response.
 */
function sendSuccess(mixed $data = [], string $message = 'Success', int $code = 200): void {
    http_response_code($code);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data'    => $data
    ]);
    exit;
}

/**
 * Sends a JSON error response.
 */
function sendError(string $message = 'An error occurred', int $code = 400): void {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}

/**
 * Sets common headers: JSON content type + CORS for localhost.
 */
function setHeaders(): void {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: http://localhost');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    // Handle pre-flight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
