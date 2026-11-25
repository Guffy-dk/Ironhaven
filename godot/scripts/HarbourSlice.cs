using Godot;
using System;
using System.Collections.Generic;

namespace Ironhaven;

// Vertical slice of the Nordic summer harbour: an island with blended CC0 ground, sea, a working
// drill → smelter → warehouse factory on 3×3/5×5 footprints, spruce groves, hostiles walking ashore,
// and the lighthouse beam in volumetric fog. Launch with `--capture=<dir>` to save review frames.
public partial class HarbourSlice : Node3D
{
	public const float IslandRadius = IslandShape.Radius;
	readonly List<Belt> belts = new();
	readonly List<Walker> walkers = new();
	readonly RandomNumberGenerator rng = new() { Seed = 417 };
	WorldEnvironment world; DirectionalLight3D sun; SpotLight3D beam; Node3D beamPivot; Camera3D camera;
	bool dusk;

	public override void _Ready()
	{
		var args = OS.GetCmdlineUserArgs();
		dusk = Array.Exists(args, a => a == "--dusk");
		BuildEnvironment();
		BuildIsland();
		BuildSea();
		BuildFactory();
		BuildGroves();
		BuildHostiles();
		BuildCamera();
		var capture = Array.Find(args, a => a.StartsWith("--capture="));
		if (capture != null) _ = Capture(capture.Substring("--capture=".Length));
	}

	// ---------- environment ----------
	void BuildEnvironment()
	{
		var env = new Godot.Environment
		{
			BackgroundMode = Godot.Environment.BGMode.Sky,
			Sky = new Sky { SkyMaterial = new PanoramaSkyMaterial { Panorama = GD.Load<Texture2D>("res://assets/sky/sky-summer/sky.hdr") } },
			AmbientLightSource = Godot.Environment.AmbientSource.Sky,
			ReflectedLightSource = Godot.Environment.ReflectionSource.Sky,
			TonemapMode = Godot.Environment.ToneMapper.Aces,
			TonemapExposure = dusk ? 0.75f : 1.05f,
			SsaoEnabled = true, SsaoRadius = 1.2f, SsaoIntensity = 1.6f,
			SdfgiEnabled = true, SdfgiUseOcclusion = true, SdfgiCascades = 4, SdfgiMinCellSize = 0.25f,
			GlowEnabled = true, GlowIntensity = dusk ? 1.1f : 0.35f, GlowBloom = 0.05f,
			VolumetricFogEnabled = true,
			VolumetricFogDensity = dusk ? 0.022f : 0.004f,
			VolumetricFogAlbedo = dusk ? new Color(0.62f, 0.66f, 0.72f) : new Color(0.88f, 0.92f, 0.96f),
			VolumetricFogAnisotropy = 0.6f,
			AdjustmentEnabled = true, AdjustmentSaturation = dusk ? 0.85f : 0.96f, AdjustmentContrast = 1.04f,
		};
		env.SkyRotation = new Vector3(0, Mathf.DegToRad(140), 0);
		if (dusk) env.BackgroundEnergyMultiplier = 0.35f;
		world = new WorldEnvironment { Environment = env };
		AddChild(world);
		sun = new DirectionalLight3D
		{
			LightColor = dusk ? new Color(1f, 0.62f, 0.42f) : new Color(1f, 0.95f, 0.86f),
			LightEnergy = dusk ? 0.55f : 2.1f,
			ShadowEnabled = true, DirectionalShadowMaxDistance = 140f, ShadowBlur = 1.4f,
			RotationDegrees = dusk ? new Vector3(-12, 120, 0) : new Vector3(-48, 135, 0),
		};
		AddChild(sun);
	}

	// ---------- terrain ----------
	public static float Height(float x, float z) => IslandShape.Height(x, z);
	public static float Noise(float x, float z) => IslandShape.Noise(x, z);

