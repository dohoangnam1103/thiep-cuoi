#!/usr/bin/env bash
# Works through stdin: bash -s -- <action> <absolute-app-dir> <release-id>.
set -euo pipefail
python3 - "$@" <<'PY'
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile


def fail(message):
    raise RuntimeError(message)


def durable_json(filename, value):
    with tempfile.NamedTemporaryFile(mode="w", dir=str(filename.parent), delete=False) as file:
        temporary = Path(file.name)
        json.dump(value, file)
        file.flush()
        os.fsync(file.fileno())
    os.replace(str(temporary), str(filename))
    directory = os.open(str(filename.parent), os.O_RDONLY)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


def current_target():
    if not current.exists() and not current.is_symlink():
        return None
    if current.is_symlink():
        target = current.resolve(strict=True)
        if target.parent != releases or not target.is_dir():
            fail("current must resolve to one release directory inside releases/.")
        return target
    if not current.is_dir():
        fail("current is not a directory.")
    return current


def switch_current(target):
    if target.parent != releases or not target.is_dir() or target.is_symlink():
        fail("Refusing to select an invalid release directory.")
    temporary = releases / (".current-" + release_id)
    if temporary.exists() or temporary.is_symlink():
        temporary.unlink()
    temporary.symlink_to(target.name)
    os.replace(str(temporary), str(current))
    directory = os.open(str(releases), os.O_RDONLY)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


def read_state(filename):
    if filename.is_symlink():
        fail("Release metadata cannot be a symlink.")
    with filename.open() as file:
        return json.load(file)


def previous_target(state):
    name = state.get("previous")
    if not isinstance(name, str) or not name or Path(name).name != name or name in (".", "..", "current"):
        fail("Invalid previous release in deployment metadata.")
    previous = releases / name
    if previous.is_symlink():
        fail("Previous release cannot be a symlink.")
    return previous


def owns_lock():
    try:
        return not lock.is_symlink() and (lock / "owner").read_text().strip() == release_id
    except FileNotFoundError:
        return False


def unlock():
    if owns_lock():
        (lock / "owner").unlink()
        lock.rmdir()


def cached_release(receipt):
    if not isinstance(receipt, dict) or receipt.get("version") != 1:
        fail("Invalid transfer cache receipt.")
    identifier = receipt.get("release_id")
    if (not isinstance(identifier, str)
            or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,95}", identifier)
            or ".." in identifier):
        fail("Invalid transfer cache release ID.")
    target = releases / ("candidate-" + identifier)
    if target.is_symlink() or not target.is_dir():
        fail("Cached transfer candidate is missing or invalid.")
    return target


def cached_target():
    try:
        pointer = read_state(transfer_metadata / ".current")
        target = cached_release(pointer)
        receipt = read_state(transfer_metadata / (pointer["release_id"] + ".json"))
        if cached_release(receipt) != target:
            fail("Transfer cache pointer does not match its ownership receipt.")
        return target
    except (OSError, ValueError, TypeError, KeyError, RuntimeError):
        # A stale/corrupt cache can never replace the authoritative current
        # release or authorize following a path outside releases/.
        return None


def cache():
    if not owns_lock():
        fail("Deployment does not own .deploy-lock; refusing transfer cache update.")
    if not candidate.is_dir() or candidate.is_symlink():
        fail("Candidate release is missing or invalid.")
    transfer_metadata.mkdir(exist_ok=True)
    receipt = {"version": 1, "release_id": release_id}
    # The caller invokes this only after source + artifact upload verification.
    # Store all metadata outside candidate: its files share hardlinks with the
    # active release or previous verified transfer and must not be overwritten.
    durable_json(transfer_metadata / (release_id + ".json"), receipt)
    durable_json(transfer_metadata / ".current", receipt)
    print("Verified candidate retained as the next transfer baseline.")


