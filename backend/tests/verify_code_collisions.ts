import crypto from "crypto";

function generateProfileNumber() {
  const randomSuffix = crypto.randomBytes(3).toString("hex");
  return `PR-${Date.now()}-${randomSuffix}`;
}

function generateClientCode() {
  const randomSuffix = crypto.randomBytes(4).toString("hex");
  return `CL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;
}

function runCollisionTest() {
  console.log("Starting code uniqueness collision test (10,000 iterations)...");
  
  const numIterations = 10000;
  const profileNumbers = new Set<string>();
  const clientCodes = new Set<string>();

  for (let i = 0; i < numIterations; i++) {
    profileNumbers.add(generateProfileNumber());
    clientCodes.add(generateClientCode());
  }

  console.log(`Generated profile numbers size: ${profileNumbers.size}`);
  console.log(`Generated client codes size: ${clientCodes.size}`);

  const profileCollisions = numIterations - profileNumbers.size;
  const clientCollisions = numIterations - clientCodes.size;

  console.log(`Profile collisions: ${profileCollisions}`);
  console.log(`Client collisions: ${clientCollisions}`);

  if (profileCollisions === 0 && clientCollisions === 0) {
    console.log("PASS: 10,000 iterations generated with ZERO collisions!");
    process.exit(0);
  } else {
    console.error("FAIL: Collisions detected!");
    process.exit(1);
  }
}

runCollisionTest();
