using System;
namespace Ironhaven;
// Island height field shared by the renderer and tests (pure maths, no Godot types).
public static class IslandShape
{
	public const float Radius = 64f;
	static float Smooth(float from, float to, float x) { float t = Math.Clamp((x - from) / (to - from), 0f, 1f); return t * t * (3 - 2 * t); }
	public static float Noise(float x, float z)
	{
		float ix = MathF.Floor(x), iz = MathF.Floor(z), fx = x - ix, fz = z - iz;
		static float H(float a, float b) { float s = MathF.Sin(a * 127.1f + b * 311.7f) * 43758.5453f; return s - MathF.Floor(s); }
		fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
		float l(float a, float b, float t) => a + (b - a) * t;
		return l(l(H(ix, iz), H(ix + 1, iz), fx), l(H(ix, iz + 1), H(ix + 1, iz + 1), fx), fz);
	}
	public static float Height(float x, float z)
	{
		float r = MathF.Sqrt(x * x + z * z), a = MathF.Atan2(z, x);
		float edge = Radius * (1f + 0.07f * MathF.Sin(a * 5f + 1.3f) + 0.05f * MathF.Cos(a * 9f - 0.4f));
		float shore = Smooth(edge, edge - 9f, r);
		float hills = 0.55f * Noise(x * 0.045f, z * 0.045f) + 0.25f * Noise(x * 0.13f + 7, z * 0.13f - 3);
		float colony = Smooth(26f, 14f, r);
		return -2.2f + (0.25f + hills * (1f - colony * 0.85f) + 2.2f) * shore;
	}
}
