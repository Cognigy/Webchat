#!/usr/bin/env python3
"""Convert the first sheet of an .xlsx findings workbook to TSV on stdout.

Usage:
    python xlsx_to_tsv.py <path-to.xlsx> [sheet-name-or-index]

Emits tab-separated rows (blank cells preserved as empty fields) so the skill's
content-based parser can map columns whether or not a header row is present.

If openpyxl is unavailable, prints a clear message to stderr and exits 2 — the skill
then asks the user to export the sheet as CSV instead (which it can Read directly).
"""
import sys


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: xlsx_to_tsv.py <path-to.xlsx> [sheet]", file=sys.stderr)
        return 2

    path = sys.argv[1]
    sheet_arg = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        from openpyxl import load_workbook
    except ImportError:
        print(
            "openpyxl not installed. Install it (`pip install openpyxl`) or export the "
            "sheet to CSV and pass the .csv path instead.",
            file=sys.stderr,
        )
        return 2

    try:
        wb = load_workbook(path, read_only=True, data_only=True)
    except Exception as exc:  # noqa: BLE001 - surface any load error plainly
        print(f"failed to open {path}: {exc}", file=sys.stderr)
        return 1

    if sheet_arg is None:
        ws = wb.active
    elif sheet_arg.isdigit():
        ws = wb.worksheets[int(sheet_arg)]
    else:
        ws = wb[sheet_arg]

    for row in ws.iter_rows(values_only=True):
        cells = ["" if v is None else str(v).replace("\t", " ").replace("\n", " ").strip()
                 for v in row]
        # drop fully-empty trailing rows
        if any(cells):
            print("\t".join(cells))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
