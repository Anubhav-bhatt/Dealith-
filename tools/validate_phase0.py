#!/usr/bin/env python3
"""Validate Dealith's Phase 0 documents, offline, without changing the workspace."""
import argparse
from collections import Counter, deque
import hashlib
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

MASTER = 'DEALITH_MASTER_PROJECT_SCOPE.md'
MASTER_SHA256 = '57906185d116eddf43617975e12a34872e1680d5b9108d5be52cb794dc087a3d'
DOC_NAMES = '''MASTER_PRODUCT_SPEC MASTER_ARCHITECTURE REPOSITORY_INVENTORY PRODUCT_DOMAIN_MAP
DATA_MODEL API_BOUNDARIES DOMAIN_EVENTS PROJECT_STATE_MACHINE DEAL_STATE_MACHINE
RBAC_ABAC_MATRIX SECURITY_MODEL THREAT_MODEL DATA_ROOM_SECURITY_MODEL
OFFER_DILIGENCE_TRANSFER_MODEL SETTLEMENT_ARCHITECTURE CRYPTO_BOUNDARY
COMPLIANCE_BOUNDARIES AI_ARCHITECTURE REPOSITORY_INTEGRATION PROJECT_PREVIEW_ARCHITECTURE
UI_INFORMATION_ARCHITECTURE DESIGN_SYSTEM INFRASTRUCTURE DEPLOYMENT_ARCHITECTURE
OBSERVABILITY CI_CD TEST_STRATEGY E2E_TEST_MATRIX PHASE_ACCEPTANCE_MATRIX
PROJECT_RISK_REGISTER DEFINITION_OF_DONE RUNBOOKS'''.split()
REQUIRED = [MASTER, 'README.md', 'CHANGELOG.md', 'tools/validate_phase0.py',
            'tools/test_validate_phase0.py', 'docs/architecture/LIFECYCLE_REGISTRY.json',
            'docs/adr/README.md'] + ['docs/' + n + '.md' for n in DOC_NAMES] + [
                'docs/phases/PHASE_00_' + n + '.md'
                for n in ['PLAN', 'REQUIREMENTS', 'TEST_MATRIX', 'REPORT']]
DOMAINS = '''Identity|Users|Profiles|Organizations|Organization Membership|Verification|Projects|
Project Profiles|Project Capabilities|Project Previews|Project Technology|Project Metrics|
Project Financials|Project Architecture|Marketplace|Search|Categories|Recommendations|
Watchlists|Saved Searches|Deal Cart|Comparison|Access Requests|NDA|Messaging|Deals|Offers|
Counteroffers|LOI|Virtual Data Room|Documents|Document Permissions|Due Diligence|Agreements|
Settlement|Escrow|Provider Transactions|Asset Transfer|Portfolio|Reviews|Reputation|
Notifications|Billing|Subscriptions|Compliance|Risk|Analytics|AI Intelligence|Audit|
Administration|Feature Flags'''
DOMAINS = {s.strip() for s in DOMAINS.replace('\n', '').split('|')}
ALIASES = {'UserProfile': 'Profile', 'OrganizationInvitation': 'Invitation',
           'ConversationParticipant': 'Participant'}
EVENT_PATTERN = re.compile(r'\b[a-z_]+\.[a-z_]+\b')


def table(text, first_header):
    """Read a simple pipe table by its first header, preserving cell contents."""
    rows = []
    active = False
    width = 0
    for line in text.splitlines():
        if not line.startswith('|'):
            if active:
                break
            continue
        cells = [s.strip() for s in re.split(r'(?<!\\)\|', line.strip('|'))]
        if not active:
            if cells[0] == first_header:
                active, width = True, len(cells)
            continue
        if all(re.fullmatch(r'[:\-\s]+', s) for s in cells):
            continue
        if len(cells) != width:
            raise ValueError(f'{first_header} table has {len(cells)} cells; expected {width}')
        rows.append(cells)
    if not active or not rows:
        raise ValueError(f'missing or empty table: {first_header}')
    return rows


def section(master, number):
    match = re.search(rf'^# {number}\. .*?(?=^# \d+\.|\Z)', master, re.M | re.S)
    if not match:
        raise ValueError(f'missing master section {number}')
    return match.group()


def fenced_values(text):
    return [line.strip() for block in re.findall(r'```text\n(.*?)```', text, re.S)
            for line in block.splitlines() if line.strip()]


def visible_markdown(text):
    return re.sub(r'^```[^\n]*\n.*?^```\s*$', '', text, flags=re.M | re.S)


