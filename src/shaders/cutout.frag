uniform sampler2D map;
uniform float opacity;
uniform float width;
uniform float height;
uniform float depthMin;
uniform float depthMax;
uniform vec3 thresholdMin;
uniform vec3 thresholdMax;

varying vec2 vUv;

#define BRIGHTNESS_THRESHOLD_OFFSET 0.01
#define FLOAT_EPS 0.00001

const float _DepthSaturationThreshhold = 0.3; //a given pixel whose saturation is less than half will be culled (old default was .5)
const float _DepthBrightnessThreshold = 0.4; //a given pixel whose brightness is less than half will be culled (old default was .9)

vec3 rgb2hsv(vec3 c)
{
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + FLOAT_EPS)), d / (q.x + FLOAT_EPS), q.x);
}

void main() {

  float verticalScale = 0.5;//480.0 / 720.0;
  float verticalOffset = 1.0 - verticalScale;

  vec2 colorUv = vUv * vec2(1.0, verticalScale) + vec2(0.0, 0.5);
  vec2 depthUv = colorUv - vec2(0.0, 0.5);

  vec4 colorSample = texture2D(map, colorUv); 
  vec4 depthSample = texture2D(map, depthUv); 

  vec3 hsv = rgb2hsv(depthSample.rgb);
  float depth = hsv.b > _DepthBrightnessThreshold + BRIGHTNESS_THRESHOLD_OFFSET ? hsv.r : 0.0;
  float z = depth * (depthMax - depthMin) + depthMin;
  float alpha = depth > 0.0 && z > thresholdMin.z && z < thresholdMax.z ? 1.0 : 0.0;

  if(alpha <= 0.0) {
    discard;
  }

  colorSample.a *= (alpha * opacity);

  gl_FragColor = colorSample;
}