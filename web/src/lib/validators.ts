import { z } from "zod";

// ---- Flat ----
export const createFlatSchema = z.object({
  flatNumber: z.string().min(1, "Flat number is required"),
  building: z.string().optional(),
  floor: z.coerce.number().int().optional(),
});

export const updateFlatSchema = createFlatSchema.partial();

// ---- Resident ----
export const createResidentSchema = z.object({
  flatId: z.string().uuid("Invalid flat ID"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  email: z.email("Invalid email").optional().or(z.literal("")),
  isPrimary: z.boolean().default(false),
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["resident", "secretary"]).default("resident"),
});

export const updateResidentSchema = createResidentSchema.partial();

// ---- Guard ----
export const createGuardSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().optional(),
  username: z.string().min(3, "Username required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  assignedGateId: z.string().uuid().optional(),
});

// ---- Vehicle ----
export const createVehicleSchema = z.object({
  residentId: z.string().uuid("Invalid resident ID"),
  vehicleNumber: z.string().min(4, "Vehicle number required").transform((v) => v.toUpperCase()),
  vehicleType: z.enum(["car", "bike", "scooter", "other"]).optional(),
  make: z.string().optional(),
});

// ---- Staff ----
export const createStaffSchema = z.object({
  registeredById: z.string().uuid("Invalid resident ID"),
  name: z.string().min(2, "Name required"),
  phone: z.string().optional(),
  role: z.string().min(1, "Role required"), // e.g. "maid", "driver"
  clearanceLevel: z.enum(["flat", "building", "society"]).optional(),
  allowedTimeWindow: z
    .object({ start: z.string(), end: z.string() })
    .optional(),
});

// ---- Visit ----
export const createVisitSchema = z.object({
  gateId: z.string().uuid(),
  guardId: z.string().uuid(),
  flatId: z.string().uuid(),
  purpose: z.string().min(1, "Purpose required"),
  visitType: z.string().default("visitor"), // visitor | delivery | contractor
  // Visitor info
  visitorName: z.string().min(2),
  visitorPhone: z.string().optional(),
  visitorIdType: z.string().optional(),
  visitorIdNumber: z.string().optional(),
  // Optional photo path (set after live photo capture)
  photoUrl: z.string().optional(),
  vehicleNumber: z.string().optional(),
});

// ---- Entry ----
export const createEntrySchema = z.object({
  gateId: z.string().uuid(),
  guardId: z.string().uuid(),
  personType: z.enum(["resident", "visitor", "staff", "vehicle", "unknown"]),
  personId: z.string().default("unknown"),
  visitId: z.string().uuid().optional(),
  method: z.string().default("manual"), // face | manual | plate
  confidence: z.number().min(0).max(1).optional(),
  photoUrl: z.string().optional(),
  vehicleNumber: z.string().optional(),
});
