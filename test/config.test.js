const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL: ${name}`);
    console.log(`        ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

console.log('\n  Prisma 4 → 5 Migration Test Suite\n');

// --------------------------------------------------
// Test 1: prisma/schema.prisma exists
// --------------------------------------------------
test('prisma/schema.prisma file exists', () => {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  assert(fs.existsSync(schemaPath), 'schema.prisma not found');
});

// --------------------------------------------------
// Test 2: Schema has expected models
// --------------------------------------------------
test('schema.prisma contains User, Post, and Category models', () => {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  assert(schema.includes('model User'), 'Missing model User');
  assert(schema.includes('model Post'), 'Missing model Post');
  assert(schema.includes('model Category'), 'Missing model Category');
});

// --------------------------------------------------
// Test 3: Schema has many-to-many relation
// --------------------------------------------------
test('schema.prisma has PostCategories many-to-many relation', () => {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  assert(
    schema.includes('"PostCategories"'),
    'Missing PostCategories relation'
  );
});

// --------------------------------------------------
// Test 4: @prisma/client can be required
// --------------------------------------------------
test('@prisma/client package can be required', () => {
  const client = require('@prisma/client');
  assert(client, '@prisma/client require returned falsy');
  assert(
    typeof client.PrismaClient === 'function',
    'PrismaClient is not a function'
  );
});

// --------------------------------------------------
// Test 5: PrismaClient constructor works
// --------------------------------------------------
test('PrismaClient constructor accepts log option', () => {
  const { PrismaClient } = require('@prisma/client');
  // PrismaClient in Prisma 4 can be instantiated without a generated client
  // for basic constructor validation — it will throw only on actual queries
  let client;
  try {
    client = new PrismaClient({ log: ['query'] });
  } catch (e) {
    // In Prisma 4 without generate, constructor may throw — that's OK
    // as long as PrismaClient itself is constructable
    assert(
      e.message.includes('initialize') ||
        e.message.includes('generate') ||
        e.message.includes('schema') ||
        e.message.includes('PRISMA'),
      `Unexpected error: ${e.message}`
    );
    return;
  }
  assert(client, 'PrismaClient constructor returned falsy');
});

// --------------------------------------------------
// Test 6: $use middleware method exists on PrismaClient prototype
// --------------------------------------------------
test('PrismaClient has $use method (deprecated in Prisma 5)', () => {
  const { PrismaClient } = require('@prisma/client');
  // Check that $use exists on the prototype or instance
  // In Prisma 4, $use is a first-class method
  assert(
    typeof PrismaClient.prototype.$use === 'function' ||
      '$use' in PrismaClient.prototype,
    '$use method not found on PrismaClient prototype'
  );
});

// --------------------------------------------------
// Test 7: rejectOnNotFound option is recognized by Prisma 4
// --------------------------------------------------
test('PrismaClient constructor accepts rejectOnNotFound option', () => {
  const { PrismaClient } = require('@prisma/client');
  // In Prisma 4, rejectOnNotFound can be set globally in constructor
  // In Prisma 5, this option is removed entirely
  let client;
  try {
    client = new PrismaClient({
      rejectOnNotFound: true,
    });
  } catch (e) {
    // Constructor may fail for other reasons (no generated client)
    // but should NOT fail specifically because of rejectOnNotFound
    assert(
      !e.message.includes('rejectOnNotFound'),
      `rejectOnNotFound was rejected: ${e.message}`
    );
    return;
  }
  assert(client, 'PrismaClient constructor returned falsy');
});

// --------------------------------------------------
// Test 8: Source files exist and have expected patterns
// --------------------------------------------------
test('src/db.js exists and exports PrismaClient usage', () => {
  const dbPath = path.join(__dirname, '..', 'src', 'db.js');
  assert(fs.existsSync(dbPath), 'src/db.js not found');
  const content = fs.readFileSync(dbPath, 'utf-8');
  assert(content.includes('PrismaClient'), 'db.js missing PrismaClient');
  assert(content.includes("log: ['query']"), 'db.js missing log config');
});

test('src/queries.js exists and uses rejectOnNotFound', () => {
  const queriesPath = path.join(__dirname, '..', 'src', 'queries.js');
  assert(fs.existsSync(queriesPath), 'src/queries.js not found');
  const content = fs.readFileSync(queriesPath, 'utf-8');
  assert(
    content.includes('rejectOnNotFound'),
    'queries.js missing rejectOnNotFound'
  );
  assert(content.includes('$transaction'), 'queries.js missing $transaction');
  assert(content.includes('groupBy'), 'queries.js missing groupBy');
});

test('src/middleware.js exists and uses $use()', () => {
  const mwPath = path.join(__dirname, '..', 'src', 'middleware.js');
  assert(fs.existsSync(mwPath), 'src/middleware.js not found');
  const content = fs.readFileSync(mwPath, 'utf-8');
  assert(content.includes('$use'), 'middleware.js missing $use');
  assert(
    content.includes('soft delete') || content.includes('Soft delete'),
    'middleware.js missing soft delete pattern'
  );
});

// --------------------------------------------------
// Test 9: Prisma version check
// --------------------------------------------------
test('@prisma/client version is 4.x', () => {
  const pkg = require('@prisma/client/package.json');
  assert(
    pkg.version.startsWith('4.'),
    `Expected @prisma/client 4.x, got ${pkg.version}`
  );
});

test('prisma CLI version is 4.x', () => {
  const pkg = require('prisma/package.json');
  assert(
    pkg.version.startsWith('4.'),
    `Expected prisma 4.x, got ${pkg.version}`
  );
});

// --------------------------------------------------
// Summary
// --------------------------------------------------
console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
