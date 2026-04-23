<?php
// ============================================
// backend/middleware/auth.php
// Session-based authentication middleware
// ============================================

/**
 * Requires the user to be logged in.
 * If not, returns 401 JSON response and exits.
 */
function requireAuth(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Unauthorized. Please log in first.'
        ]);
        exit;
    }
}

/**
 * Returns the currently logged-in user's ID from session.
 */
function currentUserId(): int {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    return (int)($_SESSION['user_id'] ?? 0);
}

/**
 * Returns whether a user is currently logged in.
 */
function isLoggedIn(): bool {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    return !empty($_SESSION['user_id']);
}