def stage():
    try:
        lock.mkdir()
    except FileExistsError:
        fail("Another deployment owns .deploy-lock; finish or inspect that deployment before retrying.")
    try:
        (lock / "owner").write_text(release_id + "\n")
        target = current_target()
        if target is None:
            fail("Production current release is missing.")
        source = cached_target() or target
        if (candidate.exists() or candidate.is_symlink() or state_file.exists()
                or staged_file.exists() or staged_file.is_symlink()):
            fail("Release ID already exists; use a new deployment ID.")
        staged_metadata.mkdir(exist_ok=True)
        temporary = Path(tempfile.mkdtemp(prefix=".candidate-" + release_id + "-", dir=str(releases)))
        try:
            # Start empty. rsync --checksum --link-dest may link a baseline
            # file only when both bytes and preserved attributes match. A
            # prelinked copy would let metadata-only updates chmod/chown the
            # still-active production inode, even without --inplace.
            durable_json(staged_file, {"version": 1, "release_id": release_id,
                                       "baseline": source.name})
            os.replace(str(temporary), str(candidate))
        finally:
            if temporary.exists():
                shutil.rmtree(str(temporary))
    except BaseException:
        unlock()
        raise
    print("Empty release staged; " + ("verified transfer cache" if source != target else "current")
          + " recorded as the transfer baseline. Production source is unchanged.")


def baseline():
    if not owns_lock():
        fail("Deployment does not own .deploy-lock; refusing baseline lookup.")
    if not candidate.is_dir() or candidate.is_symlink() or state_file.exists():
        fail("Transfer baseline is only available before candidate activation.")
    receipt = read_state(staged_file)
    if (not isinstance(receipt, dict) or receipt.get("version") != 1
            or receipt.get("release_id") != release_id):
        fail("Invalid staged release receipt.")
    name = receipt.get("baseline")
    if (not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,105}", name)
            or ".." in name):
        fail("Invalid staged transfer baseline.")
    source = releases / name
    if source == candidate or source.is_symlink() or not source.is_dir():
        fail("Staged transfer baseline is missing or invalid.")
    # stdout is deliberately only the absolute path, suitable for --link-dest.
    print(source)


def activate():
    if not owns_lock():
        fail("Deployment does not own .deploy-lock.")
    if not candidate.is_dir() or candidate.is_symlink():
        fail("Candidate release is missing or invalid.")
    target = current_target()
    if state_file.exists():
        state = read_state(state_file)
        previous = previous_target(state)
        if target == candidate:
            print("Release is already active.")
            return
        if target not in (previous, current, None):
            fail("Current release changed after this deployment prepared activation.")
    else:
        if target is None or target == candidate:
            fail("Cannot determine the previous production release.")
        previous = releases / ("previous-" + release_id) if target == current else target
        if target == current and (previous.exists() or previous.is_symlink()):
            fail("Legacy backup destination already exists.")
        state = {"previous": previous.name, "legacy": target == current}
        # Persist before moving legacy current so restore also handles interruption.
        durable_json(state_file, state)
    if target == current:
        if not state.get("legacy") or previous.exists():
            fail("Legacy source state is inconsistent; refusing activation.")
        os.replace(str(current), str(previous))
    if not previous.is_dir():
        fail("Previous release is unavailable; refusing activation.")
    switch_current(candidate)
    print("Release source activated; previous source retained.")


def restore():
    if not state_file.exists():
        print("No activation recorded; production source is unchanged.")
        return
    if not owns_lock():
        fail("Deployment does not own .deploy-lock.")
    state = read_state(state_file)
    previous = previous_target(state)
    target = current_target()
    if target == previous or (state.get("legacy") and target == current and not previous.exists()):
        print("Previous source is already selected.")
        return
    if target not in (candidate, None):
        fail("A different release is now active; refusing to replace it during rollback.")
    switch_current(previous)
    print("Previous production source restored.")


