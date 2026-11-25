using System;
using System.Diagnostics;
using System.Formats.Tar;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Text.Json;

[assembly: System.Runtime.Versioning.SupportedOSPlatform("linux")]

// Linux patcher: .NET 8, tar.gz releases that keep the executable permissions.
internal static class PatcherPlatform
{
    internal const string Name = "Linux";
    internal const string AssetName = "Ironhaven-Linux-x64.tar.gz";
    internal const string ManifestName = "Ironhaven-Linux-manifest.json";
    internal const string Executable = "Ironhaven";
    internal const string Launcher = "ironhaven.sh";
    internal const string ArchiveExtension = ".tar.gz";

    internal static GameRelease.ReleaseMetadata ParseMetadata(string json)
    {
        try { return JsonSerializer.Deserialize<GameRelease.ReleaseMetadata>(json); }
        catch (JsonException) { return null; }
    }

    internal static void Extract(string archive, string root, string gameRoot)
    {
        using var file = File.OpenRead(archive);
        using var gzip = new GZipStream(file, CompressionMode.Decompress);
        using var reader = new TarReader(gzip);
        TarEntry entry;
        while ((entry = reader.GetNextEntry()) != null)
        {
            string name = entry.Name.Replace('\\', '/');
            if (name.StartsWith("./", StringComparison.Ordinal)) name = name.Substring(2);
            if (name == "Ironhaven/" || name == "Ironhaven") continue;
            if (!name.StartsWith("Ironhaven/", StringComparison.Ordinal))
                throw new InvalidDataException("Unexpected path in the Linux archive.");
            string target = Path.GetFullPath(Path.Combine(root, name));
            if (!target.StartsWith(gameRoot, StringComparison.Ordinal))
                throw new InvalidDataException("Unsafe path in the Linux archive.");
            switch (entry.EntryType)
            {
                case TarEntryType.Directory:
                    Directory.CreateDirectory(target);
                    break;
                case TarEntryType.RegularFile:
                case TarEntryType.V7RegularFile:
                    Directory.CreateDirectory(Path.GetDirectoryName(target));
                    entry.ExtractToFile(target, false);
                    // Keep execute bits but never setuid/setgid/sticky from a download.
                    File.SetUnixFileMode(target, (UnixFileMode)((int)entry.Mode & 0x1FF));
                    break;
                case TarEntryType.SymbolicLink:
                case TarEntryType.HardLink:
                    throw new InvalidDataException("Links are not allowed in the Linux archive.");
                default:
                    // PAX/GNU metadata entries are consumed by TarReader; anything else is unexpected.
                    throw new InvalidDataException("Unsupported entry in the Linux archive.");
            }
        }
    }

    internal static ProcessStartInfo Launch(string executable)
    {
        string directory = Path.GetDirectoryName(executable);
        string launcher = Path.Combine(directory, Launcher);
        return new ProcessStartInfo(File.Exists(launcher) ? launcher : executable) { WorkingDirectory = directory, UseShellExecute = false };
    }

    internal static void WriteTestArchive(string archive, string entry)
    {
        using var file = File.Create(archive);
        using var gzip = new GZipStream(file, CompressionLevel.Optimal);
        using var writer = new TarWriter(gzip, TarEntryFormat.Pax);
        var item = new PaxTarEntry(TarEntryType.RegularFile, entry)
        {
            Mode = UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute | UnixFileMode.SetUser,
            DataStream = new MemoryStream(Encoding.UTF8.GetBytes("test executable"))
        };
        writer.WriteEntry(item);
    }
}
