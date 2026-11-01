// Populates Subject/Chapter collections with the curriculum defined in
// the product spec. Run manually with: node scripts/seedCurriculum.js
//
// Idempotent: uses upsert on (grade, slug) / (subject, slug), so running
// it again after adding new subjects/chapters to CURRICULUM below just
// adds the new ones without duplicating existing rows.

require('dotenv').config();
const mongoose = require('mongoose');
const { env } = require('../config/env');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const CURRICULUM = {
  '10th CBSE': {
    Science: [
      'Chemical Reactions',
      'Acids, Bases and Salts',
      'Life Processes',
      'Light - Reflection',
    ],
    Maths: ['Real Numbers', 'Polynomials', 'Quadratic Equations', 'Triangles'],
  },
  '12th CBSE': {
    Physics: ['Electrostatics', 'Current Electricity', 'Optics', 'Thermodynamics'],
    'Computer Science': ['Data Structures', 'SQL', 'Boolean Algebra', 'Networking'],
  },
};

async function seed() {
  await mongoose.connect(env.mongoUri);
  // eslint-disable-next-line no-console
  console.log('Connected to MongoDB. Seeding curriculum...');

  let subjectsCreated = 0;
  let chaptersCreated = 0;

  for (const [grade, subjects] of Object.entries(CURRICULUM)) {
    let subjectOrder = 0;
    for (const [subjectName, chapters] of Object.entries(subjects)) {
      subjectOrder += 1;
      const subjectSlug = slugify(subjectName);

      const subjectDoc = await Subject.findOneAndUpdate(
        { grade, slug: subjectSlug },
        { grade, slug: subjectSlug, name: subjectName, order: subjectOrder },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (subjectDoc.createdAt.getTime() === subjectDoc.updatedAt.getTime()) {
        subjectsCreated += 1;
      }

      let chapterOrder = 0;
      for (const chapterName of chapters) {
        chapterOrder += 1;
        const chapterSlug = slugify(chapterName);

        const chapterDoc = await Chapter.findOneAndUpdate(
          { subject: subjectDoc._id, slug: chapterSlug },
          { subject: subjectDoc._id, slug: chapterSlug, name: chapterName, order: chapterOrder },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (chapterDoc.createdAt.getTime() === chapterDoc.updatedAt.getTime()) {
          chaptersCreated += 1;
        }
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Done. Subjects created: ${subjectsCreated}. Chapters created: ${chaptersCreated}.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seeding failed:', err);
  process.exit(1);
});
