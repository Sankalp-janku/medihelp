export const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const pageParams = (query, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

export const asString = (value) => (typeof value === 'string' ? value : '');
export const looksLikeObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
