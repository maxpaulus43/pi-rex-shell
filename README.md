# pi-rex-shell

Background shell jobs for pi, each in its own Rex pane. You can watch a job and type into it. The exit code and output come back to pi as a message.

## Install

From the repository root, run:

```sh
pi install "$PWD"
```

Only the pi that starts jobs needs this extension. It does not need to be installed on remote hosts.

## The `shell_job` tool

| Action | Parameters | What it does |
| --- | --- | --- |
| `start` | `command`, `title`, `placement` (`window`, `split`, `float`), `host`, `cwd`, `checkAfterSeconds` | Opens a named pane that runs `bash -c <command>`. Returns at once. |
| `status` | `id` (optional), `checkAfterSeconds` | Lists jobs, or shows one job's current output and can schedule a check-in. |
| `send` | `id`, `text`, `key` | Types text into a running job and/or presses a key (`enter`, `ctrl+c`). |
| `stop` | `id` | Closes the job's pane, which ends the command. |

Pi lists running jobs just above the input. In fullscreen mode, click a job to bring its terminal forward and focus it. Local jobs started from inside Rex default to named, minimized floating panes. Other jobs default to a new tab. Set `placement` to choose a different layout.

When a job ends:

- **Exit code 0:** the pane closes.
- **Any other exit code:** the pane stays open, so you can scroll it or run the command again there.

Either way, pi gets a message with the exit code and the last 32 KB of output.

## How it uses Rex

- **Start:** `session.new_window`, `session.new_split`, or `session.new_layer` creates a pane that runs the command, with `exit.on_completion: false`. `session.set_layer_state` minimizes floating panes when supported. Remote jobs go into a `pi-jobs` session on that host.
- **Finish:** one `rex wait <block> --json` process per job prints `{"exit_code": N}` when the command exits.
- **Output:** the block's `format` method returns the screen and scrollback as text.
- **Input:** `rex send` and `rex send-key`.
- **Reload:** jobs run in Rex, not in pi. Each job is saved in the pi session with `appendEntry`. After `/reload` or a resume, pi starts waiting on its running jobs again.
