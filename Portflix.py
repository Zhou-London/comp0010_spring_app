from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Tuple


# Base directory can be adjusted if repository layout changes.
BASE_DIR = Path(__file__).resolve().parent


@dataclass
class ConfigPaths:
    frontend: Path
    backend: Path


DEFAULT_PATHS = ConfigPaths(
    frontend=BASE_DIR / "src/main/resources/static/frontend/vite.config.ts",
    backend=BASE_DIR / "src/main/resources/application.properties",
)


def prompt_for_port(name: str) -> int:
    while True:
        user_input = input(f"Enter the {name} port: ").strip()
        if user_input.isdigit():
            port = int(user_input)
            if 1 <= port <= 65535:
                return port
        print("Please enter a valid port number between 1 and 65535.")


def update_application_properties(path: Path, backend_port: int) -> bool:
    original = path.read_text()
    pattern = re.compile(r"^(server\.port=)(.+)$", flags=re.MULTILINE)
    replacement = rf"\g<1>{backend_port}"
    updated, count = pattern.subn(replacement, original, count=1)

    if count == 0:
        if not updated.endswith("\n"):
            updated += "\n"
        updated += f"server.port={backend_port}\n"

    if updated != original:
        path.write_text(updated)
        return True
    return False


def update_vite_config(path: Path, frontend_port: int, backend_port: int) -> bool:
    original = path.read_text()
    updated = original

    updated, frontend_count = re.subn(
        r"(port:\s*)\d+",
        rf"\g<1>{frontend_port}",
        updated,
        count=1,
    )

    updated, backend_count = re.subn(
        r"(target:\s*['\"]http://localhost:)\d+(['\"])",
        rf"\g<1>{backend_port}\2",
        updated,
        count=1,
    )

    if updated != original:
        path.write_text(updated)
        return True

    return frontend_count > 0 or backend_count > 0


def configure_ports(paths: ConfigPaths, frontend_port: int, backend_port: int) -> Tuple[bool, bool]:
    os.chdir(BASE_DIR)
    frontend_changed = update_vite_config(paths.frontend, frontend_port, backend_port)
    backend_changed = update_application_properties(paths.backend, backend_port)
    return frontend_changed, backend_changed


def main() -> int:
    print(f"Working directory: {BASE_DIR}")

    frontend_port = prompt_for_port("frontend")
    backend_port = prompt_for_port("backend")

    try:
        frontend_changed, backend_changed = configure_ports(DEFAULT_PATHS, frontend_port, backend_port)
    except FileNotFoundError as exc:
        print(f"Configuration file not found: {exc}")
        return 1

    print("Frontend configuration updated." if frontend_changed else "Frontend configuration already matched the requested port.")
    print("Backend configuration updated." if backend_changed else "Backend configuration already matched the requested port.")
    print("Port configuration completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
