# Claude handoffs to Codex

Claude appends a task with a unique ID in [claude-input](../claude-input) and pushes or merges it to `main`. GitHub starts the inbox workflow on a change to that file. It checks [codex-output](../codex-output) before starting Codex. A new ID is required for a follow-up or a retry. Code proposals go on a review branch.

## Connect a ChatGPT workspace

A managed ChatGPT workspace must have [Codex workload identity federation](https://developers.openai.com/api/docs/guides/workload-identity-federation#use-workload-identity-with-codex) enabled. A workspace admin creates a federation rule for a dedicated Codex principal in the [OpenAI Admin Portal](https://admin.openai.com/). Configure these exact GitHub OIDC claims where supported.

| Setting | Expected value |
| --- | --- |
| Issuer | `https://token.actions.githubusercontent.com` |
| Audience | `ironhaven-codex-inbox` |
| Subject | `repo:Guffy-dk/Ironhaven:ref:refs/heads/main` |
| Repository | `Guffy-dk/Ironhaven` |
| Ref | `refs/heads/main` |
| Workflow ref | `Guffy-dk/Ironhaven/.github/workflows/codex-inbox.yml@refs/heads/main` |

In the [repository Actions variables](https://github.com/Guffy-dk/Ironhaven/settings/variables/actions), set `OPENAI_FEDERATION_RULE_ID` to the rule ID. This ID identifies the rule. The signed GitHub token proves the run's identity and is renewed during long runs.

After saving the variable, select **Run workflow** on the [handoff workflow](https://github.com/Guffy-dk/Ironhaven/actions/workflows/codex-inbox.yml) to pick up pending instructions. A failed or interrupted run that already claimed an ID leaves its run link in the outbox. Requeue it with a new ID if needed. The test on a real push with an empty inbox exercises only the low-cost GitHub check. A valid federation rule and a new task are needed to exercise Codex itself.
