import crypto from 'node:crypto';

const SESSION_DAYS = 14;
const INVITE_DAYS = 7;
const scrypt = (password, salt) => crypto.scryptSync(password, salt, 64);
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');

export function migrateAuth(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_salt TEXT NOT NULL, password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','member')) DEFAULT 'member',
      active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, created_by INTEGER REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY, code_hash TEXT NOT NULL UNIQUE, created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT, used_by INTEGER REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      csrf_hash TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_audit (
      id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id), action TEXT NOT NULL,
      created_at TEXT NOT NULL, detail TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_invites_expiry ON invitations(expires_at);
  `);
}

function audit(db, userId, action, detail = null) {
  db.prepare('INSERT INTO auth_audit(user_id,action,created_at,detail) VALUES(?,?,?,?)')
    .run(userId ?? null, action, new Date().toISOString(), detail);
}

function passwordRecord(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, passwordHash: scrypt(password, salt).toString('hex') };
}

export function bootstrapAdmin(db, username, password) {
  migrateAuth(db);
  validateCredentials(username, password);
  const record = passwordRecord(password);
  db.exec('BEGIN IMMEDIATE');
  try {
    if (db.prepare("SELECT 1 FROM users WHERE role='admin'").get()) throw new Error('An admin already exists; bootstrap is disabled.');
    const result = db.prepare('INSERT INTO users(username,password_salt,password_hash,role,created_at) VALUES(?,?,?,\'admin\',?)')
      .run(username.trim(), record.salt, record.passwordHash, new Date().toISOString());
    audit(db, Number(result.lastInsertRowid), 'bootstrap_admin');
    db.exec('COMMIT');
    return Number(result.lastInsertRowid);
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function validateCredentials(username, password) {
  if (typeof username !== 'string' || !/^[A-Za-z0-9_.-]{3,32}$/.test(username.trim())) throw new Error('Username must be 3–32 letters, numbers, dots, dashes, or underscores.');
  if (typeof password !== 'string' || password.length < 12 || password.length > 200) throw new Error('Password must be 12–200 characters.');
}

export function registerUser(db, username, password, inviteCode) {
  validateCredentials(username, password);
  if (typeof inviteCode !== 'string' || inviteCode.length < 20) throw new Error('A valid invitation code is required.');
  const now = new Date().toISOString();
  const invite = db.prepare('SELECT * FROM invitations WHERE code_hash=? AND used_at IS NULL AND expires_at>?').get(hash(inviteCode), now);
  if (!invite) throw new Error('Invitation code is invalid, expired, or already used.');
  const record = passwordRecord(password);
  db.exec('BEGIN IMMEDIATE');
  try {
    const current = db.prepare('SELECT id FROM invitations WHERE id=? AND used_at IS NULL AND expires_at>?').get(invite.id, now);
    if (!current) throw new Error('Invitation code is invalid, expired, or already used.');
    const result = db.prepare('INSERT INTO users(username,password_salt,password_hash,role,created_at,created_by) VALUES(?,?,?,\'member\',?,?)')
      .run(username.trim(), record.salt, record.passwordHash, now, invite.created_by);
    db.prepare('UPDATE invitations SET used_at=?,used_by=? WHERE id=?').run(now, Number(result.lastInsertRowid), invite.id);
    audit(db, Number(result.lastInsertRowid), 'register');
    db.exec('COMMIT');
    return Number(result.lastInsertRowid);
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function authenticate(db, username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username=? COLLATE NOCASE AND active=1').get(String(username || ''));
  const salt = user?.password_salt || '00000000000000000000000000000000';
  const candidate = scrypt(typeof password === 'string' ? password.slice(0, 200) : '', salt);
  if (!user || !crypto.timingSafeEqual(candidate, Buffer.from(user.password_hash, 'hex'))) return null;
  audit(db, user.id, 'login');
  return publicUser(user);
}

export function changeOwnPassword(db, userId, currentPassword, newPassword, sessionToken) {
  const user = db.prepare('SELECT * FROM users WHERE id=? AND active=1').get(userId);
  if (!user) throw new Error('Account is unavailable.');
  validateCredentials(user.username, newPassword);
  const candidate = scrypt(typeof currentPassword === 'string' ? currentPassword.slice(0, 200) : '', user.password_salt);
  if (!crypto.timingSafeEqual(candidate, Buffer.from(user.password_hash, 'hex'))) throw new Error('Current password is incorrect.');
  if (currentPassword === newPassword) throw new Error('Choose a password different from the current one.');
  const record = passwordRecord(newPassword);
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('UPDATE users SET password_salt=?,password_hash=? WHERE id=?').run(record.salt, record.passwordHash, userId);
    db.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').run(userId, hash(sessionToken || ''));
    audit(db, userId, 'change_password');
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function publicUser(user) { return { id: user.id, username: user.username, role: user.role, active: Boolean(user.active) }; }

export function createSession(db, userId) {
  const token = randomToken();
  const csrf = randomToken();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86400_000).toISOString();
  db.prepare('INSERT INTO sessions(token_hash,user_id,csrf_hash,created_at,expires_at) VALUES(?,?,?,?,?)')
    .run(hash(token), userId, hash(csrf), now.toISOString(), expires);
  return { token, csrf, expires };
}

export function cookies(req) {
  const values = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0) values[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return values;
}

export function currentUser(db, req) {
  const token = cookies(req).adas_session;
  if (!token) return null;
  const row = db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.active=1`).get(hash(token), new Date().toISOString());
  return row ? publicUser(row) : null;
}

