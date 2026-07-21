import sequelize from '../config/database.js';
import { seedDatabase } from './seedData.js';

const runSeeds = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');
    
    await seedDatabase();
    
    console.log('✅ All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeeds();