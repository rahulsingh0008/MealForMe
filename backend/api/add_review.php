<?php
// ============================================
// backend/api/add_review.php
// Logged-in users can submit a review for a mess
// ============================================

session_start();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setHeaders();

// Must be logged in
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed.', 405);
}

$body = json_decode(file_get_contents('php://input'), true);

// Validate inputs
$required = ['mess_id', 'taste', 'hygiene', 'quantity'];
foreach ($required as $field) {
    if (!isset($body[$field])) {
        sendError("Field '$field' is required.");
    }
}

$messId   = (int)$body['mess_id'];
$taste    = (int)$body['taste'];
$hygiene  = (int)$body['hygiene'];
$quantity = (int)$body['quantity'];
$comment  = trim($body['comment'] ?? '');
$userId   = currentUserId();

// Validate rating values (1–5)
foreach (['taste' => $taste, 'hygiene' => $hygiene, 'quantity' => $quantity] as $name => $val) {
    if ($val < 1 || $val > 5) {
        sendError("'$name' must be between 1 and 5.");
    }
}

$db = getDB();

// Check mess exists
$check = $db->prepare('SELECT id FROM messes WHERE id = ?');
$check->bind_param('i', $messId);
$check->execute();
$check->store_result();
if ($check->num_rows === 0) {
    sendError('Mess not found.', 404);
}
$check->close();

// One review per user per mess
$dup = $db->prepare('SELECT id FROM reviews WHERE user_id = ? AND mess_id = ?');
$dup->bind_param('ii', $userId, $messId);
$dup->execute();
$dup->store_result();
if ($dup->num_rows > 0) {
    sendError('You have already reviewed this mess.');
}
$dup->close();

// Insert review
$ins = $db->prepare(
    'INSERT INTO reviews (user_id, mess_id, taste, hygiene, quantity, comment)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$ins->bind_param('iiiis', $userId, $messId, $taste, $hygiene, $quantity, $comment);
// Note: comment is string, so bind type is 'iiiis' (5 ints + 1 string)

// Fix: correct bind types
$ins->close();
$ins = $db->prepare(
    'INSERT INTO reviews (user_id, mess_id, taste, hygiene, quantity, comment)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$ins->bind_param('iiiiis', $userId, $messId, $taste, $hygiene, $quantity, $comment);

if (!$ins->execute()) {
    sendError('Failed to save review.', 500);
}
$ins->close();

// Recalculate and update mess rating + total_reviews
$calc = $db->prepare(
    'SELECT AVG((taste + hygiene + quantity) / 3.0) AS avg_rating, COUNT(*) AS cnt
     FROM reviews WHERE mess_id = ?'
);
$calc->bind_param('i', $messId);
$calc->execute();
$row = $calc->get_result()->fetch_assoc();
$calc->close();

$newRating = round((float)$row['avg_rating'], 2);
$newCount  = (int)$row['cnt'];

$upd = $db->prepare('UPDATE messes SET rating = ?, total_reviews = ? WHERE id = ?');
$upd->bind_param('dii', $newRating, $newCount, $messId);
$upd->execute();
$upd->close();
$db->close();

sendSuccess(
    ['new_rating' => $newRating, 'total_reviews' => $newCount],
    'Review submitted successfully!'
);
