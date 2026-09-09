#!/usr/bin/env python3
"""Assembly-cache regression checks; Docker is a disposable local stub only."""

import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / "scripts/deploy-assembled-image-cache.py"
SPEC = importlib.util.spec_from_file_location("assembled_image_cache", SCRIPT)
CACHE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CACHE)
BASE_ID = "sha256:" + "b" * 64
IMAGE_ID = "sha256:" + "a" * 64


class AssembledImageCacheTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.source = self.root / "source"
        self.source.mkdir()
        self.artifact = self.root / "artifact"
        self.artifact.mkdir()
        self.cache = self.root / "cache"
        self.cache.mkdir()
        for name, content in {"Dockerfile.prebuilt": "FROM node:24-slim AS runner\n",
                              "package-lock.json": '{"lockfileVersion": 3}\n',
                              ".dockerignore": "node_modules\n",
                              ".npmrc": "audit=false\n"}.items():
            (self.source / name).write_text(content)
        for name in (".next", "static"):
            (self.artifact / name).mkdir()
        (self.artifact / "server.js").write_text("require('next')\n")
        (self.artifact / "package.deps.json").write_text('{"name":"fixture"}\n')
        (self.artifact / "static/chunk.js").write_text("const fixture = 1;\n")
        (self.artifact / ".next/build-manifest.json").write_text("{}\n")
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.docker_state = self.root / "docker-state.json"
        self.docker_calls = self.root / "docker-calls.jsonl"
        self.docker_state.write_text("{}")
        docker = self.bin / "docker"
        docker.write_text("""#!/usr/bin/env python3
import json
import os
from pathlib import Path
import sys
with Path(os.environ['ASSEMBLY_TEST_CALLS']).open('a') as stream:
    stream.write(json.dumps(sys.argv[1:]) + '\\n')
if sys.argv[1:3] != ['image', 'inspect'] or len(sys.argv) != 4:
    raise SystemExit('Unexpected Docker mutation or command')
state = json.loads(Path(os.environ['ASSEMBLY_TEST_STATE']).read_text())
result = state.get(sys.argv[3])
if result is None:
    raise SystemExit(1)
print(json.dumps(result))
""")
        docker.chmod(0o755)
        self.env = dict(os.environ, PATH=str(self.bin) + os.pathsep + os.environ.get("PATH", ""),
                        ASSEMBLY_TEST_STATE=str(self.docker_state),
                        ASSEMBLY_TEST_CALLS=str(self.docker_calls))

    def run_cli(self, *args, expected=0):
        result = subprocess.run(["python3", str(SCRIPT), *map(str, args)], env=self.env,
                                text=True, capture_output=True)
        self.assertEqual(expected, result.returncode, result.stderr)
        if expected:
            self.assertEqual("", result.stdout)
        return result.stdout.strip()

    def key(self, base=BASE_ID, platform="linux/amd64"):
        return self.run_cli("key", self.artifact, self.source, base, platform)

    def image(self, key, image_id=IMAGE_ID, platform="linux/amd64", **overrides):
        parts = platform.split("/")
        image = {"Id": image_id, "Os": parts[0], "Architecture": parts[1],
                 "Config": {"Labels": {CACHE.LABEL: key}}}
        if len(parts) == 3:
            image["Variant"] = parts[2]
        image.update(overrides)
        state = json.loads(self.docker_state.read_text())
        state[image_id] = [image]
        self.docker_state.write_text(json.dumps(state))

    def save(self, key, image_id=IMAGE_ID, platform="linux/amd64", expected=0):
        return self.run_cli("save", self.cache, key, image_id, platform, expected=expected)

    def receipt(self, key):
        return self.cache / (key + ".json")

    def change_receipt(self, receipt_key, **fields):
        receipt = json.loads(self.receipt(receipt_key).read_text())
        receipt.update(fields)
        self.receipt(receipt_key).write_text(json.dumps(receipt))

    def test_identical_inputs_have_same_key_without_docker_calls(self):
        key = self.key()
        self.assertRegex(key, r"^[a-f0-9]{64}$")
        self.assertEqual(key, self.key())
        self.assertFalse(self.docker_calls.exists())
        # Content identity is preserved across copies with new inodes/mtime.
        original = self.artifact / "server.js"
        temporary = self.artifact / "replacement"
        temporary.write_bytes(original.read_bytes())
        temporary.chmod(original.stat().st_mode)
        temporary.replace(original)
        self.assertEqual(key, self.key())

    def test_artifact_dockerfile_dependency_and_ignore_changes_invalidate(self):
        for root, name in ((self.artifact, "server.js"), (self.artifact, "static/chunk.js"),
                           (self.artifact, "package.deps.json"),
                           (self.source, "Dockerfile.prebuilt"),
                           (self.source, "package-lock.json"), (self.source, ".npmrc"),
                           (self.source, ".dockerignore")):
            with self.subTest(name=name):
                before = self.key()
                path = root / name
                path.write_bytes(path.read_bytes() + b"changed\n")
                self.assertNotEqual(before, self.key())
        before = self.key()
        (self.source / ".npmrc.production").write_text("strict-peer-deps=true\n")
        self.assertNotEqual(before, self.key())

    def test_specific_dockerignore_overrides_root_ignore(self):
        original = self.key()
        specific = self.source / "Dockerfile.prebuilt.dockerignore"
        specific.write_text("!package-lock.json\n")
        selected = self.key()
        self.assertNotEqual(original, selected)
        (self.source / ".dockerignore").write_text("irrelevant while overridden\n")
        self.assertEqual(selected, self.key())
        specific.write_text("changed effective ignore\n")
        self.assertNotEqual(selected, self.key())

    def test_base_id_platform_and_mode_changes_invalidate(self):
        key = self.key()
        self.assertNotEqual(key, self.key(base="sha256:" + "c" * 64))
        self.assertNotEqual(key, self.key(platform="linux/arm64"))
        (self.artifact / "server.js").chmod(0o755)
        self.assertNotEqual(key, self.key())

    def test_public_source_scripts_and_deploy_id_are_not_runner_inputs(self):
        key = self.key()
        for name in ("public/image.webp", "src/app/page.tsx", "scripts/deploy-fast.sh"):
            path = self.source / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("The existing artifact determines runner contents")
        self.assertEqual(key, self.key())

    def test_internal_and_runtime_symlinks_are_hashed_external_and_broken_refused(self):
        key = self.key()
        link = self.artifact / "alias.js"
        link.symlink_to("server.js")
        self.assertNotEqual(key, self.key())
        (self.artifact / ".next/node_modules").mkdir()
        (self.artifact / ".next/node_modules/sharp-hash").symlink_to("../../node_modules/sharp")
        self.key()
        link.unlink()
        link.symlink_to(self.source / "package-lock.json")
        self.run_cli("key", self.artifact, self.source, BASE_ID, "linux/amd64", expected=2)
        link.unlink()
        link.symlink_to("missing")
        self.run_cli("key", self.artifact, self.source, BASE_ID, "linux/amd64", expected=2)

    def test_missing_required_inputs_and_mutable_base_names_refused(self):
        self.run_cli("key", self.artifact, self.source, "node:24-slim", "linux/amd64", expected=2)
        self.run_cli("key", self.artifact, self.source, BASE_ID, "invalid platform", expected=2)
        for path in (self.artifact / "server.js", self.source / "Dockerfile.prebuilt"):
            content = path.read_bytes()
            path.unlink()
            self.run_cli("key", self.artifact, self.source, BASE_ID, "linux/amd64", expected=2)
            path.write_bytes(content)

    def test_changed_input_during_key_generation_refuses_key(self):
        actual = CACHE.artifact_records
        count = 0
        def change_after_first_read(root):
            nonlocal count
            result = actual(root)
            count += 1
            if count == 1:
                (root / "server.js").write_text("Changed concurrently")
            return result
        with patch.object(CACHE, "artifact_records", side_effect=change_after_first_read):
            with self.assertRaises(ValueError):
                CACHE.make_key(self.artifact, self.source, BASE_ID, "linux/amd64")

    def test_hit_requires_saved_success_and_only_inspects_immutable_id(self):
        key = self.key()
        self.image(key)
        self.run_cli("hit", self.cache, key, expected=1)
        self.assertFalse(self.docker_calls.exists())
        self.save(key)
        self.assertEqual(IMAGE_ID, self.run_cli("hit", self.cache, key))
        calls = [json.loads(line) for line in self.docker_calls.read_text().splitlines()]
        self.assertEqual([["image", "inspect", IMAGE_ID]] * 2, calls)

    def test_absent_mislabeled_mismatched_id_and_platform_are_cache_misses(self):
        key = self.key()
        self.image(key)
        self.save(key)
        bad_images = [None, {"Config": {"Labels": {CACHE.LABEL: "f" * 64}}},
                      {"Config": {"Labels": None}}, {"Id": "sha256:" + "e" * 64},
                      {"Os": "windows"}, {"Architecture": "arm64"}, {"Variant": "v8"}]
        for changes in bad_images:
            with self.subTest(changes=changes):
                if changes is None:
                    self.docker_state.write_text("{}")
                else:
                    self.image(key, **changes)
                self.run_cli("hit", self.cache, key, expected=1)
                self.save(key, expected=2)

    def test_platform_variant_is_checked_exactly(self):
        key = self.key(platform="linux/arm64/v8")
        self.image(key, platform="linux/arm64/v8")
        self.save(key, platform="linux/arm64/v8")
        self.assertEqual(IMAGE_ID, self.run_cli("hit", self.cache, key))
        self.image(key, platform="linux/arm64")
        self.run_cli("hit", self.cache, key, expected=1)

    def test_invalid_receipts_and_expiry_are_misses(self):
        key = self.key()
        self.image(key)
        bad_fields = [{"version": -1}, {"key": "e" * 64},
                      {"created": time.time() - CACHE.MAX_AGE - 1},
                      {"created": time.time() + 120}, {"created": "tomorrow"},
                      {"created": True}, {"created": float("nan")},
                      {"image_id": "repo:mutable-tag"}, {"platform": "bad platform"}]
        for fields in bad_fields:
            with self.subTest(fields=fields):
                self.save(key)
                self.change_receipt(key, **fields)
                self.run_cli("hit", self.cache, key, expected=1)
        for contents in ("malformed", "[]", "null", "{}"):
            self.receipt(key).write_text(contents)
            self.run_cli("hit", self.cache, key, expected=1)

    def test_bad_docker_output_is_a_miss_and_never_saved(self):
        key = self.key()
        self.image(key)
        self.save(key)
        original = self.receipt(key).read_bytes()
        for result in ({}, [], [{"Config": None}], [{}, {}], [None]):
            self.docker_state.write_text(json.dumps({IMAGE_ID: result}))
            self.run_cli("hit", self.cache, key, expected=1)
            self.save(key, expected=2)
            self.assertEqual(original, self.receipt(key).read_bytes())

    def test_receipts_are_atomic_private_bounded_and_never_delete_images(self):
        foreign = self.cache / "foreign.json"
        foreign.write_text("unrelated")
        for index in range(5):
            key = str(index) * 64
            self.image(key)
            self.save(key)
            self.assertEqual(0o600, self.receipt(key).stat().st_mode & 0o777)
        self.assertFalse(self.receipt("0" * 64).exists())
        self.assertTrue(self.receipt("4" * 64).exists())
        self.assertEqual(4, len([path for path in self.cache.glob("*.json")
                                if CACHE.KEY_PATTERN.fullmatch(path.stem)]))
        self.assertTrue(foreign.exists())
        self.assertFalse(list(self.cache.glob(".pending-*")))
        calls = [json.loads(line) for line in self.docker_calls.read_text().splitlines()]
        self.assertTrue(all(call[:2] == ["image", "inspect"] for call in calls))

    def test_symlinked_receipt_is_not_trusted(self):
        key = self.key()
        self.image(key)
        self.save(key)
        outside = self.root / "outside-receipt.json"
        self.receipt(key).replace(outside)
        self.receipt(key).symlink_to(outside)
        self.run_cli("hit", self.cache, key, expected=1)


if __name__ == "__main__":
    unittest.main()