	void BuildIsland()
	{
		const int n = 220; const float size = 170f;
		var st = new SurfaceTool(); st.Begin(Mesh.PrimitiveType.Triangles);
		for (int i = 0; i <= n; i++)
		for (int j = 0; j <= n; j++)
		{
			float x = -size / 2 + size * i / n, z = -size / 2 + size * j / n, y = Height(x, z), r = Mathf.Sqrt(x * x + z * z);
			float sand = Mathf.SmoothStep(0.55f, 0.05f, y);
			float granite = Mathf.SmoothStep(0.62f, 0.85f, Noise(x * 0.09f + 3, z * 0.09f)) * (1 - sand);
			float gravel = Mathf.SmoothStep(22f, 12f, r) * 0.7f * (1 - sand);
			float meadow = Mathf.SmoothStep(0.45f, 0.8f, Noise(x * 0.06f - 5, z * 0.06f + 2)) * 0.85f * (1 - sand - gravel);
			st.SetColor(new Color(meadow, sand, granite, gravel));
			st.SetUV(new Vector2(x, z));
			st.AddVertex(new Vector3(x, y, z));
		}
		for (int i = 0; i < n; i++)
		for (int j = 0; j < n; j++)
		{
			int a = i * (n + 1) + j, b = a + n + 1;
			// Godot treats clockwise triangles (seen from above) as front faces.
			st.AddIndex(a); st.AddIndex(b); st.AddIndex(a + 1);
			st.AddIndex(b); st.AddIndex(b + 1); st.AddIndex(a + 1);
		}
		st.GenerateNormals();
		var shader = GD.Load<Shader>("res://shaders/terrain.gdshader");
		var mat = new ShaderMaterial { Shader = shader };
		string T(string id, string f) => $"res://assets/textures/{id}/{f}";
		mat.SetShaderParameter("grass_albedo", GD.Load<Texture2D>(T("terrain-grass", "color.jpg")));
		mat.SetShaderParameter("meadow_albedo", GD.Load<Texture2D>(T("terrain-meadow", "color.jpg")));
		mat.SetShaderParameter("sand_albedo", GD.Load<Texture2D>(T("terrain-sand", "color.jpg")));
		mat.SetShaderParameter("granite_albedo", GD.Load<Texture2D>(T("terrain-granite", "color.jpg")));
		mat.SetShaderParameter("gravel_albedo", GD.Load<Texture2D>(T("terrain-gravel", "color.jpg")));
		mat.SetShaderParameter("grass_normal", GD.Load<Texture2D>(T("terrain-grass", "normal.jpg")));
		mat.SetShaderParameter("granite_normal", GD.Load<Texture2D>(T("terrain-granite", "normal.jpg")));
		mat.SetShaderParameter("grass_arm", GD.Load<Texture2D>(T("terrain-grass", "arm.jpg")));
		AddChild(new MeshInstance3D { Mesh = st.Commit(), MaterialOverride = mat, Name = "Island" });
	}

	void BuildSea()
	{
		var plane = new PlaneMesh { Size = new Vector2(900, 900), SubdivideWidth = 220, SubdivideDepth = 220 };
		var mat = new ShaderMaterial { Shader = GD.Load<Shader>("res://shaders/water.gdshader") };
		AddChild(new MeshInstance3D { Mesh = plane, MaterialOverride = mat, Name = "Sea", Position = new Vector3(0, -0.05f, 0) });
	}

	// ---------- models ----------
	Node3D Model(string name, Vector3 at, float yaw = 0, float scale = 1)
	{
		var scene = GD.Load<PackedScene>($"res://assets/models/{name}.glb");
		var node = scene.Instantiate<Node3D>();
		node.Position = new Vector3(at.X, Height(at.X, at.Z) + at.Y, at.Z);
		node.RotationDegrees = new Vector3(0, yaw, 0);
		node.Scale = Vector3.One * scale;
		AddChild(node);
		return node;
	}

