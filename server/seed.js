
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
    console.log('MongoDB connected successfully for seeding.');

    // Upsert settings
    for (const setting of defaultSettings) {
      await Setting.findOneAndUpdate(
        { key: setting.key },
        { $set: { value: setting.value } },
        { upsert: true, new: true, runValidators: true }
      );
      console.log(`Setting ${setting.key} ensured.`);
    }

    // Upsert admin user
    const adminData = {
      username: 'admin',
      password: 'admin123',
      role: 'Admin',
    };
    const existingAdmin = await User.findOne({ username: adminData.username });
    if (!existingAdmin) {
        await User.create(adminData);
        console.log('Admin user created.');
    } else {
        console.log('Admin user already exists.');
    }


    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding the database:', error);
    process.exit(1); // Exit with error code to prevent server start
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed after seeding.');
  }
};

seedDatabase();
