import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePolicy = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'extraction-admission.json'), 'utf8'));
const baselineCounterparts = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'counterparts.json'), 'utf8'));

function runFixture(modify = () => {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ores-loader-admission-'));
  try {
    fs.mkdirSync(path.join(dir, 'scripts'));
    fs.copyFileSync(
      path.join(repositoryRoot, 'scripts/validate-extraction-admission.mjs'),
      path.join(dir, 'scripts/validate-extraction-admission.mjs')
    );
    fs.copyFileSync(path.join(repositoryRoot, 'README.md'), path.join(dir, 'README.md'));
    const policy = structuredClone(baselinePolicy);
    const counterparts = structuredClone(baselineCounterparts);
    modify(policy, counterparts, dir);
    fs.writeFileSync(path.join(dir, 'extraction-admission.json'), JSON.stringify(policy));
    fs.writeFileSync(path.join(dir, 'counterparts.json'), JSON.stringify(counterparts));
    const result = spawnSync(process.execPath, [
      path.join(dir, 'scripts/validate-extraction-admission.mjs')
    ], { encoding: 'utf8', timeout: 5000 });
    if (result.error) throw result.error;
    return result;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function expectRejected(modify, message) {
  const result = runFixture(modify);
  assert.notEqual(result.status, 0, 'unsafe admission policy must fail closed');
  assert.match(result.stderr, message);
}

test('the existing unadmitted source remains valid', () => {
  assert.equal(runFixture().status, 0);
});


test('documentation-only contract boundary is allowed before admission', () => {
  const result = runFixture((_policy, _counterparts, dir) => {
    fs.mkdirSync(path.join(dir, 'contracts'));
    fs.writeFileSync(path.join(dir, 'contracts/README.md'), '# Placeholder\\n');
  });
  assert.equal(result.status, 0, result.stderr);
});

test('authored contract schema is forbidden before admission', () => {
  expectRejected((_policy, _counterparts, dir) => {
    fs.mkdirSync(path.join(dir, 'contracts'));
    fs.writeFileSync(path.join(dir, 'contracts/schema.tsp'), 'model Payload {}');
  }, /authored contract authority is forbidden/);
});

test('a deleted evidence item cannot be replaced by an unrelated item', () => {
  expectRejected((policy) => {
    policy.required_evidence.shift();
    policy.required_evidence.push('unrelated-evidence');
  }, /required admission evidence missing/);
});

test('all forbidden extraction operations must remain prohibited', () => {
  expectRejected((policy) => {
    policy.forbidden_before_admission.splice(1, 1);
  }, /forbidden pre-admission operation missing/);
});

test('uppercase source revisions are not canonical immutable pins', () => {
  expectRejected((policy, counterparts) => {
    policy.source_implementation.revision = policy.source_implementation.revision.toUpperCase();
    counterparts.counterparts[0].revision = policy.source_implementation.revision;
  }, /canonical lowercase/);
});

test('human review and immutable revision policy cannot be disabled', () => {
  expectRejected((policy) => {
    policy.admission_requires.human_review = false;
  }, /human review must be required/);
});

test('admission cannot be triggered by a status-only flip', () => {
  expectRejected((policy) => {
    policy.extraction_status = 'admitted';
  }, /requires a review receipt/);
});

test('evidence digests and review commit must be exact and immutable', () => {
  expectRejected((policy) => {
    policy.extraction_status = 'admitted';
    policy.admission_receipt = {
      source_revision: policy.source_implementation.revision,
      review_commit: 'a'.repeat(40),
      reviewed_by: ['reviewer'],
      evidence_sha256: Object.fromEntries(
        policy.required_evidence.map((item) => [item, 'a'.repeat(64)])
      )
    };
    delete policy.admission_receipt.evidence_sha256[policy.required_evidence[0]];
  }, /missing immutable evidence digest/);
});

test('fully pinned reviewed admission metadata satisfies the structural gate', () => {
  const result = runFixture((policy) => {
    policy.extraction_status = 'admitted';
    policy.admission_receipt = {
      source_revision: policy.source_implementation.revision,
      review_commit: 'a'.repeat(40),
      reviewed_by: ['reviewer'],
      evidence_sha256: Object.fromEntries(
        policy.required_evidence.map((item) => [item, 'a'.repeat(64)])
      )
    };
  });
  assert.equal(result.status, 0, result.stderr);
});