export function requireCsrf(db, req) {
  const c = cookies(req);
  const header = req.headers['x-csrf-token'];
  if (!header || header !== c.adas_csrf) return false;
  const row = db.prepare('SELECT csrf_hash FROM sessions WHERE token_hash=? AND expires_at>?')
    .get(hash(c.adas_session || ''), new Date().toISOString());
  return Boolean(row && hash(header) === row.csrf_hash);
}

export function endSession(db, req) {
  const token = cookies(req).adas_session;
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));
}

export function sessionCookies(session, secure = true) {
  const age = SESSION_DAYS * 86400;
  const secureFlag = secure ? '; Secure' : '';
  return [
    `adas_session=${encodeURIComponent(session.token)}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${age}`,
    `adas_csrf=${encodeURIComponent(session.csrf)}; Path=/${secureFlag}; SameSite=Strict; Max-Age=${age}`
  ];
}
export function clearSessionCookies(secure = true) {
  const secureFlag = secure ? '; Secure' : '';
  return [
    `adas_session=; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=0`,
    `adas_csrf=; Path=/${secureFlag}; SameSite=Strict; Max-Age=0`
  ];
}

export function makeInvitation(db, user) {
  const activeInvites = db.prepare('SELECT COUNT(*) AS total FROM invitations WHERE created_by=? AND used_at IS NULL AND expires_at>?').get(user.id, new Date().toISOString()).total;
  if (activeInvites >= 10) throw new Error('You already have 10 active invitations.');
  const code = randomToken();
  const now = new Date();
  const expires = new Date(now.getTime() + INVITE_DAYS * 86400_000).toISOString();
  const result = db.prepare('INSERT INTO invitations(code_hash,created_by,created_at,expires_at) VALUES(?,?,?,?)')
    .run(hash(code), user.id, now.toISOString(), expires);
  audit(db, user.id, 'create_invitation', String(result.lastInsertRowid));
  return { id: Number(result.lastInsertRowid), code, expires_at: expires };
}

export function listInvitations(db) {
  return db.prepare(`SELECT i.id,u.username AS created_by,i.created_at,i.expires_at,i.used_at,
    used.username AS used_by FROM invitations i JOIN users u ON u.id=i.created_by
    LEFT JOIN users used ON used.id=i.used_by ORDER BY i.id DESC`).all();
}

export function listUsers(db) {
  return db.prepare('SELECT id,username,role,active,created_at,created_by FROM users ORDER BY id').all()
    .map((u) => ({ ...u, active: Boolean(u.active) }));
}

export function updateUser(db, id, actorId, changes) {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  if (!user) return false;
  if (changes.role !== undefined && typeof changes.role !== 'string') throw new Error('Role must be a string.');
  if (changes.active !== undefined && typeof changes.active !== 'boolean') throw new Error('Active status must be true or false.');
  const role = changes.role === undefined ? user.role : changes.role;
  const active = changes.active === undefined ? user.active : (changes.active ? 1 : 0);
  if (!['admin', 'member'].includes(role)) throw new Error('Invalid role.');
  if (user.role === 'admin' && (role !== 'admin' || !active) && db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='admin' AND active=1").get().n <= 1) throw new Error('Cannot disable or demote the last active admin.');
  db.prepare('UPDATE users SET role=?,active=? WHERE id=?').run(role, active, id);
  if (!active) db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
  audit(db, actorId, 'update_user', JSON.stringify({ id, role, active: Boolean(active) }));
  return true;
}

export function auditAuth(db, userId, action, detail = null) { audit(db, userId, action, detail); }
