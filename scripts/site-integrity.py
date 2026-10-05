#!/usr/bin/env python3
"""Fast integrity checks for VoltTech customer-facing core pages.

Standard library only. Designed for local use and GitHub Actions.
"""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
CORE_PAGES = (
    "index.html",
    "store.html",
    "product.html",
    "builder/index.html",
    "pc-repair-pretoria.html",
    "pc-upgrades-pretoria.html",
    "pc-performance-optimisation.html",
    "virus-malware-removal-pretoria.html",
    "windows-installation-pretoria.html",
    "signal-scan.html",
    "exposure-scan.html",
    "streaming-setup-south-africa.html",
    "stream-scan.html",
    "creator-hub-south-africa.html",
    "creator-register.html",
    "account.html",
    "quotes.html",
    "builds.html",
    "documents.html",
    "activity.html",
    "checkout.html",
    "order-status.html",
    "privacy-center.html",
    "legal.html",
    "static.html",
    "404.html",
)
CHECK_EXTENSIONS = {
    ".html", ".css", ".js", ".json", ".webmanifest",
    ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".woff2",
}
SKIP_SCHEMES = ("http:", "https:", "mailto:", "tel:", "data:", "blob:", "javascript:")


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.refs: list[tuple[str, str]] = []
        self.title_seen = False
        self.viewport_seen = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if data.get("id"):
            self.ids.append(data["id"])
        if tag == "title":
            self.title_seen = True
        if tag == "meta" and data.get("name", "").lower() == "viewport":
            self.viewport_seen = True
        if tag in {"a", "link"} and data.get("href"):
            self.refs.append(("href", data["href"]))
        if tag in {"script", "img", "source"} and data.get("src"):
            self.refs.append(("src", data["src"]))


def local_target(page: Path, raw: str) -> Path | None:
    value = raw.strip()
    if not value or value.startswith("#") or value.lower().startswith(SKIP_SCHEMES):
        return None

    path = unquote(urlsplit(value).path)
    if not path:
        return None

    target = ROOT / path.lstrip("/") if path.startswith("/") else page.parent / path
    target = Path(str(target))

    if path.endswith("/"):
        return target / "index.html"

    if target.suffix:
        return target if target.suffix.lower() in CHECK_EXTENSIONS else None

    candidates = (target, target.with_suffix(".html"), target / "index.html")
    return next((candidate for candidate in candidates if candidate.exists()), target)


def main() -> int:
    errors: list[str] = []

    for relative in CORE_PAGES:
        page = ROOT / relative
        if not page.exists():
            errors.append(f"{relative}: missing core page")
            continue

        parser = PageParser()
        parser.feed(page.read_text(encoding="utf-8"))

        if not parser.title_seen:
            errors.append(f"{relative}: missing <title>")
        if not parser.viewport_seen:
            errors.append(f"{relative}: missing viewport meta")

        seen: set[str] = set()
        duplicates: set[str] = set()
        for value in parser.ids:
            if value in seen:
                duplicates.add(value)
            seen.add(value)
        for value in sorted(duplicates):
            errors.append(f"{relative}: duplicate id #{value}")

        for _, raw in parser.refs:
            target = local_target(page, raw)
            if target is not None and not target.exists():
                errors.append(f"{relative}: broken local reference {raw!r}")

    manifest_path = ROOT / "manifest.webmanifest"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        for key in ("name", "short_name", "start_url", "theme_color", "icons"):
            if not manifest.get(key):
                errors.append(f"manifest.webmanifest: missing {key}")

    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    for url in (
        "https://volttechcomputerco.co.za/",
        "https://volttechcomputerco.co.za/store",
        "https://volttechcomputerco.co.za/builder/",
    ):
        if f"<loc>{url}</loc>" not in sitemap:
            errors.append(f"sitemap.xml: missing {url}")

    if errors:
        print("VoltTech integrity check FAILED")
        for error in errors:
            print(f" - {error}")
        return 1

    print(f"VoltTech integrity check passed for {len(CORE_PAGES)} core pages.")
    return 0


if __name__ == "__main__":
    sys.exit(main())