import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { connectDB, disconnectDB } from "../../src/db/connection";
import { FacultyModel } from "../../src/db/models/faculty";
import { createUser, deleteUserByID, updateUserByID } from "../../src/services/userService";

const KEEP_TEST_DATA = process.env.KEEP_TEST_DATA === "1";
const facultyId = "F_USER_TEST";

const adminUser = {
  id: "U_ADMIN_1",
  faculty_id: facultyId,
  name: "Admin One",
  email: "admin1@example.com",
  password: "hashed-placeholder",
  role: "admin" as const,
  must_change_password: false,
};

const supportUser = {
  id: "U_SUPPORT_1",
  faculty_id: facultyId,
  name: "Support One",
  email: "support1@example.com",
  password: "hashed-placeholder",
  role: "support" as const,
  must_change_password: false,
};

const seedFaculty = {
  id: facultyId,
  name: "User Test Faculty",
  users: [adminUser, supportUser],
  current_working_schedule_id: "",
  academic_years: [],
};

describe("userService admin rollover protections", () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await FacultyModel.deleteMany({ id: facultyId });

    await FacultyModel.create(seedFaculty);
  });

  afterAll(async () => {
    if (!KEEP_TEST_DATA) {
      await FacultyModel.deleteMany({ id: facultyId });
    }
    await disconnectDB();
  });

  test("createUser hashes passwords and syncs faculty users", async () => {
    const created = await createUser(facultyId, {
      id: "U_NEW",
      faculty_id: facultyId,
      name: "New Support",
      email: "new.support@example.com",
      password: "password123",
      role: "support",
      must_change_password: false,
    });

    expect(created.password).not.toBe("password123");
    expect(await Bun.password.verify("password123", created.password)).toBe(true);

    const faculty = await FacultyModel.findOne({ id: facultyId }).lean();
    const embedded = faculty?.users.find((u) => u.id === "U_NEW");
    expect(embedded).toBeTruthy();
    expect(embedded?.password).not.toBe("password123");
  });

  test("promoting a support user to admin succeeds", async () => {
    const updated = await updateUserByID(facultyId, supportUser.id, { role: "admin" });
    expect(updated.role).toBe("admin");

    const faculty = await FacultyModel.findOne({ id: facultyId }).lean();
    expect(faculty?.users.find((u) => u.id === supportUser.id)?.role).toBe("admin");
  });

  test("demoting the only admin is rejected", async () => {
    let err: any;
    try {
      await updateUserByID(facultyId, adminUser.id, { role: "support" });
    } catch (e) {
      err = e;
    }

    expect(err).toBeTruthy();
    expect(err.status).toBe(409);
    expect(err.message).toBe("Faculty must retain at least one admin");
  });

  test("demoting an admin succeeds when another admin exists", async () => {
    await createUser(facultyId, {
      id: "U_ADMIN_2",
      faculty_id: facultyId,
      name: "Admin Two",
      email: "admin2@example.com",
      password: "password123",
      role: "admin",
      must_change_password: false,
    });

    const updated = await updateUserByID(facultyId, adminUser.id, { role: "support" });
    expect(updated.role).toBe("support");
  });

  test("deleting the only admin is rejected", async () => {
    let err: any;
    try {
      await deleteUserByID(facultyId, adminUser.id);
    } catch (e) {
      err = e;
    }

    expect(err).toBeTruthy();
    expect(err.status).toBe(409);
    expect(err.message).toBe("Faculty must retain at least one admin");
  });

  test("deleting an admin succeeds when another admin exists", async () => {
    await createUser(facultyId, {
      id: "U_ADMIN_2",
      faculty_id: facultyId,
      name: "Admin Two",
      email: "admin2@example.com",
      password: "password123",
      role: "admin",
      must_change_password: false,
    });

    const deleted = await deleteUserByID(facultyId, adminUser.id);
    expect(deleted.id).toBe(adminUser.id);

    const faculty = await FacultyModel.findOne({ id: facultyId }).lean();
    expect(faculty?.users.some((u) => u.id === adminUser.id)).toBe(false);
  });
});