	StandardMaterial3D Surface(string id, Color tint, float scale = 1f)
	{
		return new StandardMaterial3D
		{
			AlbedoTexture = GD.Load<Texture2D>($"res://assets/textures/{id}/color.jpg"), AlbedoColor = tint,
			NormalEnabled = true, NormalTexture = GD.Load<Texture2D>($"res://assets/textures/{id}/normal.jpg"),
			Uv1Triplanar = true, Uv1Scale = Vector3.One * scale, Uv1WorldTriplanar = true,
			Roughness = 0.8f,
		};
	}

	void BuildFactory()
	{
		Model("lighthouse", new Vector3(0, 0, 0), 20);
		var beamHost = new Node3D { Position = new Vector3(0, Height(0, 0) + 7.07f, 0) };
		AddChild(beamHost); beamPivot = beamHost;
		beam = new SpotLight3D { LightColor = new Color(1f, 0.92f, 0.72f), LightEnergy = dusk ? 40 : 6, SpotRange = 90, SpotAngle = 14, SpotAttenuation = 0.6f, ShadowEnabled = true, LightVolumetricFogEnergy = dusk ? 6 : 0.6f };
		beam.RotationDegrees = new Vector3(-8, 0, 0); beamHost.AddChild(beam);
		var lantern = new OmniLight3D { LightColor = new Color(1, 0.86f, 0.6f), LightEnergy = dusk ? 4 : 0.6f, OmniRange = 6, Position = Vector3.Zero };
		beamHost.AddChild(lantern);

		// Iron field west of the lighthouse: scanned rock carrying a rust-red iron stain, so ore reads at a glance.
		var ironStone = Surface("rust", new Color(0.86f, 0.5f, 0.36f), 0.5f);
		var outcrops = new List<Transform3D>(); var pebbles = new List<Transform3D>();
		for (int k = 0; k < 60; k++)
		{
			float x = -26 + rng.RandfRange(-7, 7), z = -6 + rng.RandfRange(-10, 10);
			if (Mathf.Abs(x + 26) < 1.6f) continue;
			outcrops.Add(Placed(x, z, rng.RandfRange(0.35f, 0.7f), 0.15f));
		}
		for (int k = 0; k < 160; k++) { float x = -26 + rng.RandfRange(-8, 8), z = -6 + rng.RandfRange(-11, 11); pebbles.Add(Placed(x, z, rng.RandfRange(0.15f, 0.3f), 0.05f)); }
		Scatter("nature-boulder_01", outcrops, null, ironStone);
		Scatter("nature-rock_moss_set_01", pebbles, null, ironStone);
		// Levels 1-3 side by side: type reads from silhouette and roof colour, level from painted roof bands and growth.
		int lv = 0;
		foreach (var z in new[] { -13f, -6f, 1f }) { Model($"drill-{1 + lv % 3}", new Vector3(-30, 0, z), 0); Model($"drill-{1 + (lv + 1) % 3}", new Vector3(-22, 0, z), 180); lv++; }
		AddBelt(new Vector3(-26, 0, -15), new Vector3(-26, 0, 6), 3.4f, new Color(0.75f, 0.45f, 0.33f));
		// Smelter column fed from the collector, plates to two warehouses.
		AddBelt(new Vector3(-26, 0, 6), new Vector3(-12, 0, 6), 3.4f, new Color(0.75f, 0.45f, 0.33f));
		for (int i = 0; i < 3; i++)
		{
			float x = -18 + i * 4.2f;
			Model($"smelter-{1 + i}", new Vector3(x, 0, 2.2f), 0);
			Model($"smelter-{3 - i}", new Vector3(x, 0, 9.8f), 180);
		}
		AddBelt(new Vector3(-12, 0, 6), new Vector3(-6, 0, 6), 2.6f, new Color(0.7f, 0.72f, 0.74f), true);
		Model("warehouse-3", new Vector3(-6.5f, 0, 13.5f), 180);
		Model("warehouse-1", new Vector3(-6.5f, 0, -1.8f), 0);
		AddBelt(new Vector3(-6, 0, 6), new Vector3(-6, 0, 10.8f), 2.6f, new Color(0.7f, 0.72f, 0.74f), true);
	}

