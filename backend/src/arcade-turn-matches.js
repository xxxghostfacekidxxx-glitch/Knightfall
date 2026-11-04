const SUPPORTED_GAMES = new Set(["connect-four"]);
const BOARD_ROWS = 6;
const BOARD_COLUMNS = 7;

function emptyBoard() {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLUMNS).fill(0));
}

function validBoard(board) {
  return Array.isArray(board) && board.length === BOARD_ROWS && board.every(row =>
    Array.isArray(row) && row.length === BOARD_COLUMNS && row.every(cell => cell === 0 || cell === 1 || cell === 2)
  );
}

function hasFour(board, row, column, token) {
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    let count = 1;
    for (const sign of [-1, 1]) {
      let r = row + dr * sign, c = column + dc * sign;
      while (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLUMNS && board[r][c] === token) {
        count++;
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (count >= 4) return true;
  }
  return false;
}

function publicMatch(row, viewerId) {
  let state;
  try { state = JSON.parse(row.state_json); } catch { state = null; }
  const stateValid = !!state && validBoard(state.board);
  const viewerTurn = Number(row.current_player_id) === Number(viewerId);
  const waitingForInvite = row.status === "pending" && Number(row.player_two_id) === Number(viewerId);
  return {
    id: row.id,
    game_key: row.game_key,
    status: row.status,
    turn_number: Number(row.turn_number),
    current_player_id: row.current_player_id == null ? null : Number(row.current_player_id),
    winner_id: row.winner_id == null ? null : Number(row.winner_id),
    board: stateValid ? state.board : emptyBoard(),
    state_error: !stateValid,
    last_move: stateValid ? state.last_move || null : null,
    player_one: { id: Number(row.player_one_id), username: row.player_one_username, display_name: row.player_one_display_name },
    player_two: { id: Number(row.player_two_id), username: row.player_two_username, display_name: row.player_two_display_name },
    created_by: Number(row.created_by),
    needs_action: viewerTurn || waitingForInvite,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_move_at: row.last_move_at
  };
}

async function loadMatch(env, id) {
  return env.DB.prepare(`
    SELECT m.*,p1.username AS player_one_username,p1.display_name AS player_one_display_name,
           p2.username AS player_two_username,p2.display_name AS player_two_display_name
    FROM arcade_turn_matches m
    JOIN users p1 ON p1.id=m.player_one_id
    JOIN users p2 ON p2.id=m.player_two_id
    WHERE m.id=?
  `).bind(id).first();
}

function matchUrl(id) {
  return "/arcade/async-play.html?match=" + encodeURIComponent(id);
}

export async function handleArcadeTurnMatches(request, env, url, { getUser, json, rateLimit, origin, createNotification }) {
  if (!url.pathname.startsWith("/api/arcade/turn-matches")) return null;
  const user = await getUser(request, env);
  if (!user) return json({ error: "Sign in to play async matches with friends." }, 401, origin);
  if (!(await rateLimit(env, request, "arcade-turn-matches", 60, 60, user.id))) {
    return json({ error: "Too many match actions. Try again in a minute." }, 429, origin);
  }

  if (url.pathname === "/api/arcade/turn-matches" && request.method === "GET") {
    const rows = await env.DB.prepare(`
      SELECT m.*,p1.username AS player_one_username,p1.display_name AS player_one_display_name,
             p2.username AS player_two_username,p2.display_name AS player_two_display_name
      FROM arcade_turn_matches m
      JOIN users p1 ON p1.id=m.player_one_id
      JOIN users p2 ON p2.id=m.player_two_id
      WHERE (m.player_one_id=? OR m.player_two_id=?)
        AND NOT EXISTS (
          SELECT 1 FROM user_blocks b
          WHERE (b.blocker_id=m.player_one_id AND b.blocked_id=m.player_two_id)
             OR (b.blocker_id=m.player_two_id AND b.blocked_id=m.player_one_id)
        )
      ORDER BY CASE WHEN m.status='active' AND m.current_player_id=? THEN 0
                    WHEN m.status='pending' AND m.player_two_id=? THEN 0 ELSE 1 END,
               m.updated_at DESC
      LIMIT 100
    `).bind(user.id, user.id, user.id, user.id).all();
    return json({ matches: (rows.results || []).map(row => publicMatch(row, user.id)) }, 200, origin);
  }

  if (url.pathname === "/api/arcade/turn-matches" && request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid challenge details." }, 400, origin);
    const gameKey = String(body.game_key || "");
    const opponentId = Number(body.opponent_id);
    if (!SUPPORTED_GAMES.has(gameKey)) return json({ error: "That game does not support async matches yet." }, 400, origin);
    if (!Number.isSafeInteger(opponentId) || opponentId < 1 || opponentId === Number(user.id)) {
      return json({ error: "Choose one of your accepted friends." }, 400, origin);
    }
    const friendship = await env.DB.prepare(`
      SELECT 1 FROM friend_requests
      WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?))
      LIMIT 1
    `).bind(user.id, opponentId, opponentId, user.id).first();
    if (!friendship) return json({ error: "Async matches are available between accepted friends." }, 403, origin);
    const [opponent, blocked] = await Promise.all([
      env.DB.prepare("SELECT id,username,status FROM users WHERE id=?").bind(opponentId).first(),
      env.DB.prepare("SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1").bind(user.id, opponentId, opponentId, user.id).first()
    ]);
    if (!opponent || opponent.status !== "active") return json({ error: "Friend not found." }, 404, origin);
    if (blocked) return json({ error: "Async matches are unavailable between these accounts." }, 403, origin);
    const existing = await env.DB.prepare(`
      SELECT id FROM arcade_turn_matches
      WHERE game_key=? AND status IN ('pending','active')
        AND ((player_one_id=? AND player_two_id=?) OR (player_one_id=? AND player_two_id=?))
      ORDER BY updated_at DESC LIMIT 1
    `).bind(gameKey, user.id, opponentId, opponentId, user.id).first();
    if (existing) return json({ error: "You already have an open match with this friend.", match_id: existing.id }, 409, origin);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try { await env.DB.prepare(`
      INSERT INTO arcade_turn_matches
        (id,game_key,player_one_id,player_two_id,created_by,status,state_json,current_player_id,turn_number,created_at,updated_at)
      VALUES (?,? ,?,?,?,'pending',?,NULL,0,?,?)
    `).bind(id, gameKey, user.id, opponentId, user.id, JSON.stringify({ board: emptyBoard(), last_move: null }), now, now).run();
    } catch (error) {
      if (String(error?.message || error).includes("UNIQUE constraint failed")) return json({ error: "You already have an open match with this friend." }, 409, origin);
      throw error;
    }
    await createNotification(env, {
      userId: opponentId, actorId: user.id, kind: "arcade_turn_invite", targetType: "arcade_match",
      title: "Connect Four challenge", body: "@" + user.username + " challenged you to an async match. No rush—play whenever you want.", url: matchUrl(id)
    });
    const row = await loadMatch(env, id);
    return json({ match: publicMatch(row, user.id) }, 201, origin);
  }

  const matchRoute = url.pathname.match(/^\/api\/arcade\/turn-matches\/([a-f0-9-]{36})(?:\/(accept|decline|cancel|moves))?$/i);
  if (!matchRoute) return json({ error: "Async match route not found." }, 404, origin);
  const [, id, action] = matchRoute;
  const row = await loadMatch(env, id);
  if (!row) return json({ error: "Match not found." }, 404, origin);
  if (Number(row.player_one_id) !== Number(user.id) && Number(row.player_two_id) !== Number(user.id)) {
    return json({ error: "This match belongs to other members." }, 403, origin);
  }
  const blocked = await env.DB.prepare(
    "SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1"
  ).bind(row.player_one_id, row.player_two_id, row.player_two_id, row.player_one_id).first();
  if (blocked) return json({ error: "This match is unavailable." }, 404, origin);

  if (!action && request.method === "GET") {
    const moveRows = await env.DB.prepare(`
      SELECT m.turn_number,m.player_id,m.move_json,m.created_at,u.username,u.display_name
      FROM arcade_turn_moves m JOIN users u ON u.id=m.player_id
      WHERE m.match_id=? ORDER BY m.turn_number ASC
    `).bind(id).all();
    return json({ match: publicMatch(row, user.id), moves: moveRows.results || [] }, 200, origin);
  }

  if (action === "accept" || action === "decline") {
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, origin);
    if (Number(row.player_two_id) !== Number(user.id) || row.status !== "pending") {
      return json({ error: "This invitation is no longer waiting for your response." }, 409, origin);
    }
    const accepted = action === "accept";
    const now = new Date().toISOString();
    const result = await env.DB.prepare(`
      UPDATE arcade_turn_matches
      SET status=?,current_player_id=?,updated_at=?
      WHERE id=? AND player_two_id=? AND status='pending'
    `).bind(accepted ? "active" : "declined", accepted ? row.player_one_id : null, now, id, user.id).run();
    if (Number(result.meta?.changes || 0) !== 1) return json({ error: "This invitation changed. Refresh your matches." }, 409, origin);
    await createNotification(env, {
      userId: Number(row.player_one_id), actorId: user.id,
      kind: accepted ? "arcade_turn_accepted" : "arcade_turn_declined", targetType: "arcade_match",
      title: accepted ? "Challenge accepted" : "Challenge declined",
      body: accepted ? "@" + user.username + " accepted your Connect Four challenge. You're up first." : "@" + user.username + " declined your Connect Four challenge.",
      url: matchUrl(id)
    });
    return json({ match: publicMatch(await loadMatch(env, id), user.id) }, 200, origin);
  }

  if (action === "cancel") {
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, origin);
    if (Number(row.created_by) !== Number(user.id) || row.status !== "pending") return json({ error: "Only the inviter can cancel a waiting invitation." }, 409, origin);
    const now = new Date().toISOString();
    const result = await env.DB.prepare("UPDATE arcade_turn_matches SET status='cancelled',updated_at=? WHERE id=? AND created_by=? AND status='pending'").bind(now, id, user.id).run();
    if (Number(result.meta?.changes || 0) !== 1) return json({ error: "This invitation changed. Refresh your matches." }, 409, origin);
    await createNotification(env, {
      userId: Number(row.player_two_id), actorId: user.id, kind: "arcade_turn_cancelled", targetType: "arcade_match",
      title: "Challenge cancelled", body: "@" + user.username + " cancelled their Connect Four challenge.", url: matchUrl(id)
    });
    return json({ match: publicMatch(await loadMatch(env, id), user.id) }, 200, origin);
  }

  if (action === "moves" && request.method === "POST") {
    if (row.status !== "active") return json({ error: "This match is not accepting moves." }, 409, origin);
    if (Number(row.current_player_id) !== Number(user.id)) return json({ error: "It's your friend's turn. Your board will be here when they move." }, 409, origin);
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid move details." }, 400, origin);
    const column = Number(body.column), expectedTurn = Number(body.turn_number);
    if (!Number.isSafeInteger(column) || column < 0 || column >= BOARD_COLUMNS) return json({ error: "Choose a column on the board." }, 400, origin);
    if (!Number.isSafeInteger(expectedTurn) || expectedTurn !== Number(row.turn_number)) return json({ error: "The board changed. Refresh and take your turn on the latest position.", conflict: true }, 409, origin);
    let state;
    try { state = JSON.parse(row.state_json); } catch { state = null; }
    if (!validBoard(state.board)) return json({ error: "This match board needs an admin review." }, 409, origin);
    let targetRow = -1;
    for (let r = BOARD_ROWS - 1; r >= 0; r--) if (state.board[r][column] === 0) { targetRow = r; break; }
    if (targetRow < 0) return json({ error: "That column is full. Choose another one." }, 400, origin);
    const token = Number(row.player_one_id) === Number(user.id) ? 1 : 2;
    state.board[targetRow][column] = token;
    state.last_move = { row: targetRow, column, player_id: Number(user.id) };
    const won = hasFour(state.board, targetRow, column, token);
    const full = state.board.every(boardRow => boardRow.every(cell => cell !== 0));
    const terminal = won || full;
    const nextPlayer = terminal ? null : token === 1 ? Number(row.player_two_id) : Number(row.player_one_id);
    const status = terminal ? "completed" : "active";
    const winner = won ? Number(user.id) : null;
    const nextTurn = Number(row.turn_number) + 1;
    const now = new Date().toISOString();
    const update = env.DB.prepare(`
      UPDATE arcade_turn_matches SET state_json=?,current_player_id=?,turn_number=?,status=?,winner_id=?,updated_at=?,last_move_at=?
      WHERE id=? AND status='active' AND current_player_id=? AND turn_number=?
    `).bind(JSON.stringify(state), nextPlayer, nextTurn, status, winner, now, now, id, user.id, expectedTurn);
    const log = env.DB.prepare(`
      INSERT OR IGNORE INTO arcade_turn_moves(match_id,turn_number,player_id,move_json,created_at)
      SELECT ?,?,?,?,? WHERE EXISTS(
        SELECT 1 FROM arcade_turn_matches WHERE id=? AND turn_number=? AND state_json=? AND updated_at=?
      )
    `).bind(id, nextTurn, user.id, JSON.stringify({ column, row: targetRow }), now, id, nextTurn, JSON.stringify(state), now);
    const [updated] = await env.DB.batch([update, log]);
    if (Number(updated.meta?.changes || 0) !== 1) return json({ error: "The board changed before your move arrived. Refresh and take your turn on the latest position.", conflict: true }, 409, origin);
    const nextRow = await loadMatch(env, id);
    const recipient = terminal ? (Number(row.player_one_id) === Number(user.id) ? Number(row.player_two_id) : Number(row.player_one_id)) : nextPlayer;
    const title = won ? "Connect Four finished" : full ? "Connect Four is a draw" : "Your Connect Four turn";
    const bodyText = won ? "@" + user.username + " won the match." : full ? "The board filled up. The match is a draw." : "@" + user.username + " made a move. Your turn is ready whenever you are.";
    await createNotification(env, { userId: recipient, actorId: user.id, kind: "arcade_turn", targetType: "arcade_match", title, body: bodyText, url: matchUrl(id) });
    return json({ match: publicMatch(nextRow, user.id) }, 200, origin);
  }

  return json({ error: "Method not allowed." }, 405, origin);
}
