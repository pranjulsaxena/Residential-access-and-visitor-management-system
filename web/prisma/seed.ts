import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.impersonationCheck.deleteMany();
  await prisma.idDocument.deleteMany();
  await prisma.plateScan.deleteMany();
  await prisma.entryLog.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.guestPass.deleteMany();
  await prisma.faceProfile.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.staffFlatAssignment.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.guard.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.gate.deleteMany();
  await prisma.flat.deleteMany();

  // Create Gates
  const mainGate = await prisma.gate.create({
    data: { name: "Main Gate", location: "Front Entrance" },
  });
  const backGate = await prisma.gate.create({
    data: { name: "Back Gate", location: "Rear Entrance" },
  });
  console.log("✅ Gates created");

  // Create Flats
  const flats = await Promise.all(
    ["A-101", "A-102", "A-103", "A-201", "A-202", "B-101", "B-102", "B-201"].map(
      (num) =>
        prisma.flat.create({
          data: {
            flatNumber: num,
            building: num.startsWith("A") ? "Tower A" : "Tower B",
            floor: parseInt(num.split("-")[1][0]),
          },
        })
    )
  );
  console.log("✅ 8 Flats created");

  // Create Guard
  const guardPassword = await bcrypt.hash("guard123", 10);
  const guard1 = await prisma.guard.create({
    data: {
      name: "Ram Singh",
      phone: "9876543210",
      username: "guard1",
      passwordHash: guardPassword,
      assignedGateId: mainGate.id,
    },
  });
  const guard2 = await prisma.guard.create({
    data: {
      name: "Shyam Kumar",
      phone: "9876543211",
      username: "guard2",
      passwordHash: guardPassword,
      assignedGateId: backGate.id,
    },
  });
  console.log("✅ 2 Guards created (username: guard1/guard2, password: guard123)");

  // Create Residents
  const residentPassword = await bcrypt.hash("resident123", 10);
  const secretaryPassword = await bcrypt.hash("admin123", 10);

  const residents = [
    { name: "Rajesh Kumar", phone: "9111111111", flatIndex: 0, isPrimary: true, username: "rajesh", role: "resident" },
    { name: "Priya Kumar", phone: "9111111112", flatIndex: 0, isPrimary: false, username: null, role: "resident" },
    { name: "Amit Sharma", phone: "9222222222", flatIndex: 1, isPrimary: true, username: "amit", role: "resident" },
    { name: "Neha Gupta", phone: "9333333333", flatIndex: 2, isPrimary: true, username: "neha", role: "resident" },
    { name: "Vikram Singh", phone: "9444444444", flatIndex: 3, isPrimary: true, username: "vikram", role: "resident" },
    { name: "Suresh Patel", phone: "9555555555", flatIndex: 5, isPrimary: true, username: "secretary1", role: "secretary" },
  ];

  for (const r of residents) {
    const pwd = r.role === "secretary" ? secretaryPassword : residentPassword;
    await prisma.resident.create({
      data: {
        name: r.name,
        phone: r.phone,
        flatId: flats[r.flatIndex].id,
        isPrimary: r.isPrimary,
        username: r.username,
        passwordHash: r.username ? pwd : null,
        role: r.role,
      },
    });
  }
  console.log("✅ 6 Residents created (password: resident123, secretary: admin123)");

  // Create Vehicles
  await prisma.vehicle.create({
    data: {
      residentId: (await prisma.resident.findFirst({ where: { username: "rajesh" } }))!.id,
      vehicleNumber: "DL 8C AQ 1234",
      vehicleType: "car",
      make: "Maruti Swift",
    },
  });
  await prisma.vehicle.create({
    data: {
      residentId: (await prisma.resident.findFirst({ where: { username: "amit" } }))!.id,
      vehicleNumber: "MH 12 AB 5678",
      vehicleType: "bike",
      make: "Honda Activa",
    },
  });
  console.log("✅ 2 Vehicles created");

  console.log("\n🎉 Seed complete!");
  console.log("\nLogin credentials:");
  console.log("  Guard:     guard1 / guard123");
  console.log("  Guard:     guard2 / guard123");
  console.log("  Resident:  rajesh / resident123");
  console.log("  Resident:  amit / resident123");
  console.log("  Resident:  neha / resident123");
  console.log("  Secretary: secretary1 / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