	void AddBelt(Vector3 from, Vector3 to, float speed, Color cargo, bool plates = false)
	{
		var dir = (to - from); float length = dir.Length(); var mid = (from + to) / 2;
		float yaw = Mathf.Atan2(dir.X, dir.Z);
		var frame = new Node3D { Position = new Vector3(mid.X, Height(mid.X, mid.Z) + 0.2f, mid.Z), Rotation = new Vector3(0, yaw, 0) };
		AddChild(frame);
		var rubber = new StandardMaterial3D { AlbedoColor = new Color(0.08f, 0.08f, 0.09f), Roughness = 0.9f };
		var steel = Surface("steel-plate", new Color(0.45f, 0.5f, 0.52f), 1.5f);
		frame.AddChild(new MeshInstance3D { Mesh = new BoxMesh { Size = new Vector3(0.62f, 0.06f, length) }, MaterialOverride = rubber });
		foreach (var s in new[] { -0.36f, 0.36f })
			frame.AddChild(new MeshInstance3D { Mesh = new BoxMesh { Size = new Vector3(0.08f, 0.18f, length) }, MaterialOverride = steel, Position = new Vector3(s, 0.02f, 0) });
		for (float d = -length / 2 + 0.5f; d < length / 2; d += 1.2f)
			frame.AddChild(new MeshInstance3D { Mesh = new BoxMesh { Size = new Vector3(0.9f, 0.1f, 0.1f) }, MaterialOverride = steel, Position = new Vector3(0, -0.18f, d) });
		var cargoMat = plates ? Surface("steel-plate", cargo, 3f) : Surface("rust", cargo, 3f);
		var belt = new Belt { Frame = frame, Length = length, Speed = speed };
		for (float d = 0; d < length; d += 0.55f)
		{
			var item = new MeshInstance3D { Mesh = plates ? new BoxMesh { Size = new Vector3(0.36f, 0.05f, 0.36f) } : new SphereMesh { Radius = 0.14f, Height = 0.2f, RadialSegments = 7, Rings = 4 }, MaterialOverride = cargoMat };
			if (!plates) item.Scale = new Vector3(rng.RandfRange(.8f, 1.3f), 1, rng.RandfRange(.8f, 1.3f));
			frame.AddChild(item); belt.Items.Add(item); belt.Offsets.Add(d);
		}
		belts.Add(belt);
	}

	// Instanced CC0 scenery (Poly Haven, decimated in Blender): every mesh of a model becomes one MultiMesh.
	// `part` picks one variant out of a multi-variant scan (e.g. fir_tree_01 _b_) and re-centres it.
	void Scatter(string model, List<Transform3D> where, string part = null, Material material = null)
	{
		if (where.Count == 0) return;
		var scene = GD.Load<PackedScene>($"res://assets/models/{model}.glb").Instantiate<Node3D>();
		void Visit(Node node, Transform3D parent)
		{
			var local = node is Node3D n3 ? parent * n3.Transform : parent;
			if (part != null && node is MeshInstance3D) local.Origin = new Vector3(0, local.Origin.Y, 0);
			if (node is MeshInstance3D mi && mi.Mesh != null && (part == null || mi.Name.ToString().Contains(part)))
			{
				var mm = new MultiMesh { TransformFormat = MultiMesh.TransformFormatEnum.Transform3D, Mesh = mi.Mesh, InstanceCount = where.Count };
				for (int i = 0; i < where.Count; i++) mm.SetInstanceTransform(i, where[i] * local);
				AddChild(new MultiMeshInstance3D { Multimesh = mm, CastShadow = GeometryInstance3D.ShadowCastingSetting.On, MaterialOverride = material });
			}
			foreach (var child in node.GetChildren()) Visit(child, local);
		}
		Visit(scene, Transform3D.Identity);
		scene.Free();
	}

