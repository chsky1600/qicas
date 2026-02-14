import { validateAssignment } from "../services/validatorService";
import { getYearConstraints } from "../services/yearService";

async function main() {
  const ctx = await getYearConstraints("test-year");

  // don't run this without a schedule to test i.e., pass a year_id you know exits in Mongo
  const schedule = ctx.schedules[0]!; 

  console.log("=== CROSS_TERM_DUPLICATE (should fire) ===");
  // a-2: Smith on CISC101 Winter — a-1 already has Smith on CISC101 Fall
  const candidate1 = schedule.assignments.find(a => a.id === "a-2")!;
  const result1 = await validateAssignment(schedule, candidate1);
  console.log(JSON.stringify(result1, null, 2));

  console.log("\n=== Full-year course (should NOT fire) ===");
  // a-3: CISC490 is full-year, so cross-term is expected
  const candidate2 = schedule.assignments.find(a => a.id === "a-3")!;
  const result2 = await validateAssignment(schedule, candidate2);
  console.log(JSON.stringify(result2, null, 2));

  console.log("\n=== Single-term only (should NOT fire) ===");
  // a-10: CISC204 in Winter, no matching Fall assignment for same instructor
  const candidate3 = schedule.assignments.find(a => a.id === "a-10")!;
  const result3 = await validateAssignment(schedule, candidate3);
  console.log(JSON.stringify(result3, null, 2));
}

main();
