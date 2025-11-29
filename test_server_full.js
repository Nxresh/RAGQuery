import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, SchemaType } from '@google/genai';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import mammoth from 'mammoth';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

console.log('All imports successful');
