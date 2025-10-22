require('dotenv').config();
const mongoose = require('mongoose');
const Setting = require('./models/Setting');
const User = require('./models/User');

// Default settings required for the application to run correctly
const defaultSettings = [
  { key: 'WEEKDAY_OPENING_HOUR', value: '09:00' },
  { key: 'WEEKDAY_CLOSING_HOUR', value: '23:00' },
  { key: 'WEEKEND_OPENING_HOUR', value: '09:00' },
  { key: 'WEEKEND_CLOSING_HOUR', value: '23:00' },
  { key: 'TIMEZONE', value: 'America/Argentina/Buenos_Aires' },
  { key: 'SLOT_DURATION', value: '60' }, // Essential key for booking logic
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connected successfully.');

    // Upsert default settings to prevent duplicate key errors
    console.log('Upserting default settings...');
    for (const setting of defaultSettings) {
      await Setting.findOneAndUpdate(
        { key: setting.key },
        { $set: { value: setting.value } },
        { upsert: true, new: true, runValidators: true }
      );
      console.log(`Setting ensured: ${setting.key}`);
    }
    console.log('Default settings upserted.');

    // Ensure admin user exists without causing errors
    console.log('Checking for admin user...');
    const adminData = {
      username: 'admin',
      password: 'admin123',
      role: 'Admin',
    };

    const existingAdmin = await User.findOne({ username: adminData.username });
    if (!existingAdmin) {
        // Using .create() here is safe because we've confirmed the user doesn't exist.
        // This ensures the pre-save hook for password hashing is triggered.
        await User.create(adminData);
        console.log('Admin user created.');
    } else {
        console.log('Admin user already exists. No action needed.');
    }

    console.log('Database seeding completed successfully.');

  } catch (error) {
    console.error('An error occurred during database seeding:', error);
    process.exit(1); // Exit with a failure code
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seedDatabase();
