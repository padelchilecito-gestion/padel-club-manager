
require('dotenv').config();
const mongoose = require('mongoose');
const Setting = require('./models/Setting');

const defaultSettings = [
  { key: 'WEEKDAY_OPENING_HOUR', value: '09:00' },
  { key: 'WEEKDAY_CLOSING_HOUR', value: '23:00' },
  { key: 'WEEKEND_OPENING_HOUR', value: '09:00' },
  { key: 'WEEKEND_CLOSING_HOUR', value: '23:00' },
  { key: 'TIMEZONE', value: 'America/Argentina/Buenos_Aires' },
  { key: 'SLOT_DURATION', value: '60' },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully.');

    for (const setting of defaultSettings) {
      const existingSetting = await Setting.findOne({ key: setting.key });
      if (!existingSetting) {
        await Setting.create(setting);
        console.log(`Setting ${setting.key} created.`);
      }
    }

    console.log('Database seeding completed.');
  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();
