using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

internal sealed class GameRelease
{
    internal static readonly string AssetName = PatcherPlatform.AssetName;
    internal const string Repository = "https://github.com/Guffy-dk/Ironhaven";
    internal static readonly string LatestManifest = Repository + "/releases/latest/download/" + PatcherPlatform.ManifestName;
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
        var data = PatcherPlatform.ParseMetadata(json);
        var version = ParseTag(data == null ? null : data.tag);
        if (version == null || data.size <= 0 || !Regex.IsMatch(data.digest ?? "", @"\Asha256:[a-fA-F0-9]{64}\z"))
            throw new InvalidDataException("The " + PatcherPlatform.Name + " release is missing valid download verification metadata.");
        var download = new Uri(Repository + "/releases/download/v" + version + "/" + AssetName);
        return new GameRelease { Version = version, Download = download, Digest = data.digest, Size = data.size };
    }

    public sealed class ReleaseMetadata
    {
        public string tag { get; set; }
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
        return client.GetStringAsync(GameRelease.LatestManifest);
    }

    internal string GamePath(Version version)
    {
        return Path.Combine(installRoot, "v" + version, "Ironhaven", PatcherPlatform.Executable);
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
                        if (received > release.Size) throw new InvalidDataException("The " + PatcherPlatform.Name + " download exceeded its listed size.");
                        await destination.WriteAsync(buffer, 0, count).ConfigureAwait(false);
                        int percent = (int)(received * 100 / release.Size);
                        if (percent != lastPercent) progress.Report(lastPercent = percent);
                    }
                    if (received != release.Size) throw new InvalidDataException("The " + PatcherPlatform.Name + " download ended early. Please retry.");
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
        PatcherPlatform.Extract(archive, root, gameRoot);
        if (!File.Exists(Path.Combine(root, "Ironhaven", PatcherPlatform.Executable)))
            throw new InvalidDataException("The " + PatcherPlatform.Name + " archive is missing " + PatcherPlatform.Executable + ".");
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
