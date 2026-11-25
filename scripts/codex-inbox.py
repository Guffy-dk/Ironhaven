"""Select, reserve, and report Ironhaven handoffs in GitHub Actions."""

import argparse
import json
import os
import re
from pathlib import Path


INBOX = Path("claude-input")
OUTBOX = Path("codex-output")
HEADING = re.compile(r"^## (IH-[A-Za-z0-9-]{1,72})[ \t]*$", re.MULTILINE)


def sections(path):
    text = path.read_text(encoding="utf-8")
    headers = list(HEADING.finditer(text))
    return [
        (header[1], text[header.end():headers[index + 1].start() if index + 1 < len(headers) else len(text)].strip())
        for index, header in enumerate(headers)
    ]


def append_record(ids, status, run_url, result=""):
    with OUTBOX.open("a", encoding="utf-8") as outbox:
        for task_id in ids:
            outbox.write(f"\n## {task_id}\n\n{status} · [GitHub run]({run_url})\n")
        if result:
            # Indent model prose so any apparent headings are treated as output.
            outbox.write("\n" + "\n".join(f"> {line}" for line in result.splitlines()) + "\n")


def prepare(prompt_file, run_url):
    seen = {task_id for task_id, _ in sections(OUTBOX)}
    tasks = sections(INBOX)
    if len({task_id for task_id, _ in tasks}) != len(tasks):
        raise SystemExit("Duplicate instruction ID in claude-input.")
    pending = [(task_id, body) for task_id, body in tasks if task_id not in seen and body]
    ids = [task_id for task_id, _ in pending]
    if ids:
        instructions = "\n\n".join(f"## {task_id}\n\n{body}" for task_id, body in pending)
        prompt_file.write_text(
            "Handle the newly claimed Ironhaven handoffs below. Read AGENTS.md, "
            "SHARED_CONTEXT.md and relevant subsystem guidance before working. "
            "Check the stated assumptions against the current code and repository history. "
            "Preserve ongoing work and follow the owner's decisions. Implement in the "
            "checkout and run relevant checks. Update SHARED_CONTEXT.md when applicable. "
            "The workflow publishes your work to a review branch and writes codex-output. "
            "Leave the mailbox files, their workflow and helper alone. Keep the work within "
            "authorized project development. Do not access secrets, push, deploy, publish "
            "a release, or change external systems. Report each ID separately with "
            "the outcome, affected files and checks actually run. Explain any blockers.\n\n"
            + instructions + "\n",
            encoding="utf-8",
        )
        append_record(ids, "Claimed", run_url)
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
        output.write("ids=" + json.dumps(ids, separators=(",", ":")) + "\n")
        output.write("has_tasks=" + ("true" if ids else "false") + "\n")


def report(ids, outcome, run_url, result_file, review_url):
    if not isinstance(ids, list) or any(
        not isinstance(task_id, str) or not HEADING.fullmatch(f"## {task_id}")
        for task_id in ids
    ):
        raise SystemExit("Malformed claimed IDs.")
    result = result_file.read_text(encoding="utf-8", errors="replace")[:12000].strip() if result_file.is_file() else ""
    status = "Codex run completed." if outcome == "success" else "Codex run failed or was interrupted."
    if review_url:
        status += f" [Review changes]({review_url})"
    append_record(ids, status, run_url, result)


def main():
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="command", required=True)
    prepare_parser = commands.add_parser("prepare")
    prepare_parser.add_argument("prompt_file", type=Path)
    prepare_parser.add_argument("run_url")
    report_parser = commands.add_parser("report")
    report_parser.add_argument("ids", type=json.loads)
    report_parser.add_argument("outcome")
    report_parser.add_argument("run_url")
    report_parser.add_argument("result_file", type=Path)
    report_parser.add_argument("review_url")
    args = vars(parser.parse_args())
    command = args.pop("command")
    {"prepare": prepare, "report": report}[command](**args)


if __name__ == "__main__":
    main()
