import mongoose from 'mongoose';
import Tournament

// MongoDB connection URI
const mongoUri = 'mongodb://localhost:27017/your_database_name';

// Function to update existing documents
const updateBattles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Update the documents
    const result = await Tournament.updateMany(

      { battle_1: { $exists: false } }, // Only update documents that don't have the new fields
      {
        $set: {
          battle_1: '',
          battle_2: '',
          battle_3: '',
          battle_4: '',
          battle_5: ''
        }
      }
    );

    console.log(`Updated ${result.nModified} documents`);
  } catch (error) {
    console.error('Error updating documents:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};
updateBattles();
