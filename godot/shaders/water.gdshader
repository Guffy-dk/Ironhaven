// North Atlantic summer sea: layered waves, fresnel sky reflection, depth tint and shore foam.
shader_type spatial;
render_mode depth_draw_always, cull_disabled, specular_schlick_ggx;
uniform vec3 shallow : source_color = vec3(0.22, 0.52, 0.55);
uniform vec3 deep : source_color = vec3(0.04, 0.17, 0.27);
uniform sampler2D depth_texture : hint_depth_texture, filter_linear_mipmap;
uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;
uniform float foam_width = 0.9;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
	return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float waves(vec2 p, float t){ return noise(p*.35+vec2(t*.12,t*.05))*.6 + noise(p*1.1-vec2(t*.2,-t*.13))*.3 + noise(p*3.1+t*.4)*.1; }
varying vec3 world;
void vertex(){
	world = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	VERTEX.y += (waves(world.xz, TIME) - .5) * .18;
}
void fragment(){
	float e = .15, t = TIME;
	float h = waves(world.xz, t), hx = waves(world.xz + vec2(e,0), t), hz = waves(world.xz + vec2(0,e), t);
	NORMAL = normalize((VIEW_MATRIX * vec4(normalize(vec3((h-hx)/e*.6, 1.0, (h-hz)/e*.6)), 0.0)).xyz);
	float scene_depth = texture(depth_texture, SCREEN_UV).r;
	vec4 world_pos = INV_PROJECTION_MATRIX * vec4(SCREEN_UV * 2.0 - 1.0, scene_depth, 1.0);
	world_pos.xyz /= world_pos.w;
	float thickness = clamp(-world_pos.z + VERTEX.z, 0.0, 30.0);
	float d = 1.0 - exp(-thickness * .35);
	vec3 refr = texture(screen_texture, SCREEN_UV + NORMAL.xz * .01).rgb;
	vec3 colour = mix(mix(refr, shallow, .55), deep, d);
	float foam = smoothstep(foam_width, 0.0, thickness) * (.6 + .4 * noise(world.xz * 4.0 + t));
	ALBEDO = mix(colour, vec3(.95), foam * .85);
	ROUGHNESS = mix(.04, .6, foam);
	METALLIC = 0.0; SPECULAR = .6;
}
