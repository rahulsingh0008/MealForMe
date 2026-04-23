<?php
// ============================================
// backend/api/auth_status.php
// Returns current session/login status
// Called by frontend on every page load
// ============================================

session_start();

require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setHeaders();

if (isLoggedIn()) {
    sendSuccess([
        'logged_in' => true,
        'user_id'   => $_SESSION['user_id'],
        'name'      => $_SESSION['user_name'],
        'email'     => $_SESSION['user_email']
    ]);
} else {
    sendSuccess(['logged_in' => false]);
}
