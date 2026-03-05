const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Person = require('../models/Person');

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const persons = await Person.find({ name: /Vijay/i }).sort({ popularity: -1 }).limit(30);
    console.log(`Found ${persons.length} persons matching "Vijay"`);

    persons.forEach(p => {
        console.log(`- ${p.name} (TMDB: ${p.tmdb_id}, Popularity: ${p.popularity})`);
    });

    const exactVijay = await Person.findOne({ name: 'Vijay' });
    console.log('\nExact match for "Vijay":', exactVijay ? `${exactVijay.name} (${exactVijay.tmdb_id})` : 'Not found');

    const caseInsensitiveExact = await Person.findOne({ name: { $regex: '^vijay$', $options: 'i' } });
    console.log('Case-insensitive exact match:', caseInsensitiveExact ? `${caseInsensitiveExact.name} (${caseInsensitiveExact.tmdb_id})` : 'Not found');

    await mongoose.connection.close();
}

debug();
