-- Add role to existing users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20)
NOT NULL DEFAULT 'patient';

-- Restrict roles to patient or doctor
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_role_check'
          AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('patient', 'doctor'));
    END IF;
END $$;

-- Store doctor and patient assignments
CREATE TABLE IF NOT EXISTS doctor_patient_assignments (
    doctor_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    patient_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (doctor_id, patient_id),

    CHECK (doctor_id <> patient_id)
);

CREATE INDEX IF NOT EXISTS
idx_doctor_patient_assignments_patient
ON doctor_patient_assignments(patient_id);