
require('dotenv').config();
const mongoose = require('mongoose');
const Setting = require('./models/Setting');
const User = require('./models/User');

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
      await Setting.updateOne({ key: setting.key }, { $set: { value: setting.value } }, { upsert: true });
      console.log(`Setting ${setting.key} ensured.`);
    }

    const adminData = {
      username: 'admin',
      password: 'admin123',
      role: 'Admin',
    };

    await User.findOneAndUpdate(
      { username: adminData.username },
      { $setOnInsert: adminData },
      { upsert: true, new: true, runValidators: true }
    );
    console.log('Admin user ensured.');

    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding the database:', error);
    process.exit(1); // Exit with error code
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();
