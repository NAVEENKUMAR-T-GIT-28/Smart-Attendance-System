require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Department = require('./models/Department');

const seedDepartment = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        const hashedPassword = await bcrypt.hash('hodcce123', 10);

        const dept = await Department.create({
            _id: new mongoose.Types.ObjectId('69ac5f81676e70ffcc6fff6e'),
            name: 'Computer And Communication Engineering',
            code: 'CCE',
            hodName: 'Dr. Pachchiyammal@ Priya',
            email: 'hod.cce@sairamtap.edu.in',
            password: hashedPassword
        });

        console.log('Department created successfully:');
        console.log(`  Name: ${dept.name}`);
        console.log(`  Code: ${dept.code}`);
        console.log(`  HOD: ${dept.hodName}`);
        console.log(`  Email: ${dept.email}`);
        console.log(`  ID: ${dept._id}`);

        await mongoose.disconnect();
        console.log('Done!');
    } catch (error) {
        if (error.code === 11000) {
            console.log('Department already exists in DB. Skipping.');
        } else {
            console.error('Error:', error.message);
        }
        await mongoose.disconnect();
    }
};

seedDepartment();
