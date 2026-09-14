import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'extraction-admission.json'), 'utf8'));
const counterparts = JSON.parse(fs.readFileSync(path.join(root, 'counterparts.json'), 'utf8'));
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const errors = [];
const require = (ok, message) => { if (!ok) errors.push(message); };

const source = counterparts.counterparts.find((entry) => entry.repository === policy.source_implementation.repository);
require(Boolean(source), 'source implementation must be an admitted counterpart');
if (source) require(source.revision === policy.source_implementation.revision, 'source revision must match immutable counterpart revision');
require(/^[0-9a-f]{40}$/i.test(policy.source_implementation.revision), 'source revision must be a 40-hex immutable commit');
require(policy.current_contract_authority === 'ores-wasm-loaders/owls-interfaces', 'current contract authority drift');
require(policy.required_evidence.length >= 8, 'admission evidence set is unexpectedly weak');
require(new Set(policy.required_evidence).size === policy.required_evidence.length, 'duplicate admission evidence');
require(policy.forbidden_before_admission.includes('activate-during-prepare'), 'prepare/activate invariant missing');
require(policy.forbidden_before_admission.includes('remove-cold-start-fallback'), 'cold fallback invariant missing');
require(policy.ownership.typespec_json_schema.includes('owls-interfaces'), 'schema authority must remain with OWLS before migration');
require(readme.includes('prepare is not activate'), 'README prepare/activate invariant missing');

if (policy.extraction_status === 'not_admitted') {
  require(!fs.existsSync(path.join(root, 'src')), 'neutral implementation source is forbidden before admission');
  require(!fs.existsSync(path.join(root, 'contracts')), 'new contract authority is forbidden before admission');
} else {
  require(policy.extraction_status === policy.admission_requires.status_change_to, 'unknown extraction status');
}

if (errors.length) {
  for (const error of errors) console.error(`extraction-admission: ${error}`);
  process.exit(1);
}
console.log(`loader extraction admission: ok (${policy.extraction_status})`);
