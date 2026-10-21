import crypto from 'node:crypto';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import Pass from '../models/Pass.js';
import Visitor from '../models/Visitor.js';
import AppError from '../utils/AppError.js';
import { sendEmail, sendSms } from '../utils/notify.js';
import { getLimit } from '../utils/query.js';

function createPassCode() {
  return `VP-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

export async function issuePass(input = {}, issuedBy) {
  if (typeof input.visitorId !== 'string' || !input.visitorId.trim()) {
    throw new AppError('Visitor is required');
  }
  const visitor = await Visitor.findById(input.visitorId);
  if (!visitor) throw new AppError('Visitor account not found', 404);
  if (!visitor.phone || !visitor.purpose || !visitor.host) {
    throw new AppError('Add the visitor phone, purpose, and host before issuing a pass', 400);
  }

  const validUntil = input.validUntil ? new Date(input.validUntil) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (!Number.isFinite(validUntil.getTime()) || validUntil <= new Date()) {
    throw new AppError('Pass expiry must be a future date and time');
  }
  const pass = await Pass.create({
    visitor: visitor._id,
    code: createPassCode(),
    validUntil,
    issuedBy
  });
  const qrDataUrl = await QRCode.toDataURL(pass.code);
  await sendEmail(
    visitor.email,
    'Your visitor pass is ready',
    `Pass code: ${pass.code}. Show the QR code or pass code at reception.`
  );
  await sendSms(visitor.phone, `Your visitor pass is ready. Pass code: ${pass.code}. Show it at reception.`);
  return { pass, visitor, qrDataUrl, pdfUrl: `/api/passes/${pass.code}/pdf` };
}

export async function listPasses(query = {}) {
  const filter = {};
  if (typeof query.status === 'string' && ['active', 'checked-in', 'checked-out', 'revoked'].includes(query.status)) {
    filter.status = query.status;
  }
  return {
    passes: await Pass.find(filter)
      .populate('visitor')
      .sort({ createdAt: -1 })
      .limit(getLimit(query.limit))
  };
}

export async function listMyPasses(visitorId) {
  const visitorProfiles = await Visitor.find({ account: visitorId }).select('_id');
  const passes = await Pass.find({ visitor: { $in: visitorProfiles.map(visitor => visitor._id) } })
    .sort({ createdAt: -1 })
    .limit(100);
  return {
    passes: await Promise.all(passes.map(async pass => ({
      ...pass.toObject(),
      qrDataUrl: await QRCode.toDataURL(pass.code)
    })))
  };
}

export async function revokePass(id) {
  const pass = await Pass.findOneAndUpdate(
    { _id: id, status: { $in: ['active', 'checked-out'] } },
    { status: 'revoked' },
    { new: true, runValidators: true }
  );
  if (!pass) {
    const existing = await Pass.findById(id);
    if (!existing) throw new AppError('Pass not found', 404);
    throw new AppError('A checked-in or revoked pass cannot be revoked', 409);
  }
  return pass;
}

export async function createPassPdf(code, user) {
  const pass = await Pass.findOne({ code: code.toUpperCase() }).populate('visitor');
  if (!pass) throw new AppError('Pass not found', 404);
  if (user.role === 'visitor' && !pass.visitor.account?.equals(user._id)) {
    throw new AppError('Pass not found', 404);
  }

  const qrCode = await QRCode.toBuffer(pass.code);
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'A6', margin: 24 });
    const chunks = [];
    document.on('data', chunk => chunks.push(chunk));
    document.on('error', reject);
    document.on('end', () => resolve(Buffer.concat(chunks)));

    document.fontSize(18).text('VISITOR PASS', { align: 'center' });
    document.moveDown().fontSize(12).text(`Name: ${pass.visitor.name}`);
    document.text(`Company: ${pass.visitor.company || '-'}`);
    document.text(`Host: ${pass.visitor.host}`);
    document.text(`Purpose: ${pass.visitor.purpose}`);
    document.text(`Pass code: ${pass.code}`);
    document.text(`Valid until: ${pass.validUntil.toLocaleString()}`);
    document.moveDown();
    document.image(qrCode, { fit: [120, 120], align: 'center' });
    document.end();
  });
}
