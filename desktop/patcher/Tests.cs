using System;
using System.IO;
using System.Net;
using System.Net.Http;

internal static class PatcherTests
{
    private static void Require(bool condition, string problem)
    {
        if (!condition) throw new Exception(problem);
    }

    private static GameRelease WriteRelease(string archive, string tag, string entry)
    {
        PatcherPlatform.WriteTestArchive(archive, entry);
        var json = "{\"tag\":\"" + tag + "\",\"digest\":\"" + GameUpdates.ArchiveDigest(archive) +
            "\",\"size\":" + new FileInfo(archive).Length + "}";
        return GameRelease.FromJson(json);
    }

    private static void Main(string[] args)
    {
        string root = Path.Combine(Path.GetTempPath(), "ironhaven-patcher-test-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        try
        {
            using (var http = new HttpClient())
            {
                var updates = new GameUpdates(Path.Combine(root, "versions"), http);
                if (args.Length == 3 && args[0] == "--local")
                {
                    // Installs a locally built package exactly as a download would be installed.
                    var local = GameRelease.FromJson(File.ReadAllText(args[2]));
                    updates.InstallArchive(local, args[1], Path.Combine(root, "local"));
                    Require(local.Version.Equals(updates.LatestInstalled()), "The local package was not installed.");
                    Console.WriteLine("Installed local package " + local.Version + " to " + updates.GamePath(local.Version));
                    root = null;
                    return;
                }
                if (args.Length >= 1)
                {
                    ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                    http.DefaultRequestHeaders.UserAgent.ParseAdd("IronhavenPatcher/1.0");
                    var channel = Array.IndexOf(args, "--preview") >= 0 ? ReleaseChannel.Preview : ReleaseChannel.Game;
                    if (channel == ReleaseChannel.Preview) updates = new GameUpdates(Path.Combine(root, "previews"), http, channel);
                    Require(GameRelease.ParseTag(args[0], channel) != null, "Invalid live release tag.");
                    bool exact = Array.IndexOf(args, "--exact") >= 0;
                    var metadata = exact
                        ? http.GetStringAsync(GameRelease.Repository + "/releases/download/" + args[0] + "/" + channel.ManifestName).GetAwaiter().GetResult()
                        : updates.LatestReleaseJson().GetAwaiter().GetResult();
                    var published = GameRelease.FromJson(metadata, channel);
                    Require(published != null && published.Version.Equals(GameRelease.ParseTag(args[0], channel)), "Unexpected " + PatcherPlatform.Name + " release.");
                    updates.Install(published, new Progress<int>()).GetAwaiter().GetResult();
                    Require(published.Version.Equals(updates.LatestInstalled()), "The published " + PatcherPlatform.Name + " game was not installed.");
                    Console.WriteLine("Installed and verified GitHub release " + published.Version + ".");
                    return;
                }
                Require(updates.LatestInstalled() == null, "An empty install was not detected.");
                Require(GameRelease.ParseTag("v../0.1") == null, "Unsafe release tag accepted.");
                try { GameRelease.FromJson("{\"tag\":\"v0.8.1\"}"); throw new Exception("Unverifiable release accepted."); }
                catch (InvalidDataException) { }
                var archive = Path.Combine(root, "valid" + PatcherPlatform.ArchiveExtension);
                var first = WriteRelease(archive, "v0.8.1", "Ironhaven/" + PatcherPlatform.Executable);
                updates.InstallArchive(first, archive, Path.Combine(root, "stage1"));
                Require(updates.LatestInstalled().Equals(first.Version), "The installed game was not detected.");
                var secondArchive = Path.Combine(root, "next" + PatcherPlatform.ArchiveExtension);
                var second = WriteRelease(secondArchive, "v0.8.2", "Ironhaven/" + PatcherPlatform.Executable);
                string digest = second.Digest;
                second.Digest = first.Digest.Substring(0, first.Digest.Length - 1) + (first.Digest.EndsWith("0") ? "1" : "0");
                try { updates.InstallArchive(second, secondArchive, Path.Combine(root, "bad-hash")); throw new Exception("Hash mismatch accepted."); }
                catch (InvalidDataException) { }
                Require(updates.LatestInstalled().Equals(first.Version), "An invalid update changed the active game.");
                second.Digest = digest;
                updates.InstallArchive(second, secondArchive, Path.Combine(root, "stage2"));
                Require(updates.LatestInstalled().Equals(second.Version), "The latest version was not selected.");
                Require(File.Exists(updates.GamePath(first.Version)), "Installing the latest version removed a working version.");
                var outsideArchive = Path.Combine(root, "escape" + PatcherPlatform.ArchiveExtension);
                var outside = WriteRelease(outsideArchive, "v0.8.3", "Ironhaven/../../escape.exe");
                try { updates.InstallArchive(outside, outsideArchive, Path.Combine(root, "bad-path")); throw new Exception("Unsafe zip entry accepted."); }
                catch (InvalidDataException) { }
                Require(!File.Exists(Path.Combine(root,"escape.exe")), "Archive escaped its destination.");
                // Preview channel: separate tags, assets and install folder; never mixed with the game.
                Require(GameRelease.ParseTag("preview-v0.1.0", ReleaseChannel.Preview) != null, "Preview tag rejected.");
                Require(GameRelease.ParseTag("v0.1.0", ReleaseChannel.Preview) == null, "A game tag was accepted as a preview.");
                Require(GameRelease.ParseTag("preview-v0.1.0") == null, "A preview tag was accepted as the game.");
                var previews = new GameUpdates(Path.Combine(root, "previews"), http, ReleaseChannel.Preview);
                var previewArchive = Path.Combine(root, "preview" + PatcherPlatform.ArchiveExtension);
                PatcherPlatform.WriteTestArchive(previewArchive, "Ironhaven/" + PatcherPlatform.Executable);
                var previewJson = "{\"tag\":\"preview-v0.1.0\",\"digest\":\"" + GameUpdates.ArchiveDigest(previewArchive) + "\",\"size\":" + new FileInfo(previewArchive).Length + "}";
                var preview = GameRelease.FromJson(previewJson, ReleaseChannel.Preview);
                Require(preview.Download.ToString().EndsWith("/releases/download/preview-v0.1.0/" + ReleaseChannel.Preview.AssetName), "Wrong preview download URL.");
                Require(ReleaseChannel.Preview.AssetName.StartsWith("Ironhaven-Preview-"), "Preview assets must not share the game's names.");
                previews.InstallArchive(preview, previewArchive, Path.Combine(root, "stage-preview"));
                Require(preview.Version.Equals(previews.LatestInstalled()), "The preview was not installed.");
                Require(previews.GamePath(preview.Version).Contains("preview-v0.1.0"), "The preview is not in its own folder.");
                Require(updates.LatestInstalled().Equals(second.Version), "Installing a preview changed the game install.");
#if IRONHAVEN_LINUX
                var mode = File.GetUnixFileMode(updates.GamePath(second.Version));
                Require((mode & UnixFileMode.UserExecute) != 0, "The Linux executable lost its execute permission.");
                Require((mode & UnixFileMode.SetUser) == 0, "A setuid bit from the download was kept.");
#endif
            }
            Console.WriteLine("Patcher tests passed.");
        }
        finally { if (root != null) Directory.Delete(root, true); }
    }
}
