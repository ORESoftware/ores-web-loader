import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'extraction-admission.json'), 'utf8'));
const counterparts = JSON.parse(fs.readFileSync(path.join(root, 'counterparts.json'), 'utf8'));
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const errors = [];
const require = (ok, message) => { if (!ok) errors.push(message); };

const requiredEvidence = [
  'behavior-used-by-at-least-two-independent-loader-families',
  'prepare-never-activates-conformance',
  'cold-start-fallback-conformance',
  'immutable-release-and-asset-digest-conformance',
  'browser-worker-ssr-boundary-defined',
  'framework-adapters-remain-outside-neutral-core',
  'cross-runtime-fixtures-pass-at-immutable-counterpart-revisions',
  'contract-authority-migration-plan-reviewed-before-any-schema-copy',
];
const forbiddenBeforeAdmission = [
  'copy-owls-source-implementation',
  'copy-or-fork-contract-authority',
  'framework-specific-code-in-neutral-core',
  'activate-during-prepare',
  'remove-cold-start-fallback',
];
const isLowerHex = (value, length) =>
  typeof value === 'string' && new RegExp('^[0-9a-f]{' + length + '}$').test(value);
require(policy.schema_version === 1, 'unsupported admission schema');
require(Array.isArray(counterparts.counterparts), 'counterpart registry is missing');

const source = counterparts.counterparts.find((entry) => entry.repository === policy.source_implementation.repository);
require(Boolean(source), 'source implementation must be an admitted counterpart');
if (source) require(source.revision === policy.source_implementation.revision, 'source revision must match immutable counterpart revision');
require(isLowerHex(policy.source_implementation.revision, 40), 'source revision must be a canonical lowercase 40-hex immutable commit');
require(policy.current_contract_authority === 'ores-wasm-loaders/owls-interfaces', 'current contract authority drift');
require(Array.isArray(policy.required_evidence), 'admission evidence list is missing');
for (const key of requiredEvidence) {
  require(policy.required_evidence.includes(key), `required admission evidence missing: ${key}`);
}
require(policy.required_evidence.length >= requiredEvidence.length, 'admission evidence set is unexpectedly weak');
require(new Set(policy.required_evidence).size === policy.required_evidence.length, 'duplicate admission evidence');
require(Array.isArray(policy.forbidden_before_admission), 'forbidden-operation list is missing');
for (const key of forbiddenBeforeAdmission) {
  require(policy.forbidden_before_admission.includes(key), `forbidden pre-admission operation missing: ${key}`);
}
require(new Set(policy.forbidden_before_admission).size === policy.forbidden_before_admission.length, 'duplicate forbidden operation');
require(policy.ownership.typespec_json_schema.includes('owls-interfaces'), 'schema authority must remain with OWLS before migration');
require(readme.includes('prepare is not activate'), 'README prepare/activate invariant missing');

require(policy.admission_requires?.all_required_evidence === true, 'all evidence must be required');
require(policy.admission_requires?.immutable_source_revision === true, 'immutable source revision must be required');
require(policy.admission_requires?.human_review === true, 'human review must be required');
require(policy.admission_requires?.status_change_to === 'admitted', 'admitted status policy drift');

if (policy.extraction_status === 'not_admitted') {
  require(!fs.existsSync(path.join(root, 'src')), 'neutral implementation source is forbidden before admission');
  const contractsPath = path.join(root, 'contracts');
  if (fs.existsSync(contractsPath)) {
    const entries = fs.readdirSync(contractsPath, { withFileTypes: true });
    require(entries.every((entry) => entry.name === 'README.md' && entry.isFile()),
      'authored contract authority is forbidden before admission (README placeholder is allowed)');
  }
  require(policy.admission_receipt === undefined, 'unadmitted package must not claim an admission receipt');
} else if (policy.extraction_status === 'admitted') {
  // A status-only change cannot turn an unreviewed extraction into an admitted one.
  const receipt = policy.admission_receipt;
  require(receipt && typeof receipt === 'object', 'admitted extraction requires a review receipt');
  if (receipt && typeof receipt === 'object') {
    require(receipt.source_revision === policy.source_implementation.revision, 'receipt source revision is stale');
    require(isLowerHex(receipt.review_commit, 40), 'review receipt must pin an immutable review commit');
    require(Array.isArray(receipt.reviewed_by) && receipt.reviewed_by.length > 0 &&
      receipt.reviewed_by.every((value) => typeof value === 'string' && value.trim().length > 0),
    'human review identities are required');
    for (const key of policy.required_evidence) {
      require(isLowerHex(receipt.evidence_sha256?.[key], 64), `missing immutable evidence digest: ${key}`);
    }
  }
} else {
  require(false, 'unknown extraction status');
}

if (errors.length) {
  for (const error of errors) console.error(`extraction-admission: ${error}`);
  process.exit(1);
}
console.log(`loader extraction admission: ok (${policy.extraction_status})`);
