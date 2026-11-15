-- CreateTable
CREATE TABLE "flats" (
    "id" TEXT NOT NULL,
    "flat_number" TEXT NOT NULL,
    "building" TEXT,
    "floor" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residents" (
    "id" TEXT NOT NULL,
    "flat_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "username" TEXT,
    "password_hash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'resident',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "assigned_gate_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "id_document" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "clearance_level" TEXT NOT NULL DEFAULT 'flat',
    "allowed_time_window" JSONB,
    "registered_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_flat_assignments" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "flat_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_flat_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_profiles" (
    "id" TEXT NOT NULL,
    "person_type" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "photo_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "vehicle_type" TEXT,
    "make" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "visitor_id" TEXT,
    "flat_id" TEXT NOT NULL,
    "gate_id" TEXT NOT NULL,
    "guard_id" TEXT NOT NULL,
    "visit_type" TEXT NOT NULL,
    "purpose" TEXT,
    "vehicle_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entered_at" TIMESTAMP(3),
    "exited_at" TIMESTAMP(3),

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_passes" (
    "id" TEXT NOT NULL,
    "flat_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "guest_name" TEXT NOT NULL,
    "guest_phone" TEXT,
    "expected_at" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_logs" (
    "id" TEXT NOT NULL,
    "person_type" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "gate_id" TEXT NOT NULL,
    "guard_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "method" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "photo_url" TEXT,
    "vehicle_number" TEXT,
    "entry_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_time" TIMESTAMP(3),

    CONSTRAINT "entry_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "id_documents" (
    "id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "document_type" TEXT NOT NULL,
    "id_category" TEXT NOT NULL,
    "extracted_data" JSONB NOT NULL,
    "id_photo_url" TEXT,
    "raw_image_url" TEXT NOT NULL,
    "id_number" TEXT,
    "format_valid" BOOLEAN,
    "verification_status" TEXT NOT NULL DEFAULT 'unverified',
    "verification_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "id_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impersonation_checks" (
    "id" TEXT NOT NULL,
    "id_document_id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "live_photo_url" TEXT NOT NULL,
    "id_photo_url" TEXT NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "result" TEXT NOT NULL,
    "previous_usage" JSONB,
    "guard_decision" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impersonation_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plate_scans" (
    "id" TEXT NOT NULL,
    "entry_log_id" TEXT NOT NULL,
    "plate_image_url" TEXT NOT NULL,
    "extracted_number" TEXT,
    "ocr_confidence" DOUBLE PRECISION,
    "manual_override" TEXT,
    "matched_vehicle_id" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'unverified',
    "parivahan_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plate_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "flats_flat_number_key" ON "flats"("flat_number");

-- CreateIndex
CREATE UNIQUE INDEX "residents_username_key" ON "residents"("username");

-- CreateIndex
CREATE UNIQUE INDEX "guards_username_key" ON "guards"("username");

-- CreateIndex
CREATE UNIQUE INDEX "staff_flat_assignments_staff_id_flat_id_key" ON "staff_flat_assignments"("staff_id", "flat_id");

-- CreateIndex
CREATE UNIQUE INDEX "approvals_visit_id_key" ON "approvals"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "plate_scans_entry_log_id_key" ON "plate_scans"("entry_log_id");

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guards" ADD CONSTRAINT "guards_assigned_gate_id_fkey" FOREIGN KEY ("assigned_gate_id") REFERENCES "gates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_flat_assignments" ADD CONSTRAINT "staff_flat_assignments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_flat_assignments" ADD CONSTRAINT "staff_flat_assignments_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_profiles" ADD CONSTRAINT "fp_resident_fk" FOREIGN KEY ("person_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_profiles" ADD CONSTRAINT "fp_staff_fk" FOREIGN KEY ("person_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_gate_id_fkey" FOREIGN KEY ("gate_id") REFERENCES "gates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_guard_id_fkey" FOREIGN KEY ("guard_id") REFERENCES "guards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_passes" ADD CONSTRAINT "guest_passes_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_logs" ADD CONSTRAINT "entry_logs_gate_id_fkey" FOREIGN KEY ("gate_id") REFERENCES "gates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_logs" ADD CONSTRAINT "entry_logs_guard_id_fkey" FOREIGN KEY ("guard_id") REFERENCES "guards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_documents" ADD CONSTRAINT "id_documents_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_documents" ADD CONSTRAINT "id_documents_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impersonation_checks" ADD CONSTRAINT "impersonation_checks_id_document_id_fkey" FOREIGN KEY ("id_document_id") REFERENCES "id_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impersonation_checks" ADD CONSTRAINT "impersonation_checks_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plate_scans" ADD CONSTRAINT "plate_scans_entry_log_id_fkey" FOREIGN KEY ("entry_log_id") REFERENCES "entry_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plate_scans" ADD CONSTRAINT "plate_scans_matched_vehicle_id_fkey" FOREIGN KEY ("matched_vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
