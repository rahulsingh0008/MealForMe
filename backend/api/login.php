<?php
// ============================================
// backend/api/login.php
// Authenticates user and creates a session
// ============================================

session_start();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';

setHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed.', 405);
}

$body = json_decode(file_get_contents('php://input'), true);

if (empty($body['email']) || empty($body['password'])) {
    sendError('Email and password are required.');
}

$email    = strtolower(trim($body['email']));
$password = $body['password'];

$db = getDB();

// Fetch user by email
$stmt = $db->prepare(
    'SELECT id, fname, lname, email, password, area FROM users WHERE email = ?'
);
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user   = $result->fetch_assoc();
$stmt->close();
$db->close();

// Validate user existence and password
if (!$user || !password_verify($password, $user['password'])) {
    sendError('Invalid email or password.', 401);
}

// Create session
$_SESSION['user_id']   = $user['id'];
$_SESSION['user_name'] = $user['fname'];
$_SESSION['user_email']= $user['email'];

sendSuccess(
    [
        'id'    => $user['id'],
        'fname' => $user['fname'],
        'lname' => $user['lname'],
        'email' => $user['email'],
        'area'  => $user['area']
    ],
    'Logged in successfully!'
);
