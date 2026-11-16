using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

internal sealed class GameRelease
{
    internal const string AssetName = "Ironhaven-Windows-x64.zip";
    internal const string Repository = "https://github.com/Guffy-dk/Ironhaven";
    internal Version Version;
    internal Uri Download;
    internal string Digest;
    internal long Size;

    internal static Version ParseTag(string tag)
    {
        Version version;
        return tag != null && Regex.IsMatch(tag, @"\Av[0-9]+\.[0-9]+\.[0-9]+\z") &&
            Version.TryParse(tag.Substring(1), out version) && "v" + version == tag ? version : null;
    }

    internal static GameRelease FromJson(string json)
    {
        var data = new JavaScriptSerializer().Deserialize<ReleaseMetadata>(json);
        if (data == null) return null;
        var version = ParseTag(data.tag_name);
        if (version == null || data.draft || data.assets == null) return null;

        var expected = Repository + "/releases/download/v" + version + "/" + AssetName;
        var asset = data.assets.FirstOrDefault(item => item.name == AssetName);
        if (asset == null) return null;
        if (asset.browser_download_url != expected || asset.size <= 0 ||
            !Regex.IsMatch(asset.digest ?? "", @"\Asha256:[a-fA-F0-9]{64}\z"))
            throw new InvalidDataException("The Windows release is missing valid download verification metadata.");

        return new GameRelease { Version = version, Download = new Uri(expected), Digest = asset.digest, Size = asset.size };
    }

    public sealed class ReleaseMetadata
    {
        public string tag_name { get; set; }
        public bool draft { get; set; }
        public ReleaseAsset[] assets { get; set; }
    }

    public sealed class ReleaseAsset
    {
        public string name { get; set; }
        public string browser_download_url { get; set; }
        public string digest { get; set; }
        public long size { get; set; }
    }
}

internal sealed class GameUpdates
{
    private readonly string installRoot;
    private readonly HttpClient client;
    internal GameUpdates(string installRoot, HttpClient client)
    {
        this.installRoot = installRoot;
        this.client = client;
    }

    internal Task<string> LatestReleaseJson()
    {
        return client.GetStringAsync("https://api.github.com/repos/Guffy-dk/Ironhaven/releases/latest");
    }

    internal string GamePath(Version version)
    {
        return Path.Combine(installRoot, "v" + version, "Ironhaven", "Ironhaven.exe");
    }

    internal Version LatestInstalled()
    {
        if (!Directory.Exists(installRoot)) return null;
        return Directory.EnumerateDirectories(installRoot)
            .Select(directory => GameRelease.ParseTag(Path.GetFileName(directory)))
            .Where(version => version != null && File.Exists(GamePath(version)))
            .OrderByDescending(version => version).FirstOrDefault();
    }

    internal async Task Install(GameRelease release, IProgress<int> progress)
    {
        Directory.CreateDirectory(installRoot);
        var staging = Path.Combine(installRoot, ".update-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(staging);
        try
        {
            var archive = Path.Combine(staging, "game.zip");
            using (var response = await client.GetAsync(release.Download, HttpCompletionOption.ResponseHeadersRead).ConfigureAwait(false))
            {
                response.EnsureSuccessStatusCode();
                if (response.RequestMessage.RequestUri.Scheme != Uri.UriSchemeHttps)
                    throw new InvalidDataException("The download was redirected to an insecure connection.");
                using (var source = await response.Content.ReadAsStreamAsync().ConfigureAwait(false))
                using (var destination = File.Create(archive))
                {
                    var buffer = new byte[128 * 1024];
                    long received = 0;
                    int count, lastPercent = -1;
                    while ((count = await source.ReadAsync(buffer, 0, buffer.Length).ConfigureAwait(false)) != 0)
                    {
                        received += count;
                        if (received > release.Size) throw new InvalidDataException("The Windows download exceeded its listed size.");
                        await destination.WriteAsync(buffer, 0, count).ConfigureAwait(false);
                        int percent = (int)(received * 100 / release.Size);
                        if (percent != lastPercent) progress.Report(lastPercent = percent);
                    }
                    if (received != release.Size) throw new InvalidDataException("The Windows download ended early. Please retry.");
                }
            }
            await Task.Run(() => InstallArchive(release, archive, Path.Combine(staging, "payload"))).ConfigureAwait(false);
        }
        finally
        {
            Directory.Delete(staging, true);
        }
    }

    internal void InstallArchive(GameRelease release, string archive, string payload)
    {
        if (new FileInfo(archive).Length != release.Size || !String.Equals(ArchiveDigest(archive), release.Digest, StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException("The downloaded archive did not match GitHub's SHA-256 checksum.");
        var root = Path.GetFullPath(payload) + Path.DirectorySeparatorChar;
        var gameRoot = Path.Combine(root, "Ironhaven") + Path.DirectorySeparatorChar;
        Directory.CreateDirectory(root);
        using (var zip = ZipFile.OpenRead(archive))
        {
            foreach (var entry in zip.Entries)
            {
                string name = entry.FullName.Replace('\\', '/');
                if (name == "Ironhaven/") continue;
                if (!name.StartsWith("Ironhaven/", StringComparison.Ordinal) || name.IndexOf(':') >= 0)
                    throw new InvalidDataException("Unexpected path in the Windows archive.");
                string target = Path.GetFullPath(Path.Combine(root, name));
                if (!target.StartsWith(gameRoot, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("Unsafe path in the Windows archive.");
                if (name.EndsWith("/", StringComparison.Ordinal)) Directory.CreateDirectory(target);
                else
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(target));
                    entry.ExtractToFile(target);
                }
            }
        }
        if (!File.Exists(Path.Combine(root, "Ironhaven", "Ironhaven.exe")))
            throw new InvalidDataException("The Windows archive is missing Ironhaven.exe.");
        var destination = Path.Combine(installRoot, "v" + release.Version);
        Directory.CreateDirectory(installRoot);
        try { Directory.Move(payload, destination); }
        catch (IOException) { if (!File.Exists(GamePath(release.Version))) throw; }
    }

    internal static string ArchiveDigest(string file)
    {
        using (var sha = SHA256.Create())
        using (var input = File.OpenRead(file))
            return "sha256:" + BitConverter.ToString(sha.ComputeHash(input)).Replace("-", "").ToLowerInvariant();
    }
}
