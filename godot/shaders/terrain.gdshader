// Blended CC0 ground: grass, meadow, sand, granite and gravel by vertex weights (COLOR rgba +
// remainder grass), sampled in world space with a far-scale layer that hides tiling.
shader_type spatial;
render_mode diffuse_burley;
uniform sampler2D grass_albedo : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D meadow_albedo : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D sand_albedo : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D granite_albedo : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D gravel_albedo : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D grass_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D granite_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D grass_arm : filter_linear_mipmap, repeat_enable;
uniform float tile = 6.0;
uniform vec3 summer_tint : source_color = vec3(0.86, 1.0, 0.78);
varying vec3 world;
void vertex(){ world = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
vec3 blend(vec2 uv, vec4 w){
	float g = max(0.0, 1.0 - w.r - w.g - w.b - w.a);
	return texture(grass_albedo, uv).rgb * g + texture(meadow_albedo, uv * .83).rgb * w.r + texture(sand_albedo, uv * .9).rgb * w.g
		+ texture(granite_albedo, uv * .6).rgb * w.b + texture(gravel_albedo, uv * 1.2).rgb * w.a;
}
void fragment(){
	vec2 uv = world.xz / tile;
	vec4 w = clamp(COLOR, 0.0, 1.0);
	vec3 near_c = blend(uv, w), far_c = blend(uv * .173 + .31, w);
	float grassy = max(0.0, 1.0 - w.g - w.b - w.a);
	ALBEDO = mix(near_c, far_c, .3) * mix(vec3(1.0), summer_tint, grassy);
	NORMAL_MAP = mix(texture(grass_normal, uv).rgb, texture(granite_normal, uv * .6).rgb, w.b);
	vec3 arm = texture(grass_arm, uv).rgb;
	AO = arm.r; AO_LIGHT_AFFECT = .6;
	ROUGHNESS = mix(.85, .95, arm.g) - w.g * .1;
}
