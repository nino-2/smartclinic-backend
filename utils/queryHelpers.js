// utils/queryHelpers.js
const buildPaginationQuery = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};
module.exports = { buildPaginationQuery };
