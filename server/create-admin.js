import bcrypt from "bcryptjs";
import sequelize from "./src/config/db.js";
import User from "./src/models/User.js";

async function createAdmin() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Connected to database");

    // Admin user details
    const adminData = {
      name: "System Administrator",
      email: "julietmukamani19@gmail.com",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
      county: "Nairobi",
      isEmailVerified: true,
      isRepVerified: true,
      verificationStatus: "not_required"
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: adminData.email } });
    
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists with email:", adminData.email);
      
      // Update existing user to admin
      await existingAdmin.update({ 
        role: "admin",
        isRepVerified: true,
        verificationStatus: "not_required"
      });
      console.log("✅ Updated existing user to admin role");
    } else {
      // Create new admin user
      const adminUser = await User.create(adminData);
      console.log("✅ Admin user created successfully!");
    }

    console.log("\n🔑 Admin Login Credentials:");
    console.log("Email: julietmukamani19@gmail.com");
    console.log("Password: admin123");
    console.log("\n📍 Access admin dashboard at: http://localhost:5173/dashboard/admin-dashboard");
    
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createAdmin(); 