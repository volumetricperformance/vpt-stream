
uniform sampler2D map;
uniform float opacity;
uniform float width;
uniform float height;

varying vec4 ptColor;
varying vec2 vUv;
varying vec3 debug;

void main() {

    if( ptColor.a <= 0.0){
        discard;
    }

    vec4 colorSample = ptColor;
    colorSample.a *= (ptColor.a * opacity);

    gl_FragColor = colorSample;
}