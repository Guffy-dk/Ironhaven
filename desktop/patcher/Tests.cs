using System;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Http;
using System.Web.Script.Serialization;

internal static class PatcherTests
{
    private static void Require(bool condition, string problem)
    {
        if (!condition) throw new Exception(problem);
    }

    private static GameRelease WriteRelease(string archive, string tag, string entry)
    {
        using (var zip = ZipFile.Open(archive, ZipArchiveMode.Create))
        using (var writer = new StreamWriter(zip.CreateEntry(entry).Open())) writer.Write("test executable");
        var json = new JavaScriptSerializer().Serialize(new {
            tag_name = tag,
            draft = false,
            assets = new[] { new {
                name = GameRelease.AssetName,
                browser_download_url = GameRelease.Repository + "/releases/download/" + tag + "/" + GameRelease.AssetName,
                digest = GameUpdates.ArchiveDigest(archive),
                size = new FileInfo(archive).Length
            } }
        });
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
                if (args.Length == 1)
                {
                    ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                    http.DefaultRequestHeaders.UserAgent.ParseAdd("IronhavenPatcher/1.0");
                    var published = GameRelease.FromJson(updates.LatestReleaseJson().GetAwaiter().GetResult());
                    Require(published != null && published.Version.Equals(GameRelease.ParseTag(args[0])), "Unexpected latest Windows release.");
                    updates.Install(published, new Progress<int>()).GetAwaiter().GetResult();
                    Require(published.Version.Equals(updates.LatestInstalled()), "The published Windows game was not installed.");
                    Console.WriteLine("Installed and verified GitHub release " + published.Version + ".");
                    return;
                }
                Require(updates.LatestInstalled() == null, "An empty install was not detected.");
                Require(GameRelease.ParseTag("v../0.1") == null, "Unsafe release tag accepted.");
                Require(GameRelease.FromJson("{\"tag_name\":\"v0.7.0\",\"assets\":[]}") == null, "Non-Windows release accepted.");
                var archive = Path.Combine(root, "valid.zip");
                var first = WriteRelease(archive, "v0.8.1", "Ironhaven/Ironhaven.exe");
                updates.InstallArchive(first, archive, Path.Combine(root, "stage1"));
                Require(updates.LatestInstalled().Equals(first.Version), "The installed game was not detected.");
                var secondArchive = Path.Combine(root, "next.zip");
                var second = WriteRelease(secondArchive, "v0.8.2", "Ironhaven/Ironhaven.exe");
                string digest = second.Digest;
                second.Digest = first.Digest.Substring(0, first.Digest.Length - 1) + (first.Digest.EndsWith("0") ? "1" : "0");
                try { updates.InstallArchive(second, secondArchive, Path.Combine(root, "bad-hash")); throw new Exception("Hash mismatch accepted."); }
                catch (InvalidDataException) { }
                Require(updates.LatestInstalled().Equals(first.Version), "An invalid update changed the active game.");
                second.Digest = digest;
                updates.InstallArchive(second, secondArchive, Path.Combine(root, "stage2"));
                Require(updates.LatestInstalled().Equals(second.Version), "The latest version was not selected.");
                Require(File.Exists(updates.GamePath(first.Version)), "Installing the latest version removed a working version.");
                var outsideArchive = Path.Combine(root, "escape.zip");
                var outside = WriteRelease(outsideArchive, "v0.8.3", "Ironhaven/../../escape.exe");
                try { updates.InstallArchive(outside, outsideArchive, Path.Combine(root, "bad-path")); throw new Exception("Unsafe zip entry accepted."); }
                catch (InvalidDataException) { }
                Require(!File.Exists(Path.Combine(root,"escape.exe")), "Archive escaped its destination.");
            }
            Console.WriteLine("Patcher tests passed.");
        }
        finally { Directory.Delete(root, true); }
    }
}
