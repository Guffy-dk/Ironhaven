using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Web.Script.Serialization;

// Windows patcher: .NET Framework (csc), ZIP releases. Behaviour matches the published patcher.
internal static class PatcherPlatform
{
    internal const string Name = "Windows";
    internal const string AssetName = "Ironhaven-Windows-x64.zip";
    internal const string ManifestName = "Ironhaven-Windows-manifest.json";
    internal const string Executable = "Ironhaven.exe";
    internal const string ArchiveExtension = ".zip";

    internal static GameRelease.ReleaseMetadata ParseMetadata(string json)
    {
        return new JavaScriptSerializer().Deserialize<GameRelease.ReleaseMetadata>(json);
    }

    internal static void Extract(string archive, string root, string gameRoot)
    {
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
    }

    internal static ProcessStartInfo Launch(string executable)
    {
        return new ProcessStartInfo(executable) { WorkingDirectory = Path.GetDirectoryName(executable) };
    }

    // Test helper: a minimal release archive with one file entry.
    internal static void WriteTestArchive(string archive, string entry)
    {
        using (var zip = ZipFile.Open(archive, ZipArchiveMode.Create))
        using (var writer = new StreamWriter(zip.CreateEntry(entry).Open())) writer.Write("test executable");
    }
}
