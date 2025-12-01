"""Lightweight Markdown formatter for AI outputs."""

import re
from typing import List, Optional


class MarkdownFormatter:
    """Normalize markdown spacing/headings/tables for AI-generated content."""

    def format(self, markdown: str, artifact_type: Optional[str] = None) -> str:
        if not markdown:
            return markdown
        lines = markdown.splitlines()
        lines = self._trim_trailing_space(lines)
        lines = self._normalize_headings(lines)
        lines = self._normalize_lists(lines)
        lines = self._normalize_numbered_lists(lines)
        lines = self._normalize_tables(lines)
        lines = self._ensure_table_dividers(lines)
        lines = self._enforce_number_sequences(lines)
        lines = self._ensure_blank_lines(lines)
        if artifact_type:
            lines = self._apply_vendor_rules(lines, artifact_type)
        formatted = "\n".join(lines).strip()
        return formatted + ("\n" if formatted else "")

    def _trim_trailing_space(self, lines: List[str]) -> List[str]:
        return [line.rstrip() for line in lines]

    def _normalize_headings(self, lines: List[str]) -> List[str]:
        normalized = []
        for line in lines:
            if re.match(r"^#+", line):
                line = re.sub(r"^(#+)\s*", r"\1 ", line)
            normalized.append(line)
        return normalized

    def _normalize_lists(self, lines: List[str]) -> List[str]:
        normalized = []
        for line in lines:
            if re.match(r"^\s*[-*]\s{2,}", line):
                line = re.sub(r"^\s*([-*])\s+", r"\1 ", line)
            normalized.append(line)
        return normalized

    def _normalize_numbered_lists(self, lines: List[str]) -> List[str]:
        normalized = []
        for line in lines:
            if re.match(r"^\s*\d+\.\s{2,}", line):
                line = re.sub(r"^\s*(\d+\.)\s+", r"\1 ", line)
            normalized.append(line)
        return normalized

    def _normalize_tables(self, lines: List[str]) -> List[str]:
        normalized = []
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("|") and not stripped.endswith("|"):
                line = line.rstrip() + " |"
            normalized.append(line)
        return normalized

    def _ensure_table_dividers(self, lines: List[str]) -> List[str]:
        """Guarantee tables have header dividers so Markdown renderers align columns."""
        result: List[str] = []
        for idx, line in enumerate(lines):
            result.append(line)
            stripped = line.strip()
            if not stripped.startswith("|") or self._is_table_divider(stripped):
                continue
            prev = result[-2].strip() if len(result) > 1 else ""
            next_line = lines[idx + 1].strip() if idx + 1 < len(lines) else ""
            looks_like_header = not prev.startswith("|")
            divider_missing = not self._is_table_divider(next_line)
            if looks_like_header and divider_missing:
                columns = [col for col in stripped.split("|") if col.strip()]
                col_count = max(1, len(columns))
                divider = "| " + " | ".join(["---"] * col_count) + " |"
                result.append(divider)
        return result

    def _is_table_divider(self, line: str) -> bool:
        return bool(re.fullmatch(r"\|\s*[:\-]+\s*(\|\s*[:\-]+\s*)+\|?", line))

    def _enforce_number_sequences(self, lines: List[str]) -> List[str]:
        """Ensure ordered lists increment sequentially per indentation level."""
        normalized: List[str] = []
        counters: dict[int, int] = {}
        for line in lines:
            match = re.match(r"^(\s*)(\d+)\.\s+(.*)", line)
            if match:
                indent = len(match.group(1))
                value = int(match.group(2))
                text = match.group(3)
                expected = counters.get(indent, 0) + 1
                if value != expected:
                    line = f"{' ' * indent}{expected}. {text}"
                counters[indent] = expected
                # Reset deeper indent counters
                for depth in list(counters.keys()):
                    if depth > indent:
                        counters.pop(depth, None)
            elif not line.strip():
                counters = {}
            normalized.append(line)
        return normalized

    def _ensure_blank_lines(self, lines: List[str]) -> List[str]:
        result: List[str] = []
        prev = ""
        for line in lines:
            if line.startswith("#") and prev and prev.strip():
                result.append("")
            result.append(line)
            prev = line
        return result

    def _apply_vendor_rules(self, lines: List[str], artifact_type: str) -> List[str]:
        lowered = artifact_type.lower()
        if "srs" in lowered:
            return self._ensure_srs_numbering(lines)
        if lowered.startswith("phase:"):
            return self._ensure_phase_table_rules(lines)
        return lines

    def _ensure_srs_numbering(self, lines: List[str]) -> List[str]:
        numbered: List[str] = []
        section_index = 1
        for line in lines:
            if line.startswith("##"):
                label = re.sub(r"^#+\s*", "", line).strip()
                if not re.match(r"^\d+\.", label):
                    line = re.sub(r"^##\s*", f"## {section_index}. ", line, count=1)
                section_index += 1
            numbered.append(line)
        return numbered

    def _ensure_phase_table_rules(self, lines: List[str]) -> List[str]:
        """Phase artifacts often contain tables; ensure header text is title case."""
        normalized: List[str] = []
        total = len(lines)
        for idx, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith("|") and not self._is_table_divider(stripped):
                next_line = lines[idx + 1].strip() if idx + 1 < total else ""
                if self._is_table_divider(next_line):
                    cols = [col.strip() for col in stripped.strip("|").split("|")]
                    title_cased = [col.title() if col.isupper() else col for col in cols]
                    line = "| " + " | ".join(title_cased) + " |"
            normalized.append(line)
        return normalized
