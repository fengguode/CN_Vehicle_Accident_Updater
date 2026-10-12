import crypto from 'node:crypto';

export const FEEDBACK_STATUSES = Object.freeze([
  'Submitted', 'Under review', 'Added to backlog',
  'In progress', 'Complete', 'Blocked', 'Not planned', 'Duplicate'
]);
const TYPES = new Set(['Issue', 'Feature']);
const PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);
const BACKLOG_ID = /^[A-Z][A-Z0-9]*-[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function field(value, name, { min = 0, max, required = false } = {}) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw new Error(`${name} must be text.`);
  const text = value.trim();
  if (required && text.length < min) throw new Error(`${name} must be at least ${min} characters.`);
  if (text.length > max) throw new Error(`${name} must be at most ${max} characters.`);
  return text;
}

function requestRow(row) {
  if (!row) return null;
  const { backlog_ids, internal_notes: _privateNotes, ...rest } = row;
  return { ...rest, backlog_ids: JSON.parse(backlog_ids) };
}

function eventsFor(db, id, includeActor = false) {
  const rows = includeActor
    ? db.prepare(`SELECT e.id,e.action,e.status,e.public_update,e.created_at,e.actor_id,u.username AS actor
        FROM feedback_events e JOIN users u ON u.id=e.actor_id WHERE e.request_id=? ORDER BY e.id`).all(id)
    : db.prepare('SELECT id,action,status,public_update,created_at FROM feedback_events WHERE request_id=? ORDER BY id').all(id);
  return rows;
}