	Transform3D Placed(float x, float z, float scale, float sink = 0)
	{
		var basis = Basis.FromEuler(new Vector3(rng.RandfRange(-.04f, .04f), rng.RandfRange(0, Mathf.Tau), rng.RandfRange(-.04f, .04f))).Scaled(Vector3.One * scale);
		return new Transform3D(basis, new Vector3(x, Height(x, z) - sink, z));
	}

	bool Clear(float x, float z) => !(x < -10 && x > -40 && z > -20 && z < 20) && Mathf.Sqrt(x * x + z * z) > 18;

	void BuildGroves()
	{
		var firs = new List<Transform3D>(); var pines = new List<Transform3D>(); var ferns = new List<Transform3D>();
		var shrubs = new List<Transform3D>(); var shrubs2 = new List<Transform3D>(); var saplings = new List<Transform3D>(); var grass = new List<Transform3D>(); var rocks = new List<Transform3D>(); var boulders = new List<Transform3D>(); var stumps = new List<Transform3D>();
		for (int k = 0; k < 9000; k++)
		{
			float x = rng.RandfRange(-62, 62), z = rng.RandfRange(-62, 62), y = Height(x, z);
			if (y < 0.35f || !Clear(x, z)) continue;
			float forest = Noise(x * 0.05f + 11, z * 0.05f);
			if (forest > 0.56f && firs.Count + pines.Count < 520)
			{
				if (rng.Randf() < 0.6f) firs.Add(Placed(x, z, rng.RandfRange(0.42f, 0.62f))); else pines.Add(Placed(x, z, rng.RandfRange(0.4f, 0.58f)));
				if (rng.Randf() < 0.4f) saplings.Add(Placed(x + rng.RandfRange(-2.5f, 2.5f), z + rng.RandfRange(-2.5f, 2.5f), rng.RandfRange(0.8f, 1.4f)));
				if (rng.Randf() < 0.5f) ferns.Add(Placed(x + rng.RandfRange(-1.5f, 1.5f), z + rng.RandfRange(-1.5f, 1.5f), rng.RandfRange(1.2f, 2f)));
			}
			else if (forest > 0.48f && rng.Randf() < 0.25f) (rng.Randf() < .5f ? shrubs : shrubs2).Add(Placed(x, z, rng.RandfRange(0.6f, 1.1f)));
			else if (rng.Randf() < 0.5f && grass.Count < 4000) grass.Add(Placed(x, z, rng.RandfRange(3f, 5f)));
			else if (Noise(x * 0.09f + 3, z * 0.09f) > 0.7f && rng.Randf() < 0.3f) rocks.Add(Placed(x, z, rng.RandfRange(0.8f, 1.6f), 0.1f));
			else if (rng.Randf() < 0.004f) boulders.Add(Placed(x, z, rng.RandfRange(0.8f, 1.4f), 0.2f));
			else if (forest > 0.5f && rng.Randf() < 0.02f) stumps.Add(Placed(x, z, rng.RandfRange(1f, 1.4f)));
		}
		// Scanned spruce (1 unit ≈ 2 m) in three variants, needles baked to alpha cards in Blender; saplings as undergrowth.
		var variants = new[] { "_a_", "_b_", "_c_" };
		for (int v = 0; v < 3; v++)
		{
			Scatter("nature-fir_tree_01", firs.FindAll(t => firs.IndexOf(t) % 3 == v), variants[v]);
			Scatter("nature-fir_tree_01", pines.FindAll(t => pines.IndexOf(t) % 3 == v), variants[(v + 1) % 3]);
		}
		Scatter("nature-fir_sapling", saplings); Scatter("nature-fern_02", ferns);
		Scatter("nature-shrub_04", shrubs); Scatter("nature-shrub_02", shrubs2); Scatter("nature-rock_moss_set_01", rocks); Scatter("nature-boulder_01", boulders); Scatter("nature-tree_stump_01", stumps);
		var tufts = new[] { "tall_a", "tall_b", "mid_a", "large_a", "large_b" };
		for (int v = 0; v < tufts.Length; v++) Scatter("nature-grass_medium_01", grass.FindAll(t => grass.IndexOf(t) % tufts.Length == v), tufts[v]);
		// Harbour clutter around the warehouses.
		var crates = new List<Transform3D>(); var barrels = new List<Transform3D>();
		foreach (var (x, z) in new[] { (-3.2f, 12.2f), (-3.4f, 15.2f), (-3.1f, -0.6f), (-9.6f, -3.2f) })
		{
			crates.Add(Placed(x, z, 1.1f)); crates.Add(Placed(x + 0.9f, z + 0.3f, 1.0f));
			barrels.Add(Placed(x - 0.2f, z + 1.4f, 1.0f));
		}
		Scatter("nature-wooden_crate_01", crates); Scatter("nature-wooden_barrels_01", barrels);
		BuildHarbour();
	}

