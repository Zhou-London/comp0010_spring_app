from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path


# Base directory can be adjusted if repository layout changes.
BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config" / "portflix.json"


@dataclass
class ConfigPaths:
    frontend: Path
    backend: Path

    @classmethod
    def from_dict(cls, data: dict) -> "ConfigPaths":
        try:
            frontend_path = cls._resolve_path(data["frontend"])
            backend_path = cls._resolve_path(data["backend"])
        except KeyError as exc:  # pragma: no cover - defensive guard for missing keys
            raise ValueError("Configuration file must contain 'frontend' and 'backend' keys.") from exc

        return cls(frontend=frontend_path, backend=backend_path)

    @staticmethod
    def _resolve_path(path_str: str) -> Path:
        path = Path(path_str)
        if not path.is_absolute():
            path = BASE_DIR / path
        return path.resolve()


class PortflixConfigLoader:
    """Load and validate configuration paths from JSON."""

    def __init__(self, config_file: Path = CONFIG_PATH):
        self.config_file = config_file

    def load(self) -> ConfigPaths:
        if not self.config_file.exists():
            raise FileNotFoundError(f"Config file not found: {self.config_file}")

        raw_data = json.loads(self.config_file.read_text())
        if not isinstance(raw_data, dict):
            raise ValueError("Configuration file must contain a JSON object with path settings.")

        return ConfigPaths.from_dict(raw_data)


class PortFileUpdater:
    """Apply port updates to frontend and backend configuration files."""

    @staticmethod
    def update_backend_properties(path: Path, backend_port: int) -> bool:
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

    @staticmethod
    def update_frontend_config(path: Path, frontend_port: int, backend_port: int) -> bool:
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


class PortflixCLI:
    """Interactive command line interface for configuring ports."""

    def __init__(self, config_loader: PortflixConfigLoader, updater: PortFileUpdater):
        self.config_loader = config_loader
        self.updater = updater

    @staticmethod
    def prompt_for_port(name: str) -> int:
        while True:
            user_input = input(f"Enter the {name} port (1-65535): \n> ").strip()
            if user_input.isdigit():
                port = int(user_input)
                if 1 <= port <= 65535:
                    return port
            print("Invalid entry. Please provide a numeric port between 1 and 65535.\n")

    def run(self) -> int:
        print("\n=== Portflix Configuration ===")
        print(f"Base directory: {BASE_DIR}")
        print(f"Loading configuration from: {self.config_loader.config_file}\n")

        try:
            paths = self.config_loader.load()
        except (FileNotFoundError, ValueError) as exc:
            print(f"Unable to load configuration: {exc}")
            return 1

        print("Resolved paths:")
        print(f"  Frontend: {paths.frontend}")
        print(f"  Backend : {paths.backend}\n")

        frontend_port = self.prompt_for_port("frontend")
        backend_port = self.prompt_for_port("backend")

        try:
            frontend_changed = self.updater.update_frontend_config(paths.frontend, frontend_port, backend_port)
            backend_changed = self.updater.update_backend_properties(paths.backend, backend_port)
        except FileNotFoundError as exc:
            print(f"Configuration file not found: {exc}")
            return 1

        print("\nSummary:")
        print("  Frontend configuration updated." if frontend_changed else "  Frontend configuration already matched the requested port.")
        print("  Backend configuration updated." if backend_changed else "  Backend configuration already matched the requested port.")
        print("\nPort configuration completed. Happy coding!")
        return 0


def main() -> int:
    cli = PortflixCLI(PortflixConfigLoader(), PortFileUpdater())
    return cli.run()


if __name__ == "__main__":
    raise SystemExit(main())