def heading_ids(text):
    counts = Counter()
    result = set()
    for heading in re.findall(r'^#{1,6}\s+(.+?)\s*#*$', visible_markdown(text), re.M):
        heading = re.sub(r'\[([^]]+)\]\([^)]+\)', r'\1', heading).lower()
        slug = re.sub(r'[^\w\-\s]', '', heading).replace(' ', '-')
        suffix = counts[slug]
        counts[slug] += 1
        result.add(slug + (f'-{suffix}' if suffix else ''))
    result.update(re.findall(r'<a\s+(?:id|name)=["\']([^"\']+)', text))
    return result


def validate(root):
    root = Path(root).resolve()
    errors, stats = [], {}

    def require(ok, message):
        if not ok:
            errors.append(message)

    def read(path):
        return (root / path).read_text(encoding='utf-8')

    def run(name, check):
        try:
            check()
        except (OSError, ValueError, TypeError, KeyError, IndexError, AttributeError) as exc:
            errors.append(f'{name}: {exc}')

    def unique(values, label):
        duplicates = sorted(k for k, v in Counter(values).items() if v > 1)
        require(not duplicates, f'{label}: duplicate IDs/values {duplicates}')

    def source_and_files():
        for path in REQUIRED:
            require((root / path).is_file() and (root / path).stat().st_size > 0,
                    f'required file missing/empty: {path}')
        digest = hashlib.sha256((root / MASTER).read_bytes()).hexdigest()
        require(digest == MASTER_SHA256, 'master checksum differs from preserved baseline')
        ids = [int(v) for v in re.findall(r'^# (\d+)\.', read(MASTER), re.M)]
        require(ids == list(range(104)), 'master section inventory must be 0–103 exactly')
        stats['master_sections'] = len(ids)
        adrs = sorted((root / 'docs/adr').glob('ADR-*.md'))
        adr_ids = [int(re.match(r'ADR-(\d{3})-', p.name).group(1)) for p in adrs]
        require(len(adr_ids) >= 16 and adr_ids == list(range(1, len(adr_ids) + 1)),
                'ADR file IDs must retain 001–016 and extend contiguously without duplicates')
        index = read('docs/adr/README.md')
        for p in adrs:
            require('](' + p.name + ')' in index, f'ADR not linked from index: {p.name}')
            for title in ['Context', 'Verification']:
                require(title.lower() in p.read_text().lower(), f'{p.name}: missing {title}')
        stats['adrs'] = len(adrs)
        logical_docs = fenced_values(section(read(MASTER), 92))
        mappings = table(read('README.md'), 'Master logical document')
        unique([r[0].strip('`') for r in mappings], 'logical document map')
        require({r[0].strip('`') for r in mappings} == set(logical_docs),
                'README must map every master §92 logical document exactly once')

    def links():
        count = 0
        files = sorted(root.glob('*.md')) + sorted((root / 'docs').rglob('*.md'))
        for p in files:
            content = visible_markdown(p.read_text())
            for target in re.findall(r'\]\(([^)]+)\)', content):
                target = target.strip().strip('<>')
                url = urlsplit(target)
                if url.scheme or url.netloc:
                    continue
                # The package intentionally uses simple inline relative Markdown links.
                path = (p.parent / unquote(url.path)).resolve() if url.path else p
                count += 1
                require(path.is_relative_to(root), f'{p.relative_to(root)}: link escapes workspace: {target}')
                require(path.exists(), f'{p.relative_to(root)}: broken local link: {target}')
                if path.is_file() and url.fragment and path.suffix == '.md':
                    require(unquote(url.fragment) in heading_ids(path.read_text()),
                            f'{p.relative_to(root)}: missing anchor: {target}')
        stats['markdown_files'] = len(files)
        stats['local_links'] = count

    def catalogs():
        master = read(MASTER)
        domains = table(read('docs/PRODUCT_DOMAIN_MAP.md'), 'Domain')
        unique([r[0] for r in domains], 'domains')
        require({r[0] for r in domains} == DOMAINS, 'domain catalog must contain all 51 named domains')
        require(all(all(cell for cell in r) for r in domains), 'domain contract has empty cells')
        stats['domains'] = len(domains)
        entities = table(read('docs/DATA_MODEL.md'), 'Entity')
        names = [r[0] for r in entities]
        unique(names, 'entities')
        required_entities = {ALIASES.get(n, n) for n in fenced_values(section(master, 51))}
        require(required_entities <= set(names), f'missing master entities: {sorted(required_entities - set(names))}')
        for alias, canonical in ALIASES.items():
            require(alias in read('docs/DATA_MODEL.md') and canonical in names,
                    f'undocumented entity alias: {alias}')
        for entity in ['ProjectReservation', 'SettlementParticipant', 'SettlementDestination',
                       'SettlementApproval', 'ReconciliationDiscrepancy']:
            require(entity in names, f'missing cross-document integrity entity: {entity}')
        require(all(all(cell for cell in r) for r in entities), 'entity contract has empty cells')
        for row in domains:
            owned = row[2]
            if owned.startswith('No '):
                continue
            refs = re.findall(r'\b[A-Z][A-Za-z]+\b', re.sub(r'\([^)]*\)', '', owned))
            missing = sorted(set(refs) - set(names))
            require(not missing, f'{row[0]} owns unregistered entities: {missing}')
        stats['entities'] = len(names)
        roots = [r[0].strip('`') for r in table(read('docs/API_BOUNDARIES.md'), 'Root')]
        unique(roots, 'API roots')
        require(set(roots) == set(fenced_values(section(master, 52))), 'API roots differ from master §52')
        stats['api_roots'] = len(roots)
        event_rows = table(read('docs/DOMAIN_EVENTS.md'), 'Event')
        events = [r[0].strip('`') for r in event_rows]
        unique(events, 'events')
        require(all(EVENT_PATTERN.fullmatch(e) for e in events), 'invalid event type spelling')
        require(all(all(c for c in r) for r in event_rows), 'event contract has empty cells')
        expected = set(fenced_values(section(master, 53)))
        for row in domains:
            expected.update(EVENT_PATTERN.findall(row[5]))
        require(expected <= set(events), f'unregistered master/domain events: {sorted(expected - set(events))}')
        stats['events'] = len(events)

    def lifecycle():
        registry = json.loads(read('docs/architecture/LIFECYCLE_REGISTRY.json'))
        require(set(registry) == {'project', 'deal'}, 'registry must contain only project/deal machines')
        events = {r[0].strip('`') for r in table(read('docs/DOMAIN_EVENTS.md'), 'Event')}
        for name, number, initial, prefix, edge_count in [('project', 16, 'DRAFT', 'P', 55),
                                                        ('deal', 33, 'INQUIRY', 'D', 96)]:
            machine = registry[name]
            states, edges = machine['states'], machine['edges']
            require(states == fenced_values(section(read(MASTER), number)), f'{name}: canonical states drift')
            unique(states, f'{name} states')
            require(machine['initial'] == initial and initial in states, f'{name}: invalid initial state')
            require(len(edges) == edge_count, f'{name}: frozen edge count differs from {edge_count}')
            require([e['id'] for e in edges] == [f'{prefix}{i:03}' for i in range(1, edge_count + 1)],
                    f'{name}: edge IDs must be sequential and unique')
            unique([(e['source'], e['target']) for e in edges], f'{name} edge pairs')
            for entry in [machine['creation']] + edges:
                for key in ['actor', 'permission', 'guard']:
                    require(isinstance(entry[key], str) and bool(entry[key].strip()),
                            f'{name}: empty/invalid {key} in {entry.get("id", "creation")}')
                emitted = entry['events']
                require(isinstance(emitted, list) and bool(emitted), f'{name}: empty/invalid event list')
                unique(emitted, f'{name} edge events')
                require(set(emitted) <= events, f'{name}: unregistered events {set(emitted) - events}')
            incoming = {s: set() for s in states}
            outgoing = {s: set() for s in states}
            attached = {s: set() for s in states}
            for e in edges:
                a, b = e['source'], e['target']
                require(a in states and b in states and a != b, f'{name}: invalid state pair {a} -> {b}')
                outgoing[a].add(b); incoming[b].add(a)
                attached[a].add(e['id']); attached[b].add(e['id'])
            seen, todo = {initial}, deque([initial])
            while todo:
                for target in outgoing[todo.popleft()] - seen:
                    seen.add(target); todo.append(target)
            require(seen == set(states), f'{name}: unreachable states {set(states) - seen}')
            doc = read(f'docs/{name.upper()}_STATE_MACHINE.md')
            details = table(doc, 'ID')
            require(len(details) == len(edges), f'{name}: transition table/registry length differs')
            rows = {r[0]: r for r in details}
            unique([r[0] for r in details], f'{name} detail rows')
            for e in edges:
                expected = [e['id'], e['source'], e['target'], e['actor'], e['permission'],
                            e['guard'], ', '.join(e['events'])]
                require(rows.get(e['id']) == expected, f'{name}: detail contract differs for {e["id"]}')
            adjacent = table(doc, 'State')
            unique([r[0] for r in adjacent], f'{name} adjacency rows')
            require({r[0] for r in adjacent} == set(states), f'{name}: adjacency state set differs')
            for state, ins, outs, ids in adjacent:
                def split(value):
                    return set() if value in ['—', 'creation only'] else set(value.split(', '))
                require(split(ins) == incoming[state], f'{name}: incoming adjacency differs for {state}')
                require(split(outs) == outgoing[state], f'{name}: outgoing adjacency differs for {state}')
                require(split(ids) == attached[state], f'{name}: adjacency edge IDs differ for {state}')
            stats[f'{name}_states'] = len(states)
            stats[f'{name}_edges'] = len(edges)

    def traceability():
        master = read(MASTER)
        scopes = table(read('docs/MASTER_PRODUCT_SPEC.md'), 'Requirement ID')
        require([r[0] for r in scopes] == [f'SCOPE-{i:03}' for i in range(104)],
                'scope traceability must cover SCOPE-000–103 exactly once in order')
        headings = dict(re.findall(r'^# (\d+)\. (.+)$', master, re.M))
        for i, row in enumerate(scopes):
            require(row[1] == f'§{i}' and row[2] == headings[str(i)], f'scope row {i} source mismatch')
            require(all(row), f'scope row {i} has empty cells')
        phase_rows = table(read('docs/PHASE_ACCEPTANCE_MATRIX.md'), 'Phase ID')
        phase_ids = [r[0] for r in phase_rows]
        require(phase_ids == [f'PHASE-{i:02}' for i in range(16)], 'phase IDs must be PHASE-00–15')
        require(all(all(row) for row in phase_rows), 'phase gate has empty cells')
        stats['phases'] = len(phase_ids)
        scenarios = table(read('docs/E2E_TEST_MATRIX.md'), 'Scenario ID')
        scenario_ids = [r[0] for r in scenarios]
        require(scenario_ids == [f'E2E-{i:03}' for i in range(1, len(scenarios) + 1)],
                'E2E IDs must be unique and sequential')
        expected_aliases = set(re.findall(r'^([A-Z]+-\d{3}) ', section(master, 67), re.M))
        actual_aliases = []
        for r in scenarios:
            require(all(r), f'{r[0]} has empty scenario contract')
            require(r[2] in phase_ids, f'{r[0]} references unknown phase {r[2]}')
            actual_aliases += re.findall(r'\b[A-Z]+-\d{3}\b', r[1])
        require(expected_aliases <= set(actual_aliases),
                f'missing master scenario aliases: {sorted(expected_aliases - set(actual_aliases))}')
        unique(actual_aliases, 'scenario aliases')
        stats['e2e_scenarios'] = len(scenarios)
        stats['master_scenarios'] = len(expected_aliases)
        reqs = table(read('docs/phases/PHASE_00_REQUIREMENTS.md'), 'Requirement ID')
        require([r[0] for r in reqs] == [f'P0-{i:03}' for i in range(1, 15)],
                'Phase 0 requirements must be P0-001–014')
        checks = table(read('docs/phases/PHASE_00_TEST_MATRIX.md'), 'Check ID')
        require([r[0] for r in checks] == [f'DOC-{i:03}' for i in range(1, 9)],
                'Phase 0 checks must be DOC-001–008')
        for label, path, header in [('risks', 'docs/PROJECT_RISK_REGISTER.md', 'Risk ID'),
                                     ('threats', 'docs/THREAT_MODEL.md', 'Threat ID')]:
            rows = table(read(path), header)
            unique([r[0] for r in rows], label)
            require(all(all(r) for r in rows), f'{label} have empty contract cells')
            stats[label] = len(rows)

    for name, check in [('source/files', source_and_files), ('links', links),
                        ('catalogs', catalogs), ('lifecycle', lifecycle), ('traceability', traceability)]:
        run(name, check)
    return errors, stats


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    errors, stats = validate(args.root)
    for key, value in stats.items():
        print(f'{key}: {value}')
    if errors:
        for message in errors:
            print('FAIL: ' + message, file=sys.stderr)
        print(f'Phase 0 document validation: FAIL ({len(errors)} findings)')
        return 1
    print('Phase 0 document validation: PASS')
    print('Scope: document structure/coverage only; runtime, security, legal and deployment evidence are separate.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
