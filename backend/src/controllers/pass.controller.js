import {
  createPassPdf,
  issuePass,
  listMyPasses,
  listPasses,
  revokePass as revokePassService
} from '../services/pass.service.js';

export async function createPass(req, res) {
  const result = await issuePass(req.body || {}, req.user._id);
  res.status(201).json({ message: 'Pass issued', ...result });
}

export async function getPasses(req, res) {
  res.json(await listPasses(req.query));
}

export async function getMyPasses(req, res) {
  res.json(await listMyPasses(req.user._id));
}

export async function revokePass(req, res) {
  const pass = await revokePassService(req.params.id);
  res.json({ message: 'Pass revoked', pass });
}

export async function downloadPassPdf(req, res) {
  const pdf = await createPassPdf(req.params.code, req.user);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.code}.pdf"`);
  res.send(pdf);
}
