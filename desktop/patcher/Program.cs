using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Windows.Forms;

internal sealed class Patcher : Form
{
    private readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromMinutes(3) };
    private GameUpdates updates;
    private string installBase;
    private readonly Button channelSwitch = new Button { Text = "Godot preview ›" };
    private readonly Label installed = new Label();
    private readonly Label status = new Label();
    private readonly ProgressBar progress = new ProgressBar();
    private readonly Button check = new Button { Text = "Check for updates" };
    private readonly Button install = new Button { Text = "Install latest" };
    private readonly Button play = new Button { Text = "Play Ironhaven" };
    private Version installedVersion;
    private GameRelease release;
    private bool busy;

    [STAThread]
    private static void Main()
    {
        ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new Patcher());
    }

    internal Patcher()
    {
        Text = "Ironhaven Patcher";
        ClientSize = new Size(490, 245);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        Font = new Font("Segoe UI", 10F);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(19, 37, 41);
        ForeColor = Color.FromArgb(229, 235, 222);

        var title = new Label { Text = "IRONHAVEN", Font = new Font("Segoe UI", 22F, FontStyle.Bold), ForeColor = Color.FromArgb(238, 185, 110) };
        title.SetBounds(22, 12, 446, 43);
        installed.SetBounds(24, 62, 442, 23);
        status.SetBounds(24, 94, 442, 57);
        progress.SetBounds(24, 158, 442, 8);
        check.SetBounds(24, 184, 145, 38);
        install.SetBounds(177, 184, 135, 38);
        play.SetBounds(320, 184, 146, 38);
        foreach (var button in new[] { check, install, play })
        {
            button.BackColor = Color.FromArgb(38, 65, 67);
            button.FlatStyle = FlatStyle.Flat;
        }
        play.BackColor = Color.FromArgb(238, 185, 110);
        play.ForeColor = Color.FromArgb(16, 30, 33);
        channelSwitch.SetBounds(326, 20, 140, 30);
        channelSwitch.BackColor = Color.FromArgb(38, 65, 67);
        channelSwitch.FlatStyle = FlatStyle.Flat;
        Controls.AddRange(new Control[] { title, channelSwitch, installed, status, progress, check, install, play });

        http.DefaultRequestHeaders.UserAgent.ParseAdd("IronhavenPatcher/1.0");
        installBase = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "IronhavenPatcher");
        updates = new GameUpdates(Path.Combine(installBase, ReleaseChannel.Game.Folder), http);
        channelSwitch.Click += (sender, args) => SwitchChannel();
        Shown += (sender, args) => Check();
        check.Click += (sender, args) => Check();
        install.Click += (sender, args) => Install();
        play.Click += (sender, args) => Play();
        FormClosing += (sender, args) => { if (busy) args.Cancel = true; };
        RefreshButtons();
    }

    // The Godot preview installs and plays beside the game; switching never touches the other install.
    private void SwitchChannel()
    {
        if (busy) return;
        var next = updates.Channel == ReleaseChannel.Game ? ReleaseChannel.Preview : ReleaseChannel.Game;
        updates = new GameUpdates(Path.Combine(installBase, next.Folder), http, next);
        channelSwitch.Text = next == ReleaseChannel.Game ? "Godot preview ›" : "‹ Back to the game";
        install.Text = next == ReleaseChannel.Game ? "Install latest" : "Install preview";
        play.Text = next == ReleaseChannel.Game ? "Play Ironhaven" : "Play preview";
        release = null;
        RefreshButtons();
        Check();
    }

    private string Edition { get { return updates.Channel == ReleaseChannel.Game ? "Windows build" : "Godot preview"; } }

    private void RefreshButtons()
    {
        installedVersion = updates.LatestInstalled();
        installed.Text = installedVersion == null ? (updates.Channel == ReleaseChannel.Game ? "No game version installed" : "No Godot preview installed") : "Installed · " + installedVersion;
        check.Enabled = !busy;
        channelSwitch.Enabled = !busy;
        install.Enabled = !busy && release != null && (installedVersion == null || release.Version.CompareTo(installedVersion) > 0);
        play.Enabled = installedVersion != null;
    }

    private async void Check()
    {
        busy = true;
        release = null;
        RefreshButtons();
        status.Text = "Checking GitHub for the latest " + Edition + "…";
        try
        {
            release = GameRelease.FromJson(await updates.LatestReleaseJson());
            status.Text = installedVersion != null && release.Version.CompareTo(installedVersion) <= 0 ? "You have the latest " + Edition + "." :
                "Version " + release.Version + " is ready to install (" + (release.Size / 1048576.0).ToString("0") + " MB).";
        }
        catch (Exception error) { status.Text = "Could not check for updates. " + error.Message; }
        finally { busy = false; RefreshButtons(); }
    }

    private async void Install()
    {
        busy = true;
        progress.Value = 0;
        RefreshButtons();
        status.Text = "Downloading " + release.Version + "…";
        try
        {
            await updates.Install(release, new Progress<int>(value =>
            {
                progress.Value = value;
                if (value == 100) status.Text = "Verifying and unpacking " + release.Version + "…";
            }));
            status.Text = "Version " + release.Version + " is installed. Close any open game window before starting the update.";
        }
        catch (Exception error) { status.Text = "Could not install. " + error.Message; }
        finally { busy = false; RefreshButtons(); }
    }

    private void Play()
    {
        string executable = updates.GamePath(installedVersion);
        try { Process.Start(PatcherPlatform.Launch(executable)); }
        catch (Exception error) { status.Text = "Could not start Ironhaven. " + error.Message; }
    }
}
