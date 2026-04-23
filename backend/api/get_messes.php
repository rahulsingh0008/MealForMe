<?php
// ============================================
// backend/api/get_messes.php
// Returns mess listings with optional filters
// Also returns a single mess + its reviews when ?id= is provided
// ============================================

session_start();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed.', 405);
}

$db = getDB();

// ── Single Mess Detail ──────────────────────
if (!empty($_GET['id'])) {
    $id = (int)$_GET['id'];

    // Fetch mess
    $stmt = $db->prepare('SELECT * FROM messes WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $mess = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$mess) {
        sendError('Mess not found.', 404);
    }

    // Fetch its reviews with user names
    $rev = $db->prepare(
        'SELECT r.id, r.taste, r.hygiene, r.quantity, r.comment, r.created_at,
                u.fname, u.lname
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.mess_id = ?
         ORDER BY r.created_at DESC'
    );
    $rev->bind_param('i', $id);
    $rev->execute();
    $reviews = $rev->get_result()->fetch_all(MYSQLI_ASSOC);
    $rev->close();

    // Has the current user already reviewed this mess?
    $alreadyReviewed = false;
    if (isLoggedIn()) {
        $uid   = currentUserId();
        $check = $db->prepare('SELECT id FROM reviews WHERE user_id = ? AND mess_id = ?');
        $check->bind_param('ii', $uid, $id);
        $check->execute();
        $check->store_result();
        $alreadyReviewed = $check->num_rows > 0;
        $check->close();
    }

    $db->close();
    sendSuccess([
        'mess'            => $mess,
        'reviews'         => $reviews,
        'already_reviewed'=> $alreadyReviewed,
        'logged_in'       => isLoggedIn()
    ]);
}

// ── Mess Listing (with optional filters) ───
$where  = [];
$params = [];
$types  = '';

// Filter by type (veg / nonveg / jain)
if (!empty($_GET['type']) && in_array($_GET['type'], ['veg', 'nonveg', 'jain'])) {
    $where[]  = 'm.type = ?';
    $params[] = $_GET['type'];
    $types   .= 's';
}

// Filter by area (partial match)
if (!empty($_GET['area'])) {
    $where[]  = 'm.area LIKE ?';
    $params[] = '%' . $db->real_escape_string($_GET['area']) . '%';
    $types   .= 's';
}

// Filter by max price
if (!empty($_GET['max_price']) && is_numeric($_GET['max_price'])) {
    $where[]  = 'm.price <= ?';
    $params[] = (float)$_GET['max_price'];
    $types   .= 'd';
}

// Sort: rating | price_asc | price_desc | distance
$sortMap = [
    'rating'     => 'm.rating DESC',
    'price_asc'  => 'm.price ASC',
    'price_desc' => 'm.price DESC',
    'distance'   => 'm.distance ASC',
];
$sort = $sortMap[$_GET['sort'] ?? 'rating'] ?? 'm.rating DESC';

$sql = 'SELECT * FROM messes m';
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= " ORDER BY $sort";

$stmt = $db->prepare($sql);
if ($params) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$messes = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();
$db->close();

sendSuccess([
    'messes'    => $messes,
    'logged_in' => isLoggedIn()
]);
