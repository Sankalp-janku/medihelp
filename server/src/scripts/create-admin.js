import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/index.js';

const [email, password] = process.argv.slice(2);
if (!email || !password) throw new Error('Usage: npm run create-admin -- <email> <password>');
await mongoose.connect(env.mongoUri);
await User.create({ name: 'Admin', email, phone: `+0${Date.now()}`.slice(0, 13), role: 'admin', status: 'active', passwordHash: await bcrypt.hash(password, 12) });
console.log('Admin created');
await mongoose.disconnect();