export function createFeedback(db, submitterId, input, requestedIdempotencyKey = crypto.randomUUID()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Request body must be an object.');
  if (!TYPES.has(input.type)) throw new Error('Type must be Issue or Feature.');
  if (typeof requestedIdempotencyKey !== 'string' || !ID.test(requestedIdempotencyKey)) {
    const error = new Error('A valid idempotency key is required.');
    error.status = 400;
    error.code = 'invalid_idempotency_key';
    throw error;
  }
  const type = input.type;
  const title = field(input.title, 'Title', { min: 5, max: 120, required: true });
  const description = field(input.description, 'Description', { min: 10, max: 4000, required: true });
  const context = field(input.context, 'Context', { max: 2000 });
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.exec('BEGIN IMMEDIATE');
  try {
    const prior = db.prepare(`SELECT f.* FROM feedback_submission_keys k
      JOIN feedback_requests f ON f.id=k.request_id
      WHERE k.submitter_id=? AND k.idempotency_key=?`).get(submitterId, requestedIdempotencyKey);
    if (prior) {
      if (prior.type !== type || prior.title !== title || prior.description !== description || prior.context !== context) {
        const error = new Error('This idempotency key was already used for a different request.');
        error.status = 409;
        error.code = 'idempotency_key_conflict';
        throw error;
      }
      db.exec('COMMIT');
      return { data: requestRow(prior), replayed: true };
    }
    const windowStart = new Date(Date.now() - 60 * 60_000).toISOString();
    const recent = db.prepare('SELECT COUNT(*) AS total FROM feedback_requests WHERE submitter_id=? AND created_at>=?').get(submitterId, windowStart).total;
    if (recent >= 10) throw new Error('Submission limit reached. Try again later.');
    db.prepare(`INSERT INTO feedback_requests(id,submitter_id,type,title,description,context,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?)`).run(id, submitterId, type, title, description, context, now, now);
    db.prepare(`INSERT INTO feedback_events(request_id,actor_id,action,status,public_update,created_at)
      VALUES(?,?,'submitted','Submitted','',?)`).run(id, submitterId, now);
    db.prepare(`INSERT INTO feedback_submission_keys(submitter_id,idempotency_key,request_id,created_at)
      VALUES(?,?,?,?)`).run(submitterId, requestedIdempotencyKey, id, now);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  return { data: requestRow(db.prepare('SELECT * FROM feedback_requests WHERE id=?').get(id)), replayed: false };
}

export function listMyFeedback(db, submitterId) {
  return db.prepare('SELECT * FROM feedback_requests WHERE submitter_id=? ORDER BY updated_at DESC,id').all(submitterId)
    .map((row) => ({ ...requestRow(row), history: eventsFor(db, row.id) }));
}

export function listAdminFeedback(db, filters = {}) {
  const { status, type } = filters;
  const limit = filters.limit === undefined ? 100 : Number(filters.limit);
  const offset = filters.offset === undefined ? 0 : Number(filters.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Limit must be an integer from 1 to 100.');
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000) throw new Error('Offset must be a nonnegative integer no greater than 1000000.');
  if (status && !FEEDBACK_STATUSES.includes(status)) throw new Error('Invalid status filter.');
  if (type && !TYPES.has(type)) throw new Error('Invalid type filter.');
  const clauses = [];
  const values = [];
  if (status) { clauses.push('f.status=?'); values.push(status); }
  if (type) { clauses.push('f.type=?'); values.push(type); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return db.prepare(`SELECT f.*,u.username AS submitter FROM feedback_requests f
    JOIN users u ON u.id=f.submitter_id ${where} ORDER BY f.updated_at DESC,f.id LIMIT ? OFFSET ?`).all(...values, limit, offset)
    .map((row) => ({ ...requestRow(row), internal_notes: row.internal_notes, history: eventsFor(db, row.id, true) }));
}

export function triageFeedback(db, id, actorId, input, canonicalBacklogIds) {
  if (!ID.test(id)) throw new Error('Invalid request ID.');
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Request body must be an object.');
  const allowed = new Set(['status', 'priority', 'public_update', 'backlog_ids', 'duplicate_of', 'internal_notes']);
  if (Object.keys(input).some((key) => !allowed.has(key) && key !== 'expected_version')) throw new Error('Unknown triage field.');
  if (!Number.isSafeInteger(input.expected_version) || input.expected_version < 1) {
    const error = new Error('A valid expected version is required.');
    error.code = 'expected_version_required';
    throw error;
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    const current = db.prepare('SELECT * FROM feedback_requests WHERE id=?').get(id);
    if (!current) { db.exec('COMMIT'); return null; }
    if (current.triage_version !== input.expected_version) {
      const error = new Error('This feedback request changed in another session.');
      error.status = 409;
      error.code = 'feedback_conflict';
      const latest = db.prepare(`SELECT f.*,u.username AS submitter FROM feedback_requests f
        JOIN users u ON u.id=f.submitter_id WHERE f.id=?`).get(id);
      error.data = { ...requestRow(latest), internal_notes: latest.internal_notes, history: eventsFor(db, id, true) };
      throw error;
    }
    if (!Object.keys(input).some((key) => allowed.has(key))) throw new Error('No feedback changes were supplied.');
    const status = input.status ?? (current.status === 'Needs information' ? 'Under review' : current.status);
    if (!FEEDBACK_STATUSES.includes(status)) throw new Error('Invalid status.');
    const priority = input.priority === undefined ? current.priority : input.priority;
    if (priority !== null && !PRIORITIES.has(priority)) throw new Error('Priority must be low, normal, high, or urgent.');
    const suppliedPublicUpdate = input.public_update === undefined ? '' : field(input.public_update, 'Public update', { max: 2000 });
    const publicUpdate = suppliedPublicUpdate || current.public_update;
    const internalNotes = input.internal_notes === undefined ? current.internal_notes : field(input.internal_notes, 'Internal notes', { max: 4000 });
    let backlogIds = current.backlog_ids ? JSON.parse(current.backlog_ids) : [];
    if (input.backlog_ids !== undefined) {
      if (!Array.isArray(input.backlog_ids) || input.backlog_ids.length > 10) throw new Error('Backlog IDs must be an array of at most 10 IDs.');
    if (input.backlog_ids.some((value) => typeof value !== 'string')) throw new Error('Invalid canonical backlog ID.');
    backlogIds = [...new Set(input.backlog_ids.map((value) => value.trim()))];
    if (backlogIds.some((value) => !BACKLOG_ID.test(value))) throw new Error('Invalid canonical backlog ID.');
      if (canonicalBacklogIds && backlogIds.some((value) => !canonicalBacklogIds.has(value))) throw new Error('Backlog ID does not exist in the canonical project backlog.');
    }
    let duplicateOf = input.duplicate_of === undefined ? current.duplicate_of : input.duplicate_of;
    if (duplicateOf !== null) {
      if (typeof duplicateOf !== 'string' || !ID.test(duplicateOf) || duplicateOf === id) throw new Error('Invalid duplicate request ID.');
      if (!db.prepare('SELECT 1 FROM feedback_requests WHERE id=?').get(duplicateOf)) throw new Error('Duplicate target not found.');
      const seen = new Set([id]);
      let cursor = duplicateOf;
      while (cursor) {
        if (seen.has(cursor)) throw new Error('Duplicate links cannot form a cycle.');
        seen.add(cursor);
        cursor = db.prepare('SELECT duplicate_of FROM feedback_requests WHERE id=?').get(cursor)?.duplicate_of || null;
      }
    }
    if (status === 'Added to backlog' && backlogIds.length === 0) throw new Error('Add at least one backlog ID before accepting this request.');
    if (current.status === 'Needs information' && !publicUpdate) throw new Error('Add a public update before moving this legacy request to Under review.');
    if (['Not planned', 'Duplicate'].includes(status) && !publicUpdate) throw new Error('Add a public update explaining this disposition.');
    if (status === 'Duplicate' && !duplicateOf) throw new Error('Link a primary request before marking this request as a duplicate.');
    const announcementAdded = Boolean(suppliedPublicUpdate);
    const unchanged = status === current.status
      && priority === current.priority
      && publicUpdate === current.public_update
      && internalNotes === current.internal_notes
      && JSON.stringify(backlogIds) === current.backlog_ids
      && duplicateOf === current.duplicate_of;
    if (unchanged && !announcementAdded) throw new Error('No effective feedback changes were supplied.');
    const now = new Date().toISOString();
    db.prepare(`UPDATE feedback_requests SET status=?,priority=?,public_update=?,internal_notes=?,backlog_ids=?,duplicate_of=?,updated_at=?,triage_version=triage_version+1 WHERE id=? AND triage_version=?`)
      .run(status, priority, publicUpdate, internalNotes, JSON.stringify(backlogIds), duplicateOf, now, id, input.expected_version);
    db.prepare(`INSERT INTO feedback_events(request_id,actor_id,action,status,public_update,created_at)
      VALUES(?,?,'triage',?,?,?)`).run(id, actorId, status, suppliedPublicUpdate, now);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  const row = db.prepare('SELECT f.*,u.username AS submitter FROM feedback_requests f JOIN users u ON u.id=f.submitter_id WHERE f.id=?').get(id);
  return { ...requestRow(row), internal_notes: row.internal_notes, history: eventsFor(db, id, true) };
}
