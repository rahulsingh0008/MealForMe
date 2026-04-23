<?php
// ============================================
// backend/api/logout.php
// Destroys the user session
// ============================================

session_start();

require_once __DIR__ . '/../utils/response.php';

setHeaders();

// Clear all session variables
$_SESSION = [];

// Destroy the session cookie
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(), '', time() - 42000,
        $params['path'], $params['domain'],
        $params['secure'], $params['httponly']
    );
}

session_destroy();

sendSuccess([], 'Logged out successfully.');
