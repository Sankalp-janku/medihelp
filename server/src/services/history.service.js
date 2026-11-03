import { ActivityLog } from '../models/index.js';
import { sha256 } from '../utils/crypto.js';

/** Appends a hash-chained entry to a patient's permanent history. */
export async function recordActivity({ patientId, actor, action, entity = {} }) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const last = await ActivityLog.findOne({ patientId }).sort({ seq: -1 }).lean();
    const seq = (last?.seq || 0) + 1, prevHash = last?.hash || 'GENESIS', occurredAt = new Date();
    const hash = sha256(prevHash + JSON.stringify([String(patientId), seq, occurredAt.toISOString(), String(actor.id), action, String(entity.id || ''), entity.title || '']));
    try {
      return await ActivityLog.create({ patientId, seq, occurredAt, actorId: actor.id, actorRole: actor.role, actorName: actor.name,
        action, entityType: entity.type, entityId: entity.id, entityTitle: entity.title, prevHash, hash });
    } catch (err) { if (err.code !== 11000 || attempt === 2) throw err; }
  }
}

export const listActivity = async (patientId, { before, limit = 20 }) => {
  const query = { patientId, ...(before ? { seq: { $lt: Number(before) } } : {}) };
  const items = await ActivityLog.find(query).sort({ seq: -1 }).limit(limit + 1).select('-prevHash -hash').lean();
  const hasMore = items.length > limit;
  return { items: items.slice(0, limit), nextCursor: hasMore ? items[limit - 1].seq : null };
};
