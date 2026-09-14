"""Behavioral checks: a valid package passes and corrupted packages fail closed."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

from validate_phase0 import REQUIRED, validate

SOURCE = Path(__file__).resolve().parents[1]


class DocumentValidationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='dealith-phase0-')
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        shutil.copytree(SOURCE / 'docs', self.root / 'docs')
        # Later phase docs may link executable artifacts. Copy source only, never dependencies,
        # local credentials, build output or Git state, into each mutation fixture.
        for directory in ['apps', 'packages', 'tools', 'tests', 'infra', '.github', 'prisma']:
            if (SOURCE / directory).is_dir():
                shutil.copytree(SOURCE / directory, self.root / directory,
                                ignore=shutil.ignore_patterns('node_modules', '.next', 'dist',
                                                             'generated', '__pycache__', '*.tsbuildinfo'))
        for name in ['package.json', 'pnpm-lock.yaml', 'compose.yaml', 'Dockerfile', '.env.example',
                     'pnpm-workspace.yaml', 'playwright.config.ts', 'vitest.config.ts']:
            if (SOURCE / name).is_file():
                shutil.copyfile(SOURCE / name, self.root / name)
        for relative in REQUIRED:
            if relative.startswith('docs/'):
                continue
            source = SOURCE / relative
            target = self.root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)

    def change(self, relative, before, after):
        path = self.root / relative
        text = path.read_text()
        self.assertIn(before, text)
        path.write_text(text.replace(before, after, 1))

    def rejects(self, expected):
        errors, _ = validate(self.root)
        self.assertTrue(errors, 'corrupted package unexpectedly passed')
        self.assertTrue(any(expected in e for e in errors), errors)

    def test_complete_package_and_cli_pass(self):
        errors, stats = validate(self.root)
        self.assertEqual(errors, [])
        self.assertEqual(stats['master_scenarios'], 67)
        self.assertEqual(stats['project_states'], 17)
        self.assertEqual(stats['deal_states'], 28)
        result = subprocess.run([sys.executable, str(SOURCE / 'tools/validate_phase0.py'),
                                 '--root', str(self.root)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('validation: PASS', result.stdout)

    def test_missing_file_and_broken_link_fail(self):
        (self.root / 'docs/SECURITY_MODEL.md').unlink()
        self.rejects('required file missing/empty')
        self.rejects('broken local link')
        result = subprocess.run([sys.executable, str(SOURCE / 'tools/validate_phase0.py'),
                                 '--root', str(self.root)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn('validation: FAIL', result.stdout)

    def test_missing_anchor_fails(self):
        with (self.root / 'README.md').open('a') as stream:
            stream.write('\n[Bad anchor](docs/SECURITY_MODEL.md#does-not-exist)\n')
        self.rejects('missing anchor')

    def test_master_changes_fail(self):
        with (self.root / 'DEALITH_MASTER_PROJECT_SCOPE.md').open('a') as stream:
            stream.write('\nUnexpected source change\n')
        self.rejects('master checksum')

    def test_missing_baseline_adr_fails_after_extensions(self):
        (self.root / 'docs/adr/ADR-002-monorepo.md').unlink()
        self.rejects('ADR file IDs must retain')

    def test_changed_edge_guard_fails(self):
        path = self.root / 'docs/architecture/LIFECYCLE_REGISTRY.json'
        data = json.loads(path.read_text())
        data['deal']['edges'][0]['guard'] = 'Bypass the actual evidence requirement.'
        path.write_text(json.dumps(data))
        self.rejects('detail contract differs for D001')

    def test_unknown_state_fails(self):
        path = self.root / 'docs/architecture/LIFECYCLE_REGISTRY.json'
        data = json.loads(path.read_text())
        data['project']['states'].append('INVENTED')
        path.write_text(json.dumps(data))
        self.rejects('canonical states drift')

    def test_invalid_registry_shape_fails(self):
        (self.root / 'docs/architecture/LIFECYCLE_REGISTRY.json').write_text('[]')
        self.rejects('registry must contain only project/deal machines')

    def test_unregistered_causal_event_fails(self):
        path = self.root / 'docs/DOMAIN_EVENTS.md'
        path.write_text('\n'.join(line for line in path.read_text().splitlines()
                                  if not line.startswith('| `escrow.funded` |')) + '\n')
        self.rejects('unregistered')

    def test_duplicate_scenario_id_fails(self):
        self.change('docs/E2E_TEST_MATRIX.md', '| E2E-002 |', '| E2E-001 |')
        self.rejects('E2E IDs must be unique')

    def test_unknown_scenario_phase_fails(self):
        self.change('docs/E2E_TEST_MATRIX.md', '| PHASE-02 |', '| PHASE-99 |')
        self.rejects('references unknown phase')

    def test_missing_rights_reservation_fails(self):
        path = self.root / 'docs/DATA_MODEL.md'
        path.write_text('\n'.join(line for line in path.read_text().splitlines()
                                  if not line.startswith('| ProjectReservation |')) + '\n')
        self.rejects('missing cross-document integrity entity')


if __name__ == '__main__':
    unittest.main()
