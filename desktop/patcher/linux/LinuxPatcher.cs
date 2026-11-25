using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Layout;
using Avalonia.Media;
using Avalonia.Themes.Fluent;
using Avalonia.Threading;

// Linux front end for the shared Ironhaven update logic (Updates.cs + PlatformLinux.cs).
// Same actions and colours as the Windows patcher: check, install latest, play.
internal sealed class PatcherApp : Application
{
    public override void Initialize()
    {
        Styles.Add(new FluentTheme());
        RequestedThemeVariant = Avalonia.Styling.ThemeVariant.Dark;
    }

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop) desktop.MainWindow = new PatcherWindow();
        base.OnFrameworkInitializationCompleted();
    }

    [STAThread]
    private static int Main(string[] args)
    {
        return AppBuilder.Configure<PatcherApp>().UsePlatformDetect().LogToTrace()
            .StartWithClassicDesktopLifetime(args);
    }
}

internal sealed class PatcherWindow : Window
{
    private static readonly IBrush Sea = new SolidColorBrush(Color.FromRgb(19, 37, 41));
    private static readonly IBrush Text = new SolidColorBrush(Color.FromRgb(229, 235, 222));
    private static readonly IBrush Accent = new SolidColorBrush(Color.FromRgb(238, 185, 110));
    private static readonly IBrush Panel = new SolidColorBrush(Color.FromRgb(38, 65, 67));
    private static readonly IBrush Ink = new SolidColorBrush(Color.FromRgb(16, 30, 33));

    private readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromMinutes(3) };
    private readonly GameUpdates updates;
    private readonly TextBlock installed = new TextBlock();
    private readonly TextBlock status = new TextBlock { TextWrapping = TextWrapping.Wrap, Height = 57 };
    private readonly ProgressBar progress = new ProgressBar { Minimum = 0, Maximum = 100, Height = 8, Foreground = Accent };
    private readonly Button check = new Button { Content = "Check for updates" };
    private readonly Button install = new Button { Content = "Install latest" };
    private readonly Button play = new Button { Content = "Play Ironhaven" };
    private Version installedVersion;
    private GameRelease release;
    private bool busy;

    internal PatcherWindow()
    {
        Title = "Ironhaven Patcher";
        Width = 490; Height = 260; CanResize = false;
        WindowStartupLocation = WindowStartupLocation.CenterScreen;
        Background = Sea; Foreground = Text;

        foreach (var button in new[] { check, install, play })
        {
            button.Background = Panel; button.Foreground = Text;
            button.HorizontalAlignment = HorizontalAlignment.Stretch; button.HorizontalContentAlignment = HorizontalAlignment.Center;
            button.Height = 38;
        }
        play.Background = Accent; play.Foreground = Ink;
        var buttons = new Grid { ColumnDefinitions = new ColumnDefinitions("*,8,*,8,*") };
        Grid.SetColumn(check, 0); Grid.SetColumn(install, 2); Grid.SetColumn(play, 4);
        buttons.Children.Add(check); buttons.Children.Add(install); buttons.Children.Add(play);
        Content = new StackPanel
        {
            Margin = new Thickness(22, 12), Spacing = 8,
            Children =
            {
                new TextBlock { Text = "IRONHAVEN", FontSize = 28, FontWeight = FontWeight.Bold, Foreground = Accent },
                installed, status, progress, buttons
            }
        };

        http.DefaultRequestHeaders.UserAgent.ParseAdd("IronhavenPatcher/1.0");
        var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "IronhavenPatcher", "versions");
        updates = new GameUpdates(root, http);
        Opened += async (sender, args) => await Check();
        check.Click += async (sender, args) => await Check();
        install.Click += async (sender, args) => await Install();
        play.Click += (sender, args) => Play();
        Closing += (sender, args) => { if (busy) args.Cancel = true; };
        RefreshButtons();
    }

    private void RefreshButtons()
    {
        installedVersion = updates.LatestInstalled();
        installed.Text = installedVersion == null ? "No game version installed" : "Installed · " + installedVersion;
        check.IsEnabled = !busy;
        install.IsEnabled = !busy && release != null && (installedVersion == null || release.Version.CompareTo(installedVersion) > 0);
        play.IsEnabled = installedVersion != null;
    }

    private async Task Check()
    {
        busy = true;
        release = null;
        RefreshButtons();
        status.Text = "Checking GitHub for the latest Linux build…";
        try
        {
            release = GameRelease.FromJson(await updates.LatestReleaseJson());
            status.Text = installedVersion != null && release.Version.CompareTo(installedVersion) <= 0 ? "You have the latest Linux build." :
                "Version " + release.Version + " is ready to install (" + (release.Size / 1048576.0).ToString("0") + " MB).";
        }
        catch (HttpRequestException error) when (error.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            status.Text = "No Linux release has been published yet. Try again later.";
        }
        catch (Exception error) { status.Text = "Could not check for updates. " + error.Message; }
        finally { busy = false; RefreshButtons(); }
    }

    private async Task Install()
    {
        busy = true;
        progress.Value = 0;
        RefreshButtons();
        status.Text = "Downloading " + release.Version + "…";
        try
        {
            var target = release;
            await Task.Run(() => updates.Install(target, new Progress<int>(value => Dispatcher.UIThread.Post(() =>
            {
                progress.Value = value;
                if (value == 100) status.Text = "Verifying and unpacking " + target.Version + "…";
            }))));
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
