import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Visitor from './src/models/Visitor.js';
import Appointment from './src/models/Appointment.js';
import Pass from './src/models/Pass.js';
import CheckLog from './src/models/CheckLog.js';
dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visitor_pass_management');
  const password = await bcrypt.hash('Pass1234!', 12);
  const users = [
    { name: 'System Admin', email: 'admin@example.com', role: 'admin' },
    { name: 'Frontdesk Security', email: 'security@example.com', role: 'security' },
    { name: 'Office Employee', email: 'employee@example.com', role: 'employee' },
    {
      name: 'Demo Visitor',
      email: 'visitor@example.com',
      role: 'visitor',
      phone: '9876500000',
      company: 'Northstar',
      purpose: 'Project discussion',
      host: 'Office Employee'
    }
  ];

  for (const user of users) {
    await User.findOneAndUpdate(
      { email: user.email },
      { $set: { ...user, password, loginEnabled: true } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  const staff = await User.findOne({ email: 'security@example.com' });
  const visitorUsers = [
    await User.findOne({ email: 'visitor@example.com' }),
    await User.findOneAndUpdate(
      { email: 'aarav@example.com' },
      {
        $set: {
          name: 'Aarav Sharma',
          email: 'aarav@example.com',
          role: 'visitor',
          phone: '9876543210',
          company: 'Acme Pvt Ltd',
          purpose: 'Project discussion',
          host: 'Office Employee',
          loginEnabled: false,
          createdBy: staff._id
        }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ),
    await User.findOneAndUpdate(
      { email: 'priya@example.com' },
      {
        $set: {
          name: 'Priya Singh',
          email: 'priya@example.com',
          role: 'visitor',
          phone: '9876501234',
          company: 'Bright Solutions',
          purpose: 'Interview',
          host: 'HR Team',
          loginEnabled: false,
          createdBy: staff._id
        }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    )
  ];

  const visitorAccounts = await User.find({
    role: 'visitor',
    phone: { $nin: ['', null] },
    purpose: { $nin: ['', null] },
    host: { $nin: ['', null] }
  });
  for (const account of visitorAccounts) {
    const visitor = await Visitor.findOneAndUpdate(
      { email: account.email },
      {
        $set: {
          name: account.name,
          email: account.email,
          phone: account.phone,
          company: account.company,
          purpose: account.purpose,
          host: account.host,
          photoUrl: account.photoUrl,
          account: account._id,
          createdBy: account.createdBy || staff._id
        }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    await Promise.all([
      Pass.updateMany({ visitor: account._id }, { $set: { visitor: visitor._id } }),
      CheckLog.updateMany({ visitor: account._id }, { $set: { visitor: visitor._id } }),
      Appointment.updateMany(
        { visitorAccount: account._id },
        { $set: { visitor: visitor._id } }
      )
    ]);
  }
  const demoVisitorAccount = visitorUsers[0];
  const demoVisitor = await Visitor.findOne({ account: demoVisitorAccount._id });

  await Pass.findOneAndUpdate(
    { code: 'VP-DEMO12345' },
    {
      $set: {
        visitor: demoVisitor._id,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        issuedBy: staff._id,
        status: 'active'
      },
      $setOnInsert: { code: 'VP-DEMO12345' }
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await Appointment.findOneAndUpdate(
    { visitorEmail: 'rohan@example.com', purpose: 'Vendor meeting' },
    {
      $set: {
        visitorName: 'Rohan Verma',
        visitorPhone: '9999911111',
        visitorEmail: 'rohan@example.com',
        company: 'Northstar',
        purpose: 'Vendor meeting',
        host: 'Office Employee',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        requestedBy: staff._id,
        visitor: null,
        visitorAccount: null,
        approvedBy: null,
        status: 'pending'
      }
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await Appointment.findOneAndUpdate(
    { visitorEmail: demoVisitor.email, purpose: 'Project discussion' },
    {
      $set: {
        visitorName: demoVisitor.name,
        visitorPhone: demoVisitor.phone,
        visitorEmail: demoVisitor.email,
        company: demoVisitor.company,
        purpose: demoVisitor.purpose,
        host: demoVisitor.host,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        requestedBy: demoVisitorAccount._id,
        visitor: demoVisitor._id,
        visitorAccount: demoVisitorAccount._id,
        approvedBy: staff._id,
        status: 'approved'
      }
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  console.log('Seed complete. Demo password for all demo login accounts: Pass1234!');
} finally {
  await mongoose.disconnect();
}
