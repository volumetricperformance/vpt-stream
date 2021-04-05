varying vec2 vUv;
uniform float pointSize;
uniform float depthMin;
uniform float depthMax;
uniform float scale;
uniform vec3 thresholdMin;
uniform vec3 thresholdMax;

void main()
{
  vUv = uv;
  gl_Position =  projectionMatrix * modelViewMatrix * vec4(position,1.0);
}