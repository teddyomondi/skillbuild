import { handleApi } from '../../server/apiHandler.js';

export default async function handler(req, res) {
  return handleApi(req, res, '/api/tutor');
}