	// Pier, boats and a channel marker on the east shore; scanned coast rock around the island.
	void BuildHarbour()
	{
		float shore = 30; for (float x = 10; x < 80; x += 0.5f) if (Height(x, 18) < 0) { shore = x; break; }
		for (int i = 0; i < 2; i++) Model("nature-modular_wooden_pier", new Vector3(shore - 2 + i * 6f, -Height(shore - 2 + i * 6f, 18) + 0.4f, 18), 90, 0.5f);
		Model("nature-ship_pinnace", new Vector3(shore + 14, -Height(shore + 14, 27) - 1.2f, 27), 75, 0.45f);
		Model("nature-dutch_ship_medium", new Vector3(shore + 10, -Height(shore + 10, 9) - 0.8f, 9), 200, 0.42f);
		Model("nature-lateral_sea_marker", new Vector3(shore + 24, -Height(shore + 24, 14) - 1f, 14), 0, 0.5f);
		Model("nature-ocean_buoy", new Vector3(shore + 20, -Height(shore + 20, 32) - 0.4f, 32), 0, 0.6f);
		var coast = new List<Transform3D>(); var coast2 = new List<Transform3D>();
		for (int k = 0; k < 14; k++)
		{
			float a = k * Mathf.Tau / 14 + 0.2f; if (Mathf.Abs(Mathf.Wrap(a - 0.25f, -Mathf.Pi, Mathf.Pi)) < 0.35f) continue;
			float r = IslandRadius - 2; var at = new Vector3(Mathf.Cos(a) * r, -0.6f, Mathf.Sin(a) * r);
			var basis = new Basis(Vector3.Up, -a + Mathf.Pi / 2).Scaled(Vector3.One * rng.RandfRange(0.3f, 0.4f));
			(k % 2 == 0 ? coast : coast2).Add(new Transform3D(basis, at));
		}
		Scatter("nature-coast_rocks_01", coast); Scatter("nature-coast_line_01", coast2);
		var lamps = new List<Transform3D>();
		foreach (var (x, z) in new[] { (-12f, 4f), (-12f, 8f), (-3f, 6f), (6f, 14f), (12f, 16f) }) lamps.Add(new Transform3D(Basis.Identity.Scaled(Vector3.One * 0.55f), new Vector3(x, Height(x, z), z)));
		Scatter("nature-street_lamp_01", lamps);
	}

