#!/usr/bin/env python3
"""VoltTech Step 9.1 repo-wide public HTML/link/metadata QA.

Read-only scanner. It deliberately ignores source templates/docs and tests the built/public
HTML surface that can actually be served from the repository.
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from dataclasses import dataclass, asdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "qa-results"
CANONICAL_HOST = "volttechcomputerco.co.za"
LEGACY_HOST = "volttechcomputerco.github.io"

EXCLUDED_PREFIXES = ("src/", "docs/")
EXCLUDED_FILES = {"googlea17b6d906d43fdfa.html"}
ASSET_TAGS = {"script": "src", "img": "src", "source": "src", "video": "src", "audio": "src"}


@dataclass
class Finding:
    level: str
    file: str
    rule: str
    detail: str


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.links: list[tuple[str, str, str]] = []
        self.canonical: list[str] = []
        self.og_url: list[str] = []
        self.title_depth = 0
        self.title_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k.lower(): (v or "") for k, v in attrs}
        tag = tag.lower()

        if a.get("id"):
            self.ids.append(a["id"])

        if tag == "a" and a.get("href"):
            self.links.append((tag, "href", a["href"]))
        elif tag == "link" and a.get("href"):
            self.links.append((tag, "href", a["href"]))
            rel = {x.lower() for x in a.get("rel", "").split()}
            if "canonical" in rel:
                self.canonical.append(a["href"])
        elif tag in ASSET_TAGS and a.get(ASSET_TAGS[tag]):
            self.links.append((tag, ASSET_TAGS[tag], a[ASSET_TAGS[tag]]))

        if tag in {"img", "source"} and a.get("srcset"):
            for candidate in a["srcset"].split(","):
                url = candidate.strip().split(" ", 1)[0]
                if url:
                    self.links.append((tag, "srcset", url))

        if tag == "meta" and a.get("property", "").lower() == "og:url" and a.get("content"):
            self.og_url.append(a["content"])

        if tag == "title":
            self.title_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title" and self.title_depth:
            self.title_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.title_depth:
            self.title_parts.append(data)


def is_public_html(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    return (
        path.suffix.lower() == ".html"
        and not rel.startswith(EXCLUDED_PREFIXES)
        and rel not in EXCLUDED_FILES
    )


def local_candidates(page: Path, raw: str) -> list[Path]:
    raw = raw.strip()
    if not raw or raw.startswith(("#", "//")):
        return []

    parts = urlsplit(raw)
    if parts.scheme.lower() in {"http", "https", "mailto", "tel", "data", "javascript", "blob"}:
        return []
    if parts.scheme:
        return []

    url_path = unquote(parts.path).strip()
    if not url_path:
        return []

    if url_path.startswith("/"):
        target = ROOT / url_path.lstrip("/")
    else:
        target = page.parent / url_path

    target = Path(str(target).replace("\\", "/"))
    candidates = [target]

    if url_path.endswith("/"):
        candidates.append(target / "index.html")
    elif not target.suffix:
        candidates.extend([Path(f"{target}.html"), target / "index.html"])

    return candidates


def host_of(url: str) -> str:
    try:
        return (urlsplit(url).hostname or "").lower()
    except ValueError:
        return ""


def main() -> int:
    findings: list[Finding] = []
    pages = sorted(p for p in ROOT.rglob("*.html") if is_public_html(p))
    checked_refs = 0

    for page in pages:
        rel = page.relative_to(ROOT).as_posix()
        try:
            source = page.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            findings.append(Finding("error", rel, "utf8", "HTML is not valid UTF-8"))
            continue

        parser = PageParser()
        try:
            parser.feed(source)
            parser.close()
        except Exception as exc:  # HTMLParser is forgiving; a crash is significant.
            findings.append(Finding("error", rel, "parse", f"HTML parser failed: {exc}"))
            continue

        duplicate_ids = [k for k, n in Counter(parser.ids).items() if n > 1]
        if duplicate_ids:
            findings.append(Finding(
                "warning",
                rel,
                "duplicate-id",
                f"Duplicate ids: {', '.join(sorted(duplicate_ids)[:12])}",
            ))

        title = "".join(parser.title_parts).strip()
        if not title:
            findings.append(Finding("warning", rel, "title", "No non-empty <title> found"))

        for value in parser.canonical:
            host = host_of(value)
            if host == LEGACY_HOST:
                findings.append(Finding("error", rel, "legacy-canonical", value))
            elif host and host != CANONICAL_HOST:
                findings.append(Finding("warning", rel, "canonical-host", value))

        for value in parser.og_url:
            host = host_of(value)
            if host == LEGACY_HOST:
                findings.append(Finding("error", rel, "legacy-og-url", value))

        if re.search(r"https://fonts\.(?:googleapis|gstatic)\.com", source, flags=re.I):
            findings.append(Finding("error", rel, "remote-google-font", "Remote Google Fonts reference remains"))

        for tag, attr, raw in parser.links:
            for candidate in local_candidates(page, raw):
                checked_refs += 1
                try:
                    resolved = candidate.resolve()
                    resolved.relative_to(ROOT.resolve())
                except Exception:
                    findings.append(Finding("error", rel, "path-escape", f"{tag}[{attr}] -> {raw}"))
                    break

                if resolved.exists():
                    break
            else:
                candidates = local_candidates(page, raw)
                if candidates:
                    findings.append(Finding("error", rel, "missing-local-target", f"{tag}[{attr}] -> {raw}"))

    errors = [f for f in findings if f.level == "error"]
    warnings = [f for f in findings if f.level == "warning"]

    OUT.mkdir(parents=True, exist_ok=True)
    report = {
        "step": "9.1",
        "scanner": "check-full-site.py",
        "status": "PASS" if not errors else "FAIL",
        "public_html_pages": len(pages),
        "local_references_checked": checked_refs,
        "errors": len(errors),
        "warnings": len(warnings),
        "findings": [asdict(f) for f in findings],
    }
    (OUT / "step-9.1-site-scan.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Step 9.1 repo-wide site scan",
        "",
        f"Overall: **{report['status']}**",
        f"Public HTML pages: {len(pages)}",
        f"Local references checked: {checked_refs}",
        f"Errors: {len(errors)}",
        f"Warnings: {len(warnings)}",
        "",
    ]
    if findings:
        lines += ["| Level | File | Rule | Detail |", "| --- | --- | --- | --- |"]
        for f in findings:
            detail = f.detail.replace("|", "\\|").replace("\n", " ")
            lines.append(f"| {f.level.upper()} | `{f.file}` | `{f.rule}` | {detail} |")
    else:
        lines.append("No findings.")
    lines.append("")
    (OUT / "step-9.1-site-scan.md").write_text("\n".join(lines), encoding="utf-8")

    print(
        f"{'PASS' if not errors else 'FAIL'}: repo-wide scan — "
        f"{len(pages)} public HTML pages, {checked_refs} local references, "
        f"{len(errors)} errors, {len(warnings)} warnings"
    )
    for f in errors[:30]:
        print(f"ERROR: {f.file}: {f.rule}: {f.detail}")
    if len(errors) > 30:
        print(f"... {len(errors) - 30} additional errors in qa-results/step-9.1-site-scan.json")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
