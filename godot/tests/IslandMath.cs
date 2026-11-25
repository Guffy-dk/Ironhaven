using System;
using Ironhaven;
static class IslandMath
{
	static int failures;
	static void Check(bool ok, string what) { if (!ok) { failures++; Console.WriteLine("FAIL " + what); } else Console.WriteLine("ok   " + what); }
	static int Main()
	{
		Check(IslandShape.Height(0, 0) > 0.1f, "the lighthouse stands on dry land");
		Check(IslandShape.Height(90, 0) < -1f && IslandShape.Height(0, -90) < -1f, "beyond the shore is sea");
		float maxColony = 0; for (float x = -14; x <= 14; x++) for (float z = -14; z <= 14; z++) maxColony = MathF.Max(maxColony, MathF.Abs(IslandShape.Height(x, z) - IslandShape.Height(0, 0)));
		Check(maxColony < 0.4f, "the colony floor is nearly level for building");
		bool smooth = true; for (float x = -60; x < 60; x += .5f) if (MathF.Abs(IslandShape.Height(x + .5f, 10) - IslandShape.Height(x, 10)) > .8f) smooth = false;
		Check(smooth, "no cliffs between neighbouring samples");
		Check(IslandShape.Height(1.5f, 2.5f) == IslandShape.Height(1.5f, 2.5f), "deterministic");
		return failures == 0 ? 0 : 1;
	}
}
