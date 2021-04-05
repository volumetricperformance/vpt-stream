uniform sampler2D map;

uniform float pointSize;
uniform float depthMin;
uniform float depthMax;
uniform vec3 thresholdMin;
uniform vec3 thresholdMax;
uniform float scale;
varying vec4 ptColor;
varying vec2 vUv;
varying vec3 debug;

const float _DepthSaturationThreshhold = 0.3; //a given pixel whose saturation is less than half will be culled (old default was .5)
const float _DepthBrightnessThreshold = 0.3; //a given pixel whose brightness is less than half will be culled (old default was .9)
const float  _Epsilon = .03;

//https://github.com/tobspr/GLSL-Color-Spaces/blob/master/ColorSpaces.inc.glsl
const float SRGB_GAMMA = 1.0 / 2.2;
const float SRGB_INVERSE_GAMMA = 2.2;
const float SRGB_ALPHA = 0.055;

// Converts a single srgb channel to rgb
float srgb_to_linear(float channel) {
  if (channel <= 0.04045)
      return channel / 12.92;
  else
      return pow((channel + SRGB_ALPHA) / (1.0 + SRGB_ALPHA), 2.4);
}

// Converts a srgb color to a linear rgb color (exact, not approximated)
vec3 srgb_to_rgb(vec3 srgb) {
  return vec3(
      srgb_to_linear(srgb.r),
      srgb_to_linear(srgb.g),
      srgb_to_linear(srgb.b)
  );
}

//faster but noisier
vec3 srgb_to_rgb_approx(vec3 srgb) {
return pow(srgb, vec3(SRGB_INVERSE_GAMMA));
}

vec3 rgb2hsv(vec3 c)
{
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + _Epsilon)), d / (q.x + _Epsilon), q.x);
}


float depthForPoint(vec2 texturePoint)
{
  vec4 depthsample = texture2D(map, texturePoint);
  vec3 linear = srgb_to_rgb( depthsample.rgb);
  vec3 depthsamplehsv = rgb2hsv(linear.rgb);
  return depthsamplehsv.g > _DepthSaturationThreshhold && depthsamplehsv.b > _DepthBrightnessThreshold ? depthsamplehsv.r : 0.0;
}

void main()
{
  float mindepth = depthMin;
  float maxdepth = depthMax;

  float verticalScale = 0.5;//480.0 / 720.0;
  float verticalOffset = 1.0 - verticalScale;

  vec2 colorUv = uv * vec2(1.0, verticalScale) + vec2(0.0, 0.5);
  vec2 depthUv = colorUv - vec2(0.0, 0.5);

  float depth = depthForPoint(depthUv);

  float z = depth * (maxdepth - mindepth) + mindepth;
  
  vec4 worldPos = vec4(position.xy, -z, 1.0);
  worldPos.w = 1.0;

  vec4 mvPosition = vec4( worldPos.xyz, 1.0 );
  mvPosition = modelViewMatrix * mvPosition;

  ptColor = texture2D(map, colorUv);

  gl_Position = projectionMatrix * modelViewMatrix * worldPos;
  vUv = uv;
  debug = vec3(1, 0.5, 0.0);
  
  gl_PointSize = pointSize;
  gl_PointSize *= ( scale / - mvPosition.z );

  //gl_Position =  projectionMatrix * modelViewMatrix * vec4(position,1.0);
}