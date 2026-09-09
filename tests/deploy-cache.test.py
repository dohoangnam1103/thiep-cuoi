#!/usr/bin/env python3
"""Behavioral deploy-cache checks using disposable source/artifact fixtures."""

import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "scripts/deploy-cache.py"
SPEC = importlib.util.spec_from_file_location("deploy_cache", SCRIPT)
CACHE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CACHE)


class DeployCacheTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.root = self.base / "source"
        self.cache = self.base / "cache"
        self.env = dict(os.environ, DEPLOY_BUILD_DB_HASH="a" * 64)
        self.package = {"name": "fixture", "dependencies": {"next": "16"}, "scripts": {
            "build": "next build", "prebuild": "node scripts/prepare-assets.mjs",
            "check:i18n": "tsx --test src/i18n/test.ts", "test:i18n:e2e": "playwright test",
            "deploy": "bash scripts/deploy-fast.sh"}}
        self.write("package.json", json.dumps(self.package))
        for path in ["package-lock.json", "node_modules/.package-lock.json", "next.config.ts",
                     "tsconfig.json", "messages/vi.json", "prisma/schema.prisma", "public/image.svg",
                     "playwright.config.ts", "playwright.i18n.config.ts", "tests/e2e/prepare-db.ts",
                     "src/app/page.tsx", "tests/e2e/fixtures/demo.ts", "scripts/prepare-assets.mjs"]:
            self.write(path, "fixture\n")
        self.artifact = self.base / "artifact"
        self.artifact.mkdir()
        (self.artifact / "server.js").write_text("production-build")
        (self.artifact / "static").mkdir()
        (self.artifact / "static/chunk.js").write_text("production-chunk")

    def write(self, path, contents):
        destination = self.root / path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(contents)

    def run_cli(self, *args, expected=0, env=None):
        result = subprocess.run(["python3", str(SCRIPT), *map(str, args)],
                                capture_output=True, text=True, env=env or self.env)
        self.assertEqual(result.returncode, expected, result.stderr)
        return result.stdout.strip()

    def key(self, kind="gate", env=None):
        return self.run_cli("key", kind, self.root, env=env)

    def test_gate_only_hits_after_success_receipt_and_input_change_misses(self):
        key = self.key()
        self.run_cli("gate-hit", self.cache, key, expected=1)
        self.run_cli("gate-save", self.cache, key)
        self.run_cli("gate-hit", self.cache, key)
        self.write("src/app/page.tsx", "changed application")
        changed = self.key()
        self.assertNotEqual(key, changed)
        self.run_cli("gate-hit", self.cache, changed, expected=1)

    def test_fixture_and_catalog_changes_invalidate_gate(self):
        original = self.key()
        self.write("tests/e2e/fixtures/demo.ts", "renamed-demo")
        fixture_changed = self.key()
        self.assertNotEqual(original, fixture_changed)
        self.write("messages/vi.json", "updated-catalog")
        self.assertNotEqual(fixture_changed, self.key())

    def test_deploy_only_change_and_generated_output_preserve_keys(self):
        gate, build = self.key(), self.key("build")
        self.write("scripts/deploy-fast.sh", "fixed ssh transport")
        self.write("scripts/deploy-cache.py", "fixed cache logging")
        self.write("scripts/prepare-deploy.sh", "fixed artifact packing")
        self.write("src/generated/prisma/client.ts", "regenerated")
        self.write("tests/e2e/.data/test.db", "changed test database")
        self.write("tests/e2e/.report/index.html", "changed report")
        self.package["scripts"]["deploy"] = "bash scripts/deploy-vps.sh"
        self.write("package.json", json.dumps(self.package))
        self.assertEqual(gate, self.key())
        self.assertEqual(build, self.key("build"))

    def test_dependency_lock_prebuild_hook_and_asset_changes_invalidate(self):
        for path in ("node_modules/.package-lock.json", "package-lock.json", "scripts/prepare-assets.mjs", "public/image.svg"):
            with self.subTest(path=path):
                gate, build = self.key(), self.key("build")
                self.write(path, "changed: " + path)
                self.assertNotEqual(gate, self.key())
                self.assertNotEqual(build, self.key("build"))

    def test_package_build_hook_changes_invalidate_but_test_only_does_not_change_build(self):
        gate, build = self.key(), self.key("build")
        self.write("tests/e2e/fixtures/demo.ts", "changed fixture")
        self.assertNotEqual(gate, self.key())
        self.assertEqual(build, self.key("build"))
        self.package["scripts"]["prebuild"] = "node scripts/another-prebuild.mjs"
        self.write("package.json", json.dumps(self.package))
        self.assertNotEqual(build, self.key("build"))

    def test_build_environment_and_database_change_invalidate_without_disclosing_values(self):
        build = self.key("build")
        self.write(".env.local", "NEXT_PUBLIC_SITE_URL=https://private-value.invalid\n")
        env_file_changed = self.key("build")
        self.assertNotEqual(build, env_file_changed)
        changed_env = dict(self.env, NEXT_PUBLIC_SITE_URL="https://second-private-value.invalid")
        self.assertNotEqual(env_file_changed, self.key("build", env=changed_env))
        self.assertNotEqual(env_file_changed, self.key("build", env=dict(self.env, DEPLOY_BUILD_DB_HASH="b" * 64)))
        self.assertEqual(env_file_changed, self.key("build", env=dict(self.env, NEXT_DEPLOYMENT_ID="new-id")))
        self.assertEqual(env_file_changed, self.key("build", env=dict(self.env, NODE_ENV="production")))
        self.assertRegex(env_file_changed, r"^[a-f0-9]{64}$")

    def test_missing_source_or_unvalidated_database_refuses_key(self):
        self.run_cli("key", "build", self.root, expected=2, env=dict(self.env, DEPLOY_BUILD_DB_HASH=""))
        (self.root / "src/app/page.tsx").unlink()
        self.run_cli("key", "gate", self.root, expected=2)

    def test_artifact_cache_preserves_original_id_and_detects_tampering(self):
        key = self.key("build")
        self.run_cli("build-hit", self.cache, key, expected=1)
        self.run_cli("build-save", self.cache, key, self.artifact, "20260909132535")
        self.run_cli("build-hit", self.cache, key)
        self.assertEqual("20260909132535", self.run_cli("build-id", self.cache, key))
        cached = Path(self.run_cli("build-path", self.cache, key))
        (cached / "static/chunk.js").write_text("tampered")
        self.run_cli("build-hit", self.cache, key, expected=1)
        self.assertEqual("production-chunk", (self.artifact / "static/chunk.js").read_text())

    def test_artifact_manifest_receipt_and_extra_file_tampering_are_misses(self):
        key = self.key("build")
        for target in ("manifest.json", "receipt.json", "artifact/unexpected.js"):
            with self.subTest(target=target):
                self.run_cli("build-save", self.cache, key, self.artifact, "release")
                (self.cache / "build" / key / target).write_text("tampered")
                self.run_cli("build-hit", self.cache, key, expected=1)

    def test_internal_symlink_preserved_broken_and_external_symlinks_rejected(self):
        key = self.key("build")
        link = self.artifact / "alias.js"
        link.symlink_to("server.js")
        self.run_cli("build-save", self.cache, key, self.artifact, "release")
        self.run_cli("build-hit", self.cache, key)
        self.assertTrue((self.cache / "build" / key / "artifact/alias.js").is_symlink())
        link.unlink()
        link.symlink_to("missing")
        self.run_cli("build-save", self.cache, key, self.artifact, "release", expected=2)
        self.run_cli("build-hit", self.cache, key)  # Failed save preserves previous entry.
        link.unlink()
        link.symlink_to(self.root / "package.json")
        self.run_cli("build-save", self.cache, key, self.artifact, "release", expected=2)

    def test_linux_runtime_dependency_link_is_preserved_without_mac_native_modules(self):
        alias = self.artifact / ".next/node_modules"
        alias.mkdir(parents=True)
        (alias / "better-sqlite3-hash").symlink_to("../../node_modules/better-sqlite3")
        key = self.key("build")
        self.run_cli("build-save", self.cache, key, self.artifact, "release")
        self.run_cli("build-hit", self.cache, key)

    def test_receipt_expiry_and_bounded_build_retention(self):
        key = self.key()
        self.run_cli("gate-save", self.cache, key)
        path = self.cache / "gate" / key / "receipt.json"
        receipt = json.loads(path.read_text())
        receipt["created"] -= CACHE.MAX_AGE["gate"] + 1
        path.write_text(json.dumps(receipt))
        self.run_cli("gate-hit", self.cache, key, expected=1)
        for index in range(3):
            self.run_cli("build-save", self.cache, str(index) * 64, self.artifact, "release-" + str(index))
        self.run_cli("build-hit", self.cache, "0" * 64, expected=1)
        self.run_cli("build-hit", self.cache, "1" * 64)
        self.run_cli("build-hit", self.cache, "2" * 64)


if __name__ == "__main__":
    unittest.main()
