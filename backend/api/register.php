<?php
// ============================================
// backend/api/register.php
// Registers a new user account
// ============================================

session_start();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';

setHeaders();

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed.', 405);
}

// Decode JSON body
$body = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['fname', 'lname', 'email', 'password', 'area'];
foreach ($required as $field) {
    if (empty($body[$field])) {
        sendError("Field '$field' is required.");
    }
}

$fname    = trim($body['fname']);
$lname    = trim($body['lname']);
$email    = strtolower(trim($body['email']));
$password = $body['password'];
$area     = trim($body['area']);

// Basic email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Invalid email address.');
}

// Password length check
if (strlen($password) < 6) {
    sendError('Password must be at least 6 characters.');
}

$db = getDB();

// Check if email already exists
$check = $db->prepare('SELECT id FROM users WHERE email = ?');
$check->bind_param('s', $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    sendError('An account with this email already exists.');
}
$check->close();

// Hash the password securely
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

// Insert new user
$stmt = $db->prepare(
    'INSERT INTO users (fname, lname, email, password, area) VALUES (?, ?, ?, ?, ?)'
);
$stmt->bind_param('sssss', $fname, $lname, $email, $hashedPassword, $area);

if (!$stmt->execute()) {
    sendError('Registration failed. Please try again.', 500);
}

$userId = $db->insert_id;
$stmt->close();
$db->close();

// Auto-login after registration
$_SESSION['user_id']   = $userId;
$_SESSION['user_name'] = $fname;
$_SESSION['user_email']= $email;

sendSuccess(
    ['id' => $userId, 'name' => $fname],
    'Account created successfully!',
    201
);
