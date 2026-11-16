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
    private readonly GameUpdates updates;
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
        Controls.AddRange(new Control[] { title, installed, status, progress, check, install, play });

        http.DefaultRequestHeaders.UserAgent.ParseAdd("IronhavenPatcher/1.0");
        var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "IronhavenPatcher", "versions");
        updates = new GameUpdates(root, http);
        Shown += (sender, args) => Check();
        check.Click += (sender, args) => Check();
        install.Click += (sender, args) => Install();
        play.Click += (sender, args) => Play();
        FormClosing += (sender, args) => { if (busy) args.Cancel = true; };
        RefreshButtons();
    }

    private void RefreshButtons()
    {
        installedVersion = updates.LatestInstalled();
        installed.Text = installedVersion == null ? "No game version installed" : "Installed · " + installedVersion;
        check.Enabled = !busy;
        install.Enabled = !busy && release != null && (installedVersion == null || release.Version.CompareTo(installedVersion) > 0);
        play.Enabled = installedVersion != null;
    }

    private async void Check()
    {
        busy = true;
        release = null;
        RefreshButtons();
        status.Text = "Checking GitHub for the latest Windows build…";
        try
        {
            release = GameRelease.FromJson(await updates.LatestReleaseJson());
            status.Text = release == null ? "GitHub has no Windows build for the latest release." :
                installedVersion != null && release.Version.CompareTo(installedVersion) <= 0 ? "You have the latest Windows build." :
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
        try { Process.Start(new ProcessStartInfo(executable) { WorkingDirectory = Path.GetDirectoryName(executable) }); }
        catch (Exception error) { status.Text = "Could not start Ironhaven. " + error.Message; }
    }
}
