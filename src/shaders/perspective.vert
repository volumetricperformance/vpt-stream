
uniform vec2 focalLength;//fx,fy
uniform vec2 principalPoint;//ppx,ppy
uniform vec2 imageDimensions;
uniform mat4 extrinsics;
uniform float width;
uniform float height;
uniform float scale;
uniform sampler2D map;

uniform float pointSize;
uniform float depthMin;
uniform float depthMax;
uniform vec3 thresholdMin;
uniform vec3 thresholdMax;
varying vec4 ptColor;
varying vec2 vUv;
varying vec3 debug;

const float _DepthSaturationThreshhold = 0.3; //a given pixel whose saturation is less than half will be culled (old default was .5)
const float _DepthBrightnessThreshold = 0.3; //a given pixel whose brightness is less than half will be culled (old default was .9)
const float  _Epsilon = .03;

#define BRIGHTNESS_THRESHOLD_OFFSET 0.01
#define FLOAT_EPS 0.00001
#define CLIP_EPSILON 0.005

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + FLOAT_EPS)), d / (q.x + FLOAT_EPS), q.x);
}

float depthForPoint(vec2 texturePoint)
{       
    vec2 centerpix = vec2(1.0/width, 1.0/height) * 0.5;
    texturePoint += centerpix;

    // clamp to texture bounds - 0.5 pixelsize so we do not sample outside our texture
    texturePoint = clamp(texturePoint, centerpix, vec2(1.0, 0.5) - centerpix);
    vec4 depthsample = texture2D(map, texturePoint);
    vec3 depthsamplehsv = rgb2hsv(depthsample.rgb);
    return depthsamplehsv.b > _DepthBrightnessThreshold + BRIGHTNESS_THRESHOLD_OFFSET ? depthsamplehsv.r : 0.0;
}

//https://stackoverflow.com/questions/12751080/glsl-point-inside-box-test/37426532
float insideBox3D(vec3 v, vec3 bottomLeft, vec3 topRight) {
    vec3 s = step(bottomLeft, v) - step(topRight, v);
    return s.x * s.y * s.z; 
}

void main()
{   
    vec4 texSize = vec4(1.0 / width, 1.0 / height, width, height);
    vec2 basetex = position.xy + vec2(0.5,0.5);

    // we align our depth pixel centers with the center of each quad, so we do not require a half pixel offset
    vec2 depthTexCoord = basetex * vec2(1.0, 0.5);
    vec2 colorTexCoord = basetex * vec2(1.0, 0.5) + vec2(0.0, 0.5);

    float depth = depthForPoint(depthTexCoord);
    float mindepth = depthMin;
    float maxdepth = depthMax;

    float z = depth * (maxdepth - mindepth) + mindepth;
    vec2 ortho = basetex * imageDimensions - principalPoint;
    vec2 proj = ortho * z / focalLength;
    vec4 worldPos = extrinsics *  vec4(proj.xy, z, 1.0);
    worldPos.w = 1.0;

    vec4 mvPosition = vec4( worldPos.xyz, 1.0 );
    mvPosition = modelViewMatrix * mvPosition;
    ptColor = texture2D(map, colorTexCoord);

    ptColor.a = insideBox3D(worldPos.xyz, thresholdMin, thresholdMax ) > 0.0 && depth > 0.0 ? 1.0 : 0.0;

    mat4 flip = mat4(  vec4(-1.0,0.0,0.0,0.0),
                        vec4(0.0,1.0,0.0,0.0),
                        vec4(0.0,0.0,1.0,0.0),
                        vec4(0.0,0.0,0.0,1.0));
    
    gl_Position = projectionMatrix * modelViewMatrix * flip * worldPos;
    vUv = uv;
    debug = vec3(1, 0.5, 0.0);

    gl_PointSize = pointSize;
    gl_PointSize *= ( scale / - mvPosition.z );

}