	void BuildHostiles()
	{
		var kinds = new[] { ("runner", 1.0f, 1.6f), ("guard", 1.0f, 1.1f), ("walker", 1.6f, 0.9f), ("drowned", 4.5f, 1.2f), ("runner", 1.0f, 1.7f) };
		for (int i = 0; i < 12; i++)
		{
			var (kind, scale, speed) = kinds[i % kinds.Length];
			float angle = Mathf.DegToRad(30 + i * 7), start = IslandRadius + 4;
			var at = new Vector3(Mathf.Cos(angle) * start, 0, Mathf.Sin(angle) * start);
			var node = Model($"creature-{kind}", at, 0, scale);
			walkers.Add(new Walker { Node = node, Start = at, Speed = speed, Phase = i * 0.7f, Heavy = kind is "walker" or "guard" });
		}
	}

	void BuildCamera()
	{
		// No depth-of-field: far blur on a high camera is the tilt-shift "miniature" look the owner rejected.
		camera = new Camera3D { Fov = 38, Far = 900 };
		AddChild(camera);
		Frame(new Vector3(-14, 0, 4), 58, 40, 200);
	}

	public void Frame(Vector3 target, float distance, float pitch, float yaw)
	{
		var p = Mathf.DegToRad(pitch); var y = Mathf.DegToRad(yaw);
		camera.Position = target + new Vector3(Mathf.Sin(y) * Mathf.Cos(p), Mathf.Sin(p), Mathf.Cos(y) * Mathf.Cos(p)) * distance;
		camera.LookAt(target);
	}

	// ---------- animation ----------
	public override void _Process(double delta)
	{
		float dt = (float)delta, t = (float)Time.GetTicksMsec() / 1000f;
		foreach (var b in belts)
			for (int i = 0; i < b.Items.Count; i++)
			{
				b.Offsets[i] = (b.Offsets[i] + b.Speed * dt * 0.25f) % b.Length;
				b.Items[i].Position = new Vector3(0, 0.15f, b.Offsets[i] - b.Length / 2);
			}
		if (beamPivot != null) beamPivot.RotationDegrees = new Vector3(0, t * 12f, 0);
		foreach (var w in walkers) w.Step(dt);
	}

	async System.Threading.Tasks.Task Capture(string dir)
	{
		DirAccess.MakeDirRecursiveAbsolute(dir);
		var shots = new (string name, Vector3 target, float distance, float pitch, float yaw)[]
		{
			("overview", new Vector3(-10, 0, 2), 120, 52, 205),
			("factory", new Vector3(-17, 0, 4), 46, 42, 200),
			("lighthouse", new Vector3(0, 3, 0), 26, 22, 120),
		};
		foreach (var s in shots)
		{
			Frame(s.target, s.distance, s.pitch, s.yaw);
			for (int f = 0; f < 16; f++) await ToSignal(GetTree(), SceneTree.SignalName.ProcessFrame);
			var image = GetViewport().GetTexture().GetImage();
			image.SavePng($"{dir}/{(dusk ? "dusk-" : "")}{s.name}.png");
			GD.Print($"captured {s.name}");
		}
		GetTree().Quit();
	}

	class Belt { public Node3D Frame; public float Length, Speed; public List<MeshInstance3D> Items = new(); public List<float> Offsets = new(); }

	class Walker
	{
		public Node3D Node; public Vector3 Start; public float Speed, Phase, Travel; public bool Heavy;
		public void Step(float dt)
		{
			Travel += Speed * dt;
			var dir = (-Start).Normalized();
			var at = Start + dir * Mathf.PosMod(Travel, Start.Length() - 24f);
			float gait = Mathf.Sin(Travel * (Heavy ? 2.2f : 4.5f) + Phase);
			Node.Position = new Vector3(at.X, Height(at.X, at.Z) + Mathf.Abs(gait) * (Heavy ? 0.12f : 0.06f), at.Z);
			Node.Rotation = new Vector3(Mathf.Abs(gait) * 0.04f, Mathf.Atan2(dir.X, dir.Z), gait * (Heavy ? 0.06f : 0.04f));
		}
	}
}