def cleanup():
    if not owns_lock():
        fail("Deployment does not own .deploy-lock; refusing cleanup.")
    target = current_target()
    if target is None:
        fail("Current release is missing; refusing to prune rollback source.")
    retained = {target}
    latest_cache = cached_target()
    if latest_cache is not None:
        retained.add(latest_cache)
    states = {}
    owned = {candidate}
    for filename in transfer_metadata.glob("*.json"):
        try:
            receipt = read_state(filename)
            cached = cached_release(receipt)
            if filename.stem != receipt["release_id"]:
                continue
            owned.add(cached)
        except (OSError, ValueError, TypeError, KeyError, RuntimeError):
            # Only a valid receipt naming its own existing candidate proves
            # ownership. Foreign paths and malformed records are never pruned.
            continue
    for filename in metadata.glob("*.json"):
        identifier = filename.stem
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,95}", identifier) or ".." in identifier:
            continue
        try:
            state = read_state(filename)
            if not isinstance(state, dict) or not isinstance(state.get("legacy"), bool):
                continue
            previous = previous_target(state)
        except (OSError, ValueError, RuntimeError):
            # Invalid or foreign metadata cannot authorize removal of a directory.
            continue
        states[identifier] = previous
        owned.add(releases / ("candidate-" + identifier))
        if state["legacy"] and previous.name == "previous-" + identifier:
            owned.add(previous)
    if target.name.startswith("candidate-"):
        active_id = target.name[len("candidate-"):]
        if active_id not in states or not states[active_id].is_dir():
            # Without the active release's metadata, its rollback source is unknown.
            # Only the current attempt's never-activated candidate is safe to remove.
            owned = {candidate} if not state_file.exists() else set()
            print("Source retention skipped: active rollback metadata is unavailable.")
        else:
            retained.add(states[active_id])
    # cleanup runs only after public verification or a completed rollback. Keep
    # current + its immediate predecessor + one verified transfer candidate,
    # not every historical state's reference. A smoke/retry can reuse its large
    # uploaded artifact without making that candidate the active release.
    # Tiny state receipts remain for audit and prove which directories we own.
    for obsolete in sorted(owned - retained):
        if obsolete.is_symlink():
            fail("Refusing to remove a release directory replaced by a symlink.")
        if obsolete.exists():
            if not obsolete.is_dir():
                fail("Refusing to remove an invalid release directory.")
            shutil.rmtree(str(obsolete))
    unlock()
    print("Deployment lock released; active, previous and latest transfer source retained.")


try:
    if len(sys.argv) != 4 or sys.argv[1] not in ("stage", "baseline", "cache", "activate", "restore", "cleanup"):
        fail("Usage: deploy-release.sh <stage|baseline|cache|activate|restore|cleanup> <absolute-app-dir> <release-id>")
    action, raw_app_dir, release_id = sys.argv[1:]
    app_dir = Path(raw_app_dir)
    if not app_dir.is_absolute() or ".." in app_dir.parts or not app_dir.is_dir():
        fail("App directory must be an existing absolute directory without traversal.")
    app_dir = app_dir.resolve(strict=True)
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,95}", release_id) or ".." in release_id:
        fail("Invalid deployment release ID.")
    releases = app_dir / "releases"
    metadata = app_dir / ".deploy-release-state"
    lock = app_dir / ".deploy-lock"
    if releases.is_symlink() or not releases.is_dir() or metadata.is_symlink():
        fail("Release and metadata directories must stay inside the app directory.")
    metadata.mkdir(exist_ok=True)
    transfer_metadata = metadata / "transfer-cache"
    staged_metadata = metadata / "staged"
    if transfer_metadata.is_symlink() or staged_metadata.is_symlink():
        fail("Transfer cache/staging metadata must stay inside the app directory.")
    current = releases / "current"
    candidate = releases / ("candidate-" + release_id)
    state_file = metadata / (release_id + ".json")
    staged_file = staged_metadata / (release_id + ".json")
    {"stage": stage, "baseline": baseline, "cache": cache, "activate": activate,
     "restore": restore, "cleanup": cleanup}[action]()
except Exception as error:
    print("Release operation failed: " + str(error), file=sys.stderr)
    sys.exit(1)
PY
