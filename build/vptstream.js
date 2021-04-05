(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.VPTStream = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

module.exports = function (strings) {
  if (typeof strings === 'string') strings = [strings];
  var exprs = [].slice.call(arguments, 1);
  var parts = [];

  for (var i = 0; i < strings.length - 1; i++) {
    parts.push(strings[i], exprs[i] || '');
  }

  parts.push(strings[i]);
  return parts.join('');
};

},{}],2:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var glsl = require('glslify');

var rgbdFrag = glsl(["#define GLSLIFY 1\nuniform sampler2D map;\nuniform float opacity;\nuniform float width;\nuniform float height;\n\nvarying vec4 ptColor;\nvarying vec2 vUv;\nvarying vec3 debug;\n\nvoid main() {\n\n    if( ptColor.a <= 0.0){\n        discard;\n    }\n\n    vec4 colorSample = ptColor;\n    colorSample.a *= (ptColor.a * opacity);\n\n    gl_FragColor = colorSample;\n}"]);
var rgbdVert = glsl(["#define GLSLIFY 1\nuniform vec2 focalLength;//fx,fy\nuniform vec2 principalPoint;//ppx,ppy\nuniform vec2 imageDimensions;\nuniform mat4 extrinsics;\nuniform float width;\nuniform float height;\nuniform float scale;\nuniform sampler2D map;\n\nuniform float pointSize;\nuniform float depthMin;\nuniform float depthMax;\nuniform vec3 thresholdMin;\nuniform vec3 thresholdMax;\nvarying vec4 ptColor;\nvarying vec2 vUv;\nvarying vec3 debug;\n\nconst float _DepthSaturationThreshhold = 0.3; //a given pixel whose saturation is less than half will be culled (old default was .5)\nconst float _DepthBrightnessThreshold = 0.3; //a given pixel whose brightness is less than half will be culled (old default was .9)\nconst float  _Epsilon = .03;\n\n#define BRIGHTNESS_THRESHOLD_OFFSET 0.01\n#define FLOAT_EPS 0.00001\n#define CLIP_EPSILON 0.005\n\nvec3 rgb2hsv(vec3 c)\n{\n    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n    float d = q.x - min(q.w, q.y);\n    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + FLOAT_EPS)), d / (q.x + FLOAT_EPS), q.x);\n}\n\nfloat depthForPoint(vec2 texturePoint)\n{       \n    vec2 centerpix = vec2(1.0/width, 1.0/height) * 0.5;\n    texturePoint += centerpix;\n\n    // clamp to texture bounds - 0.5 pixelsize so we do not sample outside our texture\n    texturePoint = clamp(texturePoint, centerpix, vec2(1.0, 0.5) - centerpix);\n    vec4 depthsample = texture2D(map, texturePoint);\n    vec3 depthsamplehsv = rgb2hsv(depthsample.rgb);\n    return depthsamplehsv.b > _DepthBrightnessThreshold + BRIGHTNESS_THRESHOLD_OFFSET ? depthsamplehsv.r : 0.0;\n}\n\n//https://stackoverflow.com/questions/12751080/glsl-point-inside-box-test/37426532\nfloat insideBox3D(vec3 v, vec3 bottomLeft, vec3 topRight) {\n    vec3 s = step(bottomLeft, v) - step(topRight, v);\n    return s.x * s.y * s.z; \n}\n\nvoid main()\n{   \n    vec4 texSize = vec4(1.0 / width, 1.0 / height, width, height);\n    vec2 basetex = position.xy + vec2(0.5,0.5);\n\n    // we align our depth pixel centers with the center of each quad, so we do not require a half pixel offset\n    vec2 depthTexCoord = basetex * vec2(1.0, 0.5);\n    vec2 colorTexCoord = basetex * vec2(1.0, 0.5) + vec2(0.0, 0.5);\n\n    float depth = depthForPoint(depthTexCoord);\n    float mindepth = depthMin;\n    float maxdepth = depthMax;\n\n    float z = depth * (maxdepth - mindepth) + mindepth;\n    vec2 ortho = basetex * imageDimensions - principalPoint;\n    vec2 proj = ortho * z / focalLength;\n    vec4 worldPos = extrinsics *  vec4(proj.xy, z, 1.0);\n    worldPos.w = 1.0;\n\n    vec4 mvPosition = vec4( worldPos.xyz, 1.0 );\n    mvPosition = modelViewMatrix * mvPosition;\n    ptColor = texture2D(map, colorTexCoord);\n\n    ptColor.a = insideBox3D(worldPos.xyz, thresholdMin, thresholdMax ) > 0.0 && depth > 0.0 ? 1.0 : 0.0;\n\n    mat4 flip = mat4(  vec4(-1.0,0.0,0.0,0.0),\n                        vec4(0.0,1.0,0.0,0.0),\n                        vec4(0.0,0.0,1.0,0.0),\n                        vec4(0.0,0.0,0.0,1.0));\n    \n    gl_Position = projectionMatrix * modelViewMatrix * flip * worldPos;\n    vUv = uv;\n    debug = vec3(1, 0.5, 0.0);\n\n    gl_PointSize = pointSize;\n    gl_PointSize *= ( scale / - mvPosition.z );\n\n}\n"]);
var orthoFrag = glsl(["#define GLSLIFY 1\nuniform sampler2D map;\nuniform float opacity;\nuniform float width;\nuniform float height;\nuniform float depthMin;\nuniform float depthMax;\nuniform vec3 thresholdMin;\nuniform vec3 thresholdMax;\n\nvarying vec4 ptColor;\nvarying vec2 vUv;\nvarying vec3 debug;\n\n#define BRIGHTNESS_THRESHOLD_OFFSET 0.01\n#define FLOAT_EPS 0.00001\n\nconst float _DepthSaturationThreshhold = 0.3; //a given pixel whose saturation is less than half will be culled (old default was .5)\nconst float _DepthBrightnessThreshold = 0.6; //a given pixel whose brightness is less than half will be culled (old default was .9)\n\nvec3 rgb2hsv(vec3 c)\n{\n    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n    float d = q.x - min(q.w, q.y);\n    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + FLOAT_EPS)), d / (q.x + FLOAT_EPS), q.x);\n}\n\nfloat depthForPoint(vec2 texturePoint)\n{\n    vec4 depthsample = texture2D(map, texturePoint);\n    vec3 depthsamplehsv = rgb2hsv(depthsample.rgb);\n    return depthsamplehsv.g > _DepthSaturationThreshhold && depthsamplehsv.b > _DepthBrightnessThreshold ? depthsamplehsv.r : 0.0;\n}\n\nvoid main() {\n\n  /*float verticalScale = 480.0 / 720.0;\n  float verticalOffset = 1.0 - verticalScale;\n  vec2 colorUv = vUv * vec2(0.5, verticalScale) + vec2(0, verticalOffset);\n  vec2 depthUv = colorUv + vec2(0.5, 0.0);*/\n\n    float verticalScale = 0.5;//480.0 / 720.0;\n    float verticalOffset = 1.0 - verticalScale;\n\n    vec2 colorUv = vUv * vec2(1.0, verticalScale) + vec2(0.0, 0.5);\n    vec2 depthUv = colorUv - vec2(0.0, 0.5);\n\n    vec4 colorSample = ptColor;// texture2D(map, colorUv); \n    vec4 depthSample = texture2D(map, depthUv); \n\n    vec3 hsv = rgb2hsv(depthSample.rgb);\n    float depth = hsv.b > _DepthBrightnessThreshold + BRIGHTNESS_THRESHOLD_OFFSET ? hsv.r : 0.0;\n    float z = depth * (depthMax - depthMin) + depthMin;\n    float alpha = depth > 0.0 && z > thresholdMin.z && z < thresholdMax.z ? 1.0 : 0.0;\n\n    if(alpha <= 0.0) {\n      discard;\n    }\n\n    colorSample.a *= (alpha * opacity);\n\n    gl_FragColor = colorSample;//vec4(debug, 1);\n}"]);
var orthoVert = glsl(["#define GLSLIFY 1\nuniform sampler2D map;\n\nuniform float pointSize;\nuniform float depthMin;\nuniform float depthMax;\nuniform vec3 thresholdMin;\nuniform vec3 thresholdMax;\nuniform float scale;\nvarying vec4 ptColor;\nvarying vec2 vUv;\nvarying vec3 debug;\n\nconst float _DepthSaturationThreshhold = 0.3; //a given pixel whose saturation is less than half will be culled (old default was .5)\nconst float _DepthBrightnessThreshold = 0.3; //a given pixel whose brightness is less than half will be culled (old default was .9)\nconst float  _Epsilon = .03;\n\n//https://github.com/tobspr/GLSL-Color-Spaces/blob/master/ColorSpaces.inc.glsl\nconst float SRGB_GAMMA = 1.0 / 2.2;\nconst float SRGB_INVERSE_GAMMA = 2.2;\nconst float SRGB_ALPHA = 0.055;\n\n// Converts a single srgb channel to rgb\nfloat srgb_to_linear(float channel) {\n  if (channel <= 0.04045)\n      return channel / 12.92;\n  else\n      return pow((channel + SRGB_ALPHA) / (1.0 + SRGB_ALPHA), 2.4);\n}\n\n// Converts a srgb color to a linear rgb color (exact, not approximated)\nvec3 srgb_to_rgb(vec3 srgb) {\n  return vec3(\n      srgb_to_linear(srgb.r),\n      srgb_to_linear(srgb.g),\n      srgb_to_linear(srgb.b)\n  );\n}\n\n//faster but noisier\nvec3 srgb_to_rgb_approx(vec3 srgb) {\nreturn pow(srgb, vec3(SRGB_INVERSE_GAMMA));\n}\n\nvec3 rgb2hsv(vec3 c)\n{\n  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n\n  float d = q.x - min(q.w, q.y);\n  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + _Epsilon)), d / (q.x + _Epsilon), q.x);\n}\n\nfloat depthForPoint(vec2 texturePoint)\n{\n  vec4 depthsample = texture2D(map, texturePoint);\n  vec3 linear = srgb_to_rgb( depthsample.rgb);\n  vec3 depthsamplehsv = rgb2hsv(linear.rgb);\n  return depthsamplehsv.g > _DepthSaturationThreshhold && depthsamplehsv.b > _DepthBrightnessThreshold ? depthsamplehsv.r : 0.0;\n}\n\nvoid main()\n{\n  float mindepth = depthMin;\n  float maxdepth = depthMax;\n\n  float verticalScale = 0.5;//480.0 / 720.0;\n  float verticalOffset = 1.0 - verticalScale;\n\n  vec2 colorUv = uv * vec2(1.0, verticalScale) + vec2(0.0, 0.5);\n  vec2 depthUv = colorUv - vec2(0.0, 0.5);\n\n  float depth = depthForPoint(depthUv);\n\n  float z = depth * (maxdepth - mindepth) + mindepth;\n  \n  vec4 worldPos = vec4(position.xy, -z, 1.0);\n  worldPos.w = 1.0;\n\n  vec4 mvPosition = vec4( worldPos.xyz, 1.0 );\n  mvPosition = modelViewMatrix * mvPosition;\n\n  ptColor = texture2D(map, colorUv);\n\n  gl_Position = projectionMatrix * modelViewMatrix * worldPos;\n  vUv = uv;\n  debug = vec3(1, 0.5, 0.0);\n  \n  gl_PointSize = pointSize;\n  gl_PointSize *= ( scale / - mvPosition.z );\n\n  //gl_Position =  projectionMatrix * modelViewMatrix * vec4(position,1.0);\n}"]);
var cutoutFrag = glsl(["#define GLSLIFY 1\nuniform sampler2D map;\nuniform float opacity;\nuniform float width;\nuniform float height;\nuniform float depthMin;\nuniform float depthMax;\nuniform vec3 thresholdMin;\nuniform vec3 thresholdMax;\n\nvarying vec2 vUv;\n\n#define BRIGHTNESS_THRESHOLD_OFFSET 0.01\n#define FLOAT_EPS 0.00001\n\nconst float _DepthSaturationThreshhold = 0.3; //a given pixel whose saturation is less than half will be culled (old default was .5)\nconst float _DepthBrightnessThreshold = 0.4; //a given pixel whose brightness is less than half will be culled (old default was .9)\n\nvec3 rgb2hsv(vec3 c)\n{\n  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n  float d = q.x - min(q.w, q.y);\n  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + FLOAT_EPS)), d / (q.x + FLOAT_EPS), q.x);\n}\n\nvoid main() {\n\n  float verticalScale = 0.5;//480.0 / 720.0;\n  float verticalOffset = 1.0 - verticalScale;\n\n  vec2 colorUv = vUv * vec2(1.0, verticalScale) + vec2(0.0, 0.5);\n  vec2 depthUv = colorUv - vec2(0.0, 0.5);\n\n  vec4 colorSample = texture2D(map, colorUv); \n  vec4 depthSample = texture2D(map, depthUv); \n\n  vec3 hsv = rgb2hsv(depthSample.rgb);\n  float depth = hsv.b > _DepthBrightnessThreshold + BRIGHTNESS_THRESHOLD_OFFSET ? hsv.r : 0.0;\n  float z = depth * (depthMax - depthMin) + depthMin;\n  float alpha = depth > 0.0 && z > thresholdMin.z && z < thresholdMax.z ? 1.0 : 0.0;\n\n  if(alpha <= 0.0) {\n    discard;\n  }\n\n  colorSample.a *= (alpha * opacity);\n\n  gl_FragColor = colorSample;\n}"]);
var cutoutVert = glsl(["#define GLSLIFY 1\nvarying vec2 vUv;\nuniform float pointSize;\nuniform float depthMin;\nuniform float depthMax;\nuniform float scale;\nuniform vec3 thresholdMin;\nuniform vec3 thresholdMax;\n\nvoid main()\n{\n  vUv = uv;\n  gl_Position =  projectionMatrix * modelViewMatrix * vec4(position,1.0);\n}"]);
var HLS_TIMEOUT = 2500;
var schema = {
  videoPath: {
    type: 'string'
  },
  meta: {
    type: 'object',
    defaults: {}
  },
  startat: {
    type: 'number',
    "default": 0
  },
  renderMode: {
    type: 'string',
    "default": 'perspective'
  },
  depthMin: {
    type: 'number',
    "default": 0.29
  },
  depthMax: {
    type: 'number',
    "default": 4.0
  },
  pointSize: {
    type: 'number',
    "default": 8.0
  },
  scale: {
    type: 'number',
    "default": 1.0
  },
  textureSize: {
    type: 'vec2',
    "default": {
      w: 320,
      h: 240
    }
  },
  thresholdMin: {
    type: 'vec3',
    "default": {
      x: -2.0,
      y: -2.0,
      z: 0.0
    }
  },
  thresholdMax: {
    type: 'vec3',
    "default": {
      x: 2.0,
      y: 2.0,
      z: 4.0
    }
  }
};
var STREAMEVENTS = Object.freeze({
  PLAY_SUCCESS: "PLAY_SUCCESS",
  PLAY_ERROR: "PLAY_ERROR",
  LOAD_ERROR: "LOAD_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  MEDIA_ERROR: "MEDIA_ERROR",
  HLS_ERROR: "HLS_ERROR"
}); //Volumetric Performance Toolbox streaming player

var VPTStream = /*#__PURE__*/function (_THREE$Object3D) {
  _inherits(VPTStream, _THREE$Object3D);

  var _super = _createSuper(VPTStream);

  function VPTStream() {
    var _this2;

    _classCallCheck(this, VPTStream);

    _this2 = _super.call(this);
    _this2.video = _this2.createVideoEl();
    _this2.texture = new THREE.VideoTexture(_this2.video);
    _this2.texture.minFilter = THREE.NearestFilter;
    _this2.texture.magFilter = THREE.LinearFilter;
    _this2.texture.format = THREE.RGBFormat;
    _this2.hls = null; //When using vptstream in mozilla hubs/spoke we run into issues with the proxy / cors setup and the way Hls resolves urls.
    //Hack copied from her: https://github.com/mozilla/hubs/blob/584e48ad0ccc0da1fc9781e7686d19431a2340cd/src/components/media-views.js#L773
    //the function params / signature is (xhr, u)  

    _this2.hls_xhroverride = null;
    _this2.loadTime = 0;
    _this2.playing = false;
    _this2.meshScalar = 2;
    _this2.params = {};
    return _this2;
  }

  _createClass(VPTStream, [{
    key: "LoadTime",
    get: function get() {
      return this.loadTime;
    }
  }, {
    key: "Playing",
    get: function get() {
      return this.playing;
    }
  }, {
    key: "updateParameter",
    value: function updateParameter(param, value) {
      if (param == "startat") {
        this.video.currentTime = value;
      } else {
        if (this.material) {
          this.material.uniforms[param].value = value;
        }
      }
    }
  }, {
    key: "load",
    value: function load(params) {
      console.log("vptstream load");

      for (var property in schema) {
        console.log("".concat(property, " value:").concat(params[property], " default:").concat(schema[property]["default"]));
        this.params[property] = params.hasOwnProperty(property) ? params[property] : schema[property]["default"];
      }

      if (this.params.meta.hasOwnProperty("depthFocalLength")) {
        this.setProps(this.params.meta);
      } else {
        console.error("invalid meta data for perspective rendering, default to cutout");
        this.params.renderMode = "cutout";
      } //so far we have not had to use custom extrinsice for Azure Kinect or Realsense
      //default could suffice as the alignment is done upstream, when we grab if from the sensor
      //leaving this here to allow for textures that still need alignment 


      var extrinsics = new THREE.Matrix4();
      var ex = this.props.extrinsics;
      extrinsics.set(ex["e00"], ex["e10"], ex["e20"], ex["e30"], ex["e01"], ex["e11"], ex["e21"], ex["e31"], ex["e02"], ex["e12"], ex["e22"], ex["e32"], ex["e03"], ex["e13"], ex["e23"], ex["e33"]);

      if (this.material) {
        console.log("Material exists, dispose");
        this.material.dispose();
        var child = this.getObjectByName("VolumetricVideo");

        if (child) {
          console.log("VolumetricVideo exists, remove");
          this.remove(child);
        }
      }

      this.startVideo(this.params.videoPath);
      var geometry = new THREE.PlaneBufferGeometry(1, 1, this.params.textureSize.w, this.params.textureSize.h);

      switch (this.params.renderMode) {
        case "ortho":
          this.material = new THREE.ShaderMaterial({
            uniforms: {
              "map": {
                type: "t",
                value: this.texture
              },
              "time": {
                type: "f",
                value: 0.0
              },
              "opacity": {
                type: "f",
                value: 1.0
              },
              "pointSize": {
                type: "f",
                value: this.params.pointSize
              },
              "depthMin": {
                type: "f",
                value: this.params.depthMin
              },
              "depthMax": {
                type: "f",
                value: this.params.depthMax
              },
              "thresholdMin": {
                value: this.params.thresholdMin
              },
              "thresholdMax": {
                value: this.params.thresholdMax
              },
              "scale": {
                value: this.params.scale
              },
              extensions: {
                derivatives: true
              }
            },
            side: THREE.DoubleSide,
            vertexShader: orthoVert,
            fragmentShader: orthoFrag,
            transparent: true //depthWrite:falses

          });
          var pointsO = new THREE.Points(geometry, this.material);
          pointsO.position.y = 1;
          pointsO.name = "VolumetricVideo";
          this.add(pointsO);
          break;

        case "cutout":
          this.material = new THREE.ShaderMaterial({
            uniforms: {
              "map": {
                type: "t",
                value: this.texture
              },
              "time": {
                type: "f",
                value: 0.0
              },
              "opacity": {
                type: "f",
                value: 1.0
              },
              "depthMin": {
                type: "f",
                value: this.params.depthMin
              },
              "depthMax": {
                type: "f",
                value: this.params.depthMax
              },
              "thresholdMin": {
                value: this.params.thresholdMin
              },
              "thresholdMax": {
                value: this.params.thresholdMax
              },
              "scale": {
                value: this.params.scale
              },
              extensions: {
                derivatives: true
              }
            },
            side: THREE.DoubleSide,
            vertexShader: cutoutVert,
            fragmentShader: cutoutFrag,
            transparent: true
          });
          var plane = new THREE.Mesh(geometry, this.material);
          plane.position.y = 1;
          plane.scale.set(this.params.textureSize.w / this.params.textureSize.h, 1.0, 1.0);
          plane.name = "VolumetricVideo";
          this.add(plane);
          break;

        case "perspective":
          //assumes depthkit style hsv encoding
          //Material
          this.material = new THREE.ShaderMaterial({
            uniforms: {
              "map": {
                type: "t",
                value: this.texture
              },
              "pointSize": {
                type: "f",
                value: this.params.pointSize
              },
              "depthMin": {
                type: "f",
                value: this.params.depthMin
              },
              "depthMax": {
                type: "f",
                value: this.params.depthMax
              },
              "scale": {
                value: this.params.scale
              },
              "focalLength": {
                value: this.props.depthFocalLength
              },
              "principalPoint": {
                value: this.props.depthPrincipalPoint
              },
              "imageDimensions": {
                value: this.props.depthImageSize
              },
              "width": {
                value: this.props.textureWidth
              },
              "height": {
                value: this.props.textureHeight
              },
              "thresholdMin": {
                value: this.params.thresholdMin
              },
              "thresholdMax": {
                value: this.params.thresholdMax
              },
              "extrinsics": {
                value: extrinsics
              },
              "opacity": {
                type: "f",
                value: 1.0
              }
            },
            extensions: {
              derivatives: true
            },
            vertexShader: rgbdVert,
            fragmentShader: rgbdFrag,
            transparent: true
          }); //Make the shader material double sided

          this.material.side = THREE.DoubleSide;
          var pointP = new THREE.Points(geometry, this.material);
          pointP.name = "VolumetricVideo";
          pointP.position.y = 1;
          this.add(pointP);
          break;

        case "perspective_rl2":
          //assuming librealsense2 hsv colorizer
          //https://dev.intelrealsense.com/docs/depth-image-compression-by-colorization-for-intel-realsense-depth-cameras#section-6references
          //Material
          this.material = new THREE.ShaderMaterial({
            uniforms: {
              "map": {
                type: "t",
                value: this.texture
              },
              "pointSize": {
                type: "f",
                value: this.params.pointSize
              },
              "depthMin": {
                type: "f",
                value: this.params.depthMin
              },
              "depthMax": {
                type: "f",
                value: this.params.depthMax
              },
              "scale": {
                value: this.params.scale
              },
              "focalLength": {
                value: this.props.depthFocalLength
              },
              "principalPoint": {
                value: this.props.depthPrincipalPoint
              },
              "imageDimensions": {
                value: this.props.depthImageSize
              },
              "width": {
                value: this.props.textureWidth
              },
              "height": {
                value: this.props.textureHeight
              },
              "thresholdMin": {
                value: this.params.thresholdMin
              },
              "thresholdMax": {
                value: this.params.thresholdMax
              },
              "extrinsics": {
                value: extrinsics
              },
              "opacity": {
                type: "f",
                value: 1.0
              }
            },
            extensions: {
              derivatives: true
            },
            vertexShader: rgbdVert_rs2,
            fragmentShader: rgbdFrag_rs2,
            transparent: true
          }); //Make the shader material double sided

          this.material.side = THREE.DoubleSide;
          var pointPRL2 = new THREE.Points(geometry, this.material);
          pointPRL2.name = "VolumetricVideo";
          pointPRL2.position.y = 1;
          this.add(pointPRL2);
          break;
      }
    } //load depth camera properties for perspective reprojection

  }, {
    key: "loadPropsFromFile",
    value: function loadPropsFromFile(filePath) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var jsonLoader = new THREE.FileLoader(_this3.manager);
        jsonLoader.setResponseType('json');
        jsonLoader.load(filePath, function (data) {
          resolve(data);
        }, null, function (err) {
          reject(err);
        });
      });
    } //set perspective projection properties

  }, {
    key: "setProps",
    value: function setProps(_props) {
      this.props = _props;

      if (this.props.textureWidth == undefined || this.props.textureHeight == undefined) {
        this.props.textureWidth = this.props.depthImageSize.x;
        this.props.textureHeight = this.props.depthImageSize.y * 2;
      }

      if (this.props.extrinsics == undefined) {
        this.props.extrinsics = {
          e00: 1,
          e01: 0,
          e02: 0,
          e03: 0,
          e10: 0,
          e11: 1,
          e12: 0,
          e13: 0,
          e20: 0,
          e21: 0,
          e22: 1,
          e23: 0,
          e30: 0,
          e31: 0,
          e32: 0,
          e33: 1
        };
      }

      if (this.props.crop == undefined) {
        this.props.crop = {
          x: 0,
          y: 0,
          z: 1,
          w: 1
        };
      }
    }
  }, {
    key: "play",
    value: function play() {
      this.video.play().then(function () {
        this.dispatchEvent({
          type: STREAMEVENTS.PLAY_SUCCESS,
          message: "autoplay success"
        });
        this.playing = true;
      })["catch"](function (error) {
        this.dispatchEvent({
          type: STREAMEVENTS.PLAY_ERROR,
          message: "autoplay error"
        });
        this.playing = false;
      });
      return this.playing;
    }
  }, {
    key: "stop",
    value: function stop() {
      this.video.stop();
    }
  }, {
    key: "pause",
    value: function pause() {}
  }, {
    key: "setVolume",
    value: function setVolume(volume) {
      this.video.volume = volume;
    }
  }, {
    key: "update",
    value: function update(time) {
      this._material.uniforms.time.value = time;
    }
  }, {
    key: "createVideoEl",
    value: function createVideoEl() {
      var el = document.createElement("video");
      el.setAttribute("id", "volumetric-stream-video");
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", ""); // iOS Safari requires the autoplay attribute, or it won't play the video at all.

      el.autoplay = true; // iOS Safari will not play videos without user interaction. We mute the video so that it can autoplay and then
      // allow the user to unmute it with an interaction in the unmute-video-button component.

      el.muted = false;
      el.preload = "auto";
      el.crossOrigin = "anonymous";
      console.log("Volumetric Stream: Video element created", el);
      return el;
    }
  }, {
    key: "scaleToAspectRatio",
    value: function scaleToAspectRatio(el, ratio) {
      var width = Math.min(1.0, 1.0 / ratio);
      var height = Math.min(1.0, ratio);
      el.object3DMap.mesh.scale.set(width, height, 1);
      el.object3DMap.mesh.matrixNeedsUpdate = true;
    }
  }, {
    key: "dispose",
    value: function dispose() {
      if (this.texture.image instanceof HTMLVideoElement) {
        var video = this.texture.image;
        video.pause();
        video.src = "";
        video.load();
      }

      if (this.hls) {
        this.hls.stopLoad();
        this.hls.detachMedia();
        this.hls.destroy();
        this.hls = null;
      }

      this.texture.dispose();
      this.material.dispose();
    }
  }, {
    key: "setVideoUrl",
    value: function setVideoUrl(videoUrl) {
      if (this.hls) {
        this.startVideo(videoUrl);
      }
    }
  }, {
    key: "startVideo",
    value: function startVideo(videoUrl) {
      var _this4 = this;

      console.log("startVideo " + videoUrl);

      if (Hls.isSupported()) {
        var baseUrl = videoUrl;

        var setupHls = function setupHls() {
          if (_this4.hls) {
            _this4.hls.stopLoad();

            _this4.hls.detachMedia();

            _this4.hls.destroy();

            _this4.hls = null;
          } //do we need to hook / override Hls xhr calls to handle cors proxying


          if (_this4.hls_xhroverride) {
            _this4.hls = new Hls({
              xhrSetup: _this4.hls_xhroverride
            });
          } else {
            _this4.hls = new Hls();
          }

          _this4.hls.loadSource(videoUrl);

          _this4.hls.attachMedia(_this4.video);

          _this4.hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  //console.log("NETWORK_ERROR", data )
                  _this4.dispatchEvent({
                    type: STREAMEVENTS.NETWORK_ERROR,
                    message: data.message
                  }); // try to recover network error


                  _this4.hls.startLoad();

                  break;

                case Hls.ErrorTypes.MEDIA_ERROR:
                  //console.log("MEDIA_ERROR", data )
                  _this4.dispatchEvent({
                    type: STREAMEVENTS.MEDIA_ERROR,
                    message: data.message
                  });

                  _this4.hls.recoverMediaError();

                  break;

                default:
                  //console.log("Hls ERROR", data )
                  _this4.dispatchEvent({
                    type: STREAMEVENTS.HLS_ERROR,
                    message: "hls error ".concat(data.type, " ").concat(data.message)
                  });

                  return;
              }
            } else {
              console.log("Hls non fatar error:", data);

              if (data.type == Hls.ErrorTypes.MEDIA_ERROR) {//this.hls.recoverMediaError();
              }
            }
          });

          _this4.hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            _this4.loadTime = performance.now();
            var _this = _this4;

            _this4.video.play().then(function () {
              console.log("Hls success auto playing " + _this.params.startat);
              _this.video.currentTime = _this.params.startat;

              _this.dispatchEvent({
                type: STREAMEVENTS.PLAY_SUCCESS,
                message: "autoplay success"
              });

              _this.playing = true;
            })["catch"](function (error) {
              //console.log("Hls error trying to auto play " + error + " " + error.name);
              _this.dispatchEvent({
                type: STREAMEVENTS.PLAY_ERROR,
                message: "error trying to auto play " + error + " " + error.name
              });

              _this.playing = false;
            });
          });
        };

        setupHls();
      } else if (this.video.canPlayType(contentType)) {
        this.video.src = videoUrl;
        this.video.onerror = failLoad;
        this.video.play().then(function () {
          this.dispatchEvent({
            type: STREAMEVENTS.PLAY_SUCCESS,
            message: "autoplay success"
          });
        })["catch"](function (error) {
          this.dispatchEvent({
            type: STREAMEVENTS.PLAY_ERROR,
            message: "autoplay error"
          });
          console.log("error autoplay", data);
        });
      } else {
        console.log("Hls unsupported, can't load or play");
        this.dispatchEvent({
          type: STREAMEVENTS.LOAD_ERROR,
          message: "Hls unsupported, can't play media"
        });
      }
    }
  }], [{
    key: "STREAMEVENTS",
    get: function get() {
      return STREAMEVENTS;
    }
  }]);

  return VPTStream;
}(THREE.Object3D);

module.exports = VPTStream;

},{"glslify":1}]},{},[2])(2)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ2xzbGlmeS9icm93c2VyLmpzIiwic3JjL3ZwdHN0cmVhbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsVUFBUyxPQUFULEVBQWtCO0FBQ2pDLE1BQUksT0FBTyxPQUFQLEtBQW1CLFFBQXZCLEVBQWlDLE9BQU8sR0FBRyxDQUFDLE9BQUQsQ0FBVjtBQUNqQyxNQUFJLEtBQUssR0FBRyxHQUFHLEtBQUgsQ0FBUyxJQUFULENBQWMsU0FBZCxFQUF3QixDQUF4QixDQUFaO0FBQ0EsTUFBSSxLQUFLLEdBQUcsRUFBWjs7QUFDQSxPQUFLLElBQUksQ0FBQyxHQUFHLENBQWIsRUFBZ0IsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFSLEdBQWUsQ0FBbkMsRUFBc0MsQ0FBQyxFQUF2QyxFQUEyQztBQUN6QyxJQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsT0FBTyxDQUFDLENBQUQsQ0FBbEIsRUFBdUIsS0FBSyxDQUFDLENBQUQsQ0FBTCxJQUFZLEVBQW5DO0FBQ0Q7O0FBQ0QsRUFBQSxLQUFLLENBQUMsSUFBTixDQUFXLE9BQU8sQ0FBQyxDQUFELENBQWxCO0FBQ0EsU0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLEVBQVgsQ0FBUDtBQUNELENBVEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0NBLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxTQUFELENBQXBCOztBQUVBLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxDQUFDLCtXQUFELENBQUQsQ0FBckI7QUFDQSxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsQ0FBQyw0eEdBQUQsQ0FBRCxDQUFyQjtBQUVBLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLG10RUFBRCxDQUFELENBQXRCO0FBQ0EsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUMs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WCxHQUFxQixRQUFyQjtBQUVBLGFBQUssS0FBTCxDQUFXLElBQVgsR0FBa0IsSUFBbEIsQ0FBdUIsWUFBWTtBQUNqQyxlQUFLLGFBQUwsQ0FBbUI7QUFBRSxZQUFBLElBQUksRUFBRSxZQUFZLENBQUMsWUFBckI7QUFBbUMsWUFBQSxPQUFPLEVBQUU7QUFBNUMsV0FBbkI7QUFDRCxTQUZELFdBRVMsVUFBVSxLQUFWLEVBQWlCO0FBQ3hCLGVBQUssYUFBTCxDQUFtQjtBQUFFLFlBQUEsSUFBSSxFQUFFLFlBQVksQ0FBQyxVQUFyQjtBQUFpQyxZQUFBLE9BQU8sRUFBRTtBQUExQyxXQUFuQjtBQUNBLFVBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxnQkFBWixFQUE4QixJQUE5QjtBQUNELFNBTEQ7QUFNRCxPQVZNLE1BVUE7QUFDTCxRQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVkscUNBQVo7QUFDQSxhQUFLLGFBQUwsQ0FBbUI7QUFBRSxVQUFBLElBQUksRUFBRSxZQUFZLENBQUMsVUFBckI7QUFBaUMsVUFBQSxPQUFPLEVBQUU7QUFBMUMsU0FBbkI7QUFDRDtBQUNGOzs7U0EzZ0JELGVBQTBCO0FBQ3hCLGFBQU8sWUFBUDtBQUNEOzs7O0VBekJxQixLQUFLLENBQUMsUTs7QUFxaUI5QixNQUFNLENBQUMsT0FBUCxHQUFpQixTQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyaW5ncykge1xuICBpZiAodHlwZW9mIHN0cmluZ3MgPT09ICdzdHJpbmcnKSBzdHJpbmdzID0gW3N0cmluZ3NdXG4gIHZhciBleHBycyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLDEpXG4gIHZhciBwYXJ0cyA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5ncy5sZW5ndGgtMTsgaSsrKSB7XG4gICAgcGFydHMucHVzaChzdHJpbmdzW2ldLCBleHByc1tpXSB8fCAnJylcbiAgfVxuICBwYXJ0cy5wdXNoKHN0cmluZ3NbaV0pXG4gIHJldHVybiBwYXJ0cy5qb2luKCcnKVxufVxuIiwiXG5jb25zdCBnbHNsID0gcmVxdWlyZSgnZ2xzbGlmeScpO1xuXG5jb25zdCByZ2JkRnJhZyA9IGdsc2woW1wiI2RlZmluZSBHTFNMSUZZIDFcXG51bmlmb3JtIHNhbXBsZXIyRCBtYXA7XFxudW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xcbnVuaWZvcm0gZmxvYXQgd2lkdGg7XFxudW5pZm9ybSBmbG9hdCBoZWlnaHQ7XFxuXFxudmFyeWluZyB2ZWM0IHB0Q29sb3I7XFxudmFyeWluZyB2ZWMyIHZVdjtcXG52YXJ5aW5nIHZlYzMgZGVidWc7XFxuXFxudm9pZCBtYWluKCkge1xcblxcbiAgICBpZiggcHRDb2xvci5hIDw9IDAuMCl7XFxuICAgICAgICBkaXNjYXJkO1xcbiAgICB9XFxuXFxuICAgIHZlYzQgY29sb3JTYW1wbGUgPSBwdENvbG9yO1xcbiAgICBjb2xvclNhbXBsZS5hICo9IChwdENvbG9yLmEgKiBvcGFjaXR5KTtcXG5cXG4gICAgZ2xfRnJhZ0NvbG9yID0gY29sb3JTYW1wbGU7XFxufVwiXSk7XG5jb25zdCByZ2JkVmVydCA9IGdsc2woW1wiI2RlZmluZSBHTFNMSUZZIDFcXG51bmlmb3JtIHZlYzIgZm9jYWxMZW5ndGg7Ly9meCxmeVxcbnVuaWZvcm0gdmVjMiBwcmluY2lwYWxQb2ludDsvL3BweCxwcHlcXG51bmlmb3JtIHZlYzIgaW1hZ2VEaW1lbnNpb25zO1xcbnVuaWZvcm0gbWF0NCBleHRyaW5zaWNzO1xcbnVuaWZvcm0gZmxvYXQgd2lkdGg7XFxudW5pZm9ybSBmbG9hdCBoZWlnaHQ7XFxudW5pZm9ybSBmbG9hdCBzY2FsZTtcXG51bmlmb3JtIHNhbXBsZXIyRCBtYXA7XFxuXFxudW5pZm9ybSBmbG9hdCBwb2ludFNpemU7XFxudW5pZm9ybSBmbG9hdCBkZXB0aE1pbjtcXG51bmlmb3JtIGZsb2F0IGRlcHRoTWF4O1xcbnVuaWZvcm0gdmVjMyB0aHJlc2hvbGRNaW47XFxudW5pZm9ybSB2ZWMzIHRocmVzaG9sZE1heDtcXG52YXJ5aW5nIHZlYzQgcHRDb2xvcjtcXG52YXJ5aW5nIHZlYzIgdlV2O1xcbnZhcnlpbmcgdmVjMyBkZWJ1ZztcXG5cXG5jb25zdCBmbG9hdCBfRGVwdGhTYXR1cmF0aW9uVGhyZXNoaG9sZCA9IDAuMzsgLy9hIGdpdmVuIHBpeGVsIHdob3NlIHNhdHVyYXRpb24gaXMgbGVzcyB0aGFuIGhhbGYgd2lsbCBiZSBjdWxsZWQgKG9sZCBkZWZhdWx0IHdhcyAuNSlcXG5jb25zdCBmbG9hdCBfRGVwdGhCcmlnaHRuZXNzVGhyZXNob2xkID0gMC4zOyAvL2EgZ2l2ZW4gcGl4ZWwgd2hvc2UgYnJpZ2h0bmVzcyBpcyBsZXNzIHRoYW4gaGFsZiB3aWxsIGJlIGN1bGxlZCAob2xkIGRlZmF1bHQgd2FzIC45KVxcbmNvbnN0IGZsb2F0ICBfRXBzaWxvbiA9IC4wMztcXG5cXG4jZGVmaW5lIEJSSUdIVE5FU1NfVEhSRVNIT0xEX09GRlNFVCAwLjAxXFxuI2RlZmluZSBGTE9BVF9FUFMgMC4wMDAwMVxcbiNkZWZpbmUgQ0xJUF9FUFNJTE9OIDAuMDA1XFxuXFxudmVjMyByZ2IyaHN2KHZlYzMgYylcXG57XFxuICAgIHZlYzQgSyA9IHZlYzQoMC4wLCAtMS4wIC8gMy4wLCAyLjAgLyAzLjAsIC0xLjApO1xcbiAgICB2ZWM0IHAgPSBtaXgodmVjNChjLmJnLCBLLnd6KSwgdmVjNChjLmdiLCBLLnh5KSwgc3RlcChjLmIsIGMuZykpO1xcbiAgICB2ZWM0IHEgPSBtaXgodmVjNChwLnh5dywgYy5yKSwgdmVjNChjLnIsIHAueXp4KSwgc3RlcChwLngsIGMucikpO1xcbiAgICBmbG9hdCBkID0gcS54IC0gbWluKHEudywgcS55KTtcXG4gICAgcmV0dXJuIHZlYzMoYWJzKHEueiArIChxLncgLSBxLnkpIC8gKDYuMCAqIGQgKyBGTE9BVF9FUFMpKSwgZCAvIChxLnggKyBGTE9BVF9FUFMpLCBxLngpO1xcbn1cXG5cXG5mbG9hdCBkZXB0aEZvclBvaW50KHZlYzIgdGV4dHVyZVBvaW50KVxcbnsgICAgICAgXFxuICAgIHZlYzIgY2VudGVycGl4ID0gdmVjMigxLjAvd2lkdGgsIDEuMC9oZWlnaHQpICogMC41O1xcbiAgICB0ZXh0dXJlUG9pbnQgKz0gY2VudGVycGl4O1xcblxcbiAgICAvLyBjbGFtcCB0byB0ZXh0dXJlIGJvdW5kcyAtIDAuNSBwaXhlbHNpemUgc28gd2UgZG8gbm90IHNhbXBsZSBvdXRzaWRlIG91ciB0ZXh0dXJlXFxuICAgIHRleHR1cmVQb2ludCA9IGNsYW1wKHRleHR1cmVQb2ludCwgY2VudGVycGl4LCB2ZWMyKDEuMCwgMC41KSAtIGNlbnRlcnBpeCk7XFxuICAgIHZlYzQgZGVwdGhzYW1wbGUgPSB0ZXh0dXJlMkQobWFwLCB0ZXh0dXJlUG9pbnQpO1xcbiAgICB2ZWMzIGRlcHRoc2FtcGxlaHN2ID0gcmdiMmhzdihkZXB0aHNhbXBsZS5yZ2IpO1xcbiAgICByZXR1cm4gZGVwdGhzYW1wbGVoc3YuYiA+IF9EZXB0aEJyaWdodG5lc3NUaHJlc2hvbGQgKyBCUklHSFRORVNTX1RIUkVTSE9MRF9PRkZTRVQgPyBkZXB0aHNhbXBsZWhzdi5yIDogMC4wO1xcbn1cXG5cXG4vL2h0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyNzUxMDgwL2dsc2wtcG9pbnQtaW5zaWRlLWJveC10ZXN0LzM3NDI2NTMyXFxuZmxvYXQgaW5zaWRlQm94M0QodmVjMyB2LCB2ZWMzIGJvdHRvbUxlZnQsIHZlYzMgdG9wUmlnaHQpIHtcXG4gICAgdmVjMyBzID0gc3RlcChib3R0b21MZWZ0LCB2KSAtIHN0ZXAodG9wUmlnaHQsIHYpO1xcbiAgICByZXR1cm4gcy54ICogcy55ICogcy56OyBcXG59XFxuXFxudm9pZCBtYWluKClcXG57ICAgXFxuICAgIHZlYzQgdGV4U2l6ZSA9IHZlYzQoMS4wIC8gd2lkdGgsIDEuMCAvIGhlaWdodCwgd2lkdGgsIGhlaWdodCk7XFxuICAgIHZlYzIgYmFzZXRleCA9IHBvc2l0aW9uLnh5ICsgdmVjMigwLjUsMC41KTtcXG5cXG4gICAgLy8gd2UgYWxpZ24gb3VyIGRlcHRoIHBpeGVsIGNlbnRlcnMgd2l0aCB0aGUgY2VudGVyIG9mIGVhY2ggcXVhZCwgc28gd2UgZG8gbm90IHJlcXVpcmUgYSBoYWxmIHBpeGVsIG9mZnNldFxcbiAgICB2ZWMyIGRlcHRoVGV4Q29vcmQgPSBiYXNldGV4ICogdmVjMigxLjAsIDAuNSk7XFxuICAgIHZlYzIgY29sb3JUZXhDb29yZCA9IGJhc2V0ZXggKiB2ZWMyKDEuMCwgMC41KSArIHZlYzIoMC4wLCAwLjUpO1xcblxcbiAgICBmbG9hdCBkZXB0aCA9IGRlcHRoRm9yUG9pbnQoZGVwdGhUZXhDb29yZCk7XFxuICAgIGZsb2F0IG1pbmRlcHRoID0gZGVwdGhNaW47XFxuICAgIGZsb2F0IG1heGRlcHRoID0gZGVwdGhNYXg7XFxuXFxuICAgIGZsb2F0IHogPSBkZXB0aCAqIChtYXhkZXB0aCAtIG1pbmRlcHRoKSArIG1pbmRlcHRoO1xcbiAgICB2ZWMyIG9ydGhvID0gYmFzZXRleCAqIGltYWdlRGltZW5zaW9ucyAtIHByaW5jaXBhbFBvaW50O1xcbiAgICB2ZWMyIHByb2ogPSBvcnRobyAqIHogLyBmb2NhbExlbmd0aDtcXG4gICAgdmVjNCB3b3JsZFBvcyA9IGV4dHJpbnNpY3MgKiAgdmVjNChwcm9qLnh5LCB6LCAxLjApO1xcbiAgICB3b3JsZFBvcy53ID0gMS4wO1xcblxcbiAgICB2ZWM0IG12UG9zaXRpb24gPSB2ZWM0KCB3b3JsZFBvcy54eXosIDEuMCApO1xcbiAgICBtdlBvc2l0aW9uID0gbW9kZWxWaWV3TWF0cml4ICogbXZQb3NpdGlvbjtcXG4gICAgcHRDb2xvciA9IHRleHR1cmUyRChtYXAsIGNvbG9yVGV4Q29vcmQpO1xcblxcbiAgICBwdENvbG9yLmEgPSBpbnNpZGVCb3gzRCh3b3JsZFBvcy54eXosIHRocmVzaG9sZE1pbiwgdGhyZXNob2xkTWF4ICkgPiAwLjAgJiYgZGVwdGggPiAwLjAgPyAxLjAgOiAwLjA7XFxuXFxuICAgIG1hdDQgZmxpcCA9IG1hdDQoICB2ZWM0KC0xLjAsMC4wLDAuMCwwLjApLFxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlYzQoMC4wLDEuMCwwLjAsMC4wKSxcXG4gICAgICAgICAgICAgICAgICAgICAgICB2ZWM0KDAuMCwwLjAsMS4wLDAuMCksXFxuICAgICAgICAgICAgICAgICAgICAgICAgdmVjNCgwLjAsMC4wLDAuMCwxLjApKTtcXG4gICAgXFxuICAgIGdsX1Bvc2l0aW9uID0gcHJvamVjdGlvbk1hdHJpeCAqIG1vZGVsVmlld01hdHJpeCAqIGZsaXAgKiB3b3JsZFBvcztcXG4gICAgdlV2ID0gdXY7XFxuICAgIGRlYnVnID0gdmVjMygxLCAwLjUsIDAuMCk7XFxuXFxuICAgIGdsX1BvaW50U2l6ZSA9IHBvaW50U2l6ZTtcXG4gICAgZ2xfUG9pbnRTaXplICo9ICggc2NhbGUgLyAtIG12UG9zaXRpb24ueiApO1xcblxcbn1cXG5cIl0pO1xuXG5jb25zdCBvcnRob0ZyYWcgPSBnbHNsKFtcIiNkZWZpbmUgR0xTTElGWSAxXFxudW5pZm9ybSBzYW1wbGVyMkQgbWFwO1xcbnVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcXG51bmlmb3JtIGZsb2F0IHdpZHRoO1xcbnVuaWZvcm0gZmxvYXQgaGVpZ2h0O1xcbnVuaWZvcm0gZmxvYXQgZGVwdGhNaW47XFxudW5pZm9ybSBmbG9hdCBkZXB0aE1heDtcXG51bmlmb3JtIHZlYzMgdGhyZXNob2xkTWluO1xcbnVuaWZvcm0gdmVjMyB0aHJlc2hvbGRNYXg7XFxuXFxudmFyeWluZyB2ZWM0IHB0Q29sb3I7XFxudmFyeWluZyB2ZWMyIHZVdjtcXG52YXJ5aW5nIHZlYzMgZGVidWc7XFxuXFxuI2RlZmluZSBCUklHSFRORVNTX1RIUkVTSE9MRF9PRkZTRVQgMC4wMVxcbiNkZWZpbmUgRkxPQVRfRVBTIDAuMDAwMDFcXG5cXG5jb25zdCBmbG9hdCBfRGVwdGhTYXR1cmF0aW9uVGhyZXNoaG9sZCA9IDAuMzsgLy9hIGdpdmVuIHBpeGVsIHdob3NlIHNhdHVyYXRpb24gaXMgbGVzcyB0aGFuIGhhbGYgd2lsbCBiZSBjdWxsZWQgKG9sZCBkZWZhdWx0IHdhcyAuNSlcXG5jb25zdCBmbG9hdCBfRGVwdGhCcmlnaHRuZXNzVGhyZXNob2xkID0gMC42OyAvL2EgZ2l2ZW4gcGl4ZWwgd2hvc2UgYnJpZ2h0bmVzcyBpcyBsZXNzIHRoYW4gaGFsZiB3aWxsIGJlIGN1bGxlZCAob2xkIGRlZmF1bHQgd2FzIC45KVxcblxcbnZlYzMgcmdiMmhzdih2ZWMzIGMpXFxue1xcbiAgICB2ZWM0IEsgPSB2ZWM0KDAuMCwgLTEuMCAvIDMuMCwgMi4wIC8gMy4wLCAtMS4wKTtcXG4gICAgdmVjNCBwID0gbWl4KHZlYzQoYy5iZywgSy53eiksIHZlYzQoYy5nYiwgSy54eSksIHN0ZXAoYy5iLCBjLmcpKTtcXG4gICAgdmVjNCBxID0gbWl4KHZlYzQocC54eXcsIGMuciksIHZlYzQoYy5yLCBwLnl6eCksIHN0ZXAocC54LCBjLnIpKTtcXG4gICAgZmxvYXQgZCA9IHEueCAtIG1pbihxLncsIHEueSk7XFxuICAgIHJldHVybiB2ZWMzKGFicyhxLnogKyAocS53IC0gcS55KSAvICg2LjAgKiBkICsgRkxPQVRfRVBTKSksIGQgLyAocS54ICsgRkxPQVRfRVBTKSwgcS54KTtcXG59XFxuXFxuZmxvYXQgZGVwdGhGb3JQb2ludCh2ZWMyIHRleHR1cmVQb2ludClcXG57XFxuICAgIHZlYzQgZGVwdGhzYW1wbGUgPSB0ZXh0dXJlMkQobWFwLCB0ZXh0dXJlUG9pbnQpO1xcbiAgICB2ZWMzIGRlcHRoc2FtcGxlaHN2ID0gcmdiMmhzdihkZXB0aHNhbXBsZS5yZ2IpO1xcbiAgICByZXR1cm4gZGVwdGhzYW1wbGVoc3YuZyA+IF9EZXB0aFNhdHVyYXRpb25UaHJlc2hob2xkICYmIGRlcHRoc2FtcGxlaHN2LmIgPiBfRGVwdGhCcmlnaHRuZXNzVGhyZXNob2xkID8gZGVwdGhzYW1wbGVoc3YuciA6IDAuMDtcXG59XFxuXFxudm9pZCBtYWluKCkge1xcblxcbiAgLypmbG9hdCB2ZXJ0aWNhbFNjYWxlID0gNDgwLjAgLyA3MjAuMDtcXG4gIGZsb2F0IHZlcnRpY2FsT2Zmc2V0ID0gMS4wIC0gdmVydGljYWxTY2FsZTtcXG4gIHZlYzIgY29sb3JVdiA9IHZVdiAqIHZlYzIoMC41LCB2ZXJ0aWNhbFNjYWxlKSArIHZlYzIoMCwgdmVydGljYWxPZmZzZXQpO1xcbiAgdmVjMiBkZXB0aFV2ID0gY29sb3JVdiArIHZlYzIoMC41LCAwLjApOyovXFxuXFxuICAgIGZsb2F0IHZlcnRpY2FsU2NhbGUgPSAwLjU7Ly80ODAuMCAvIDcyMC4wO1xcbiAgICBmbG9hdCB2ZXJ0aWNhbE9mZnNldCA9IDEuMCAtIHZlcnRpY2FsU2NhbGU7XFxuXFxuICAgIHZlYzIgY29sb3JVdiA9IHZVdiAqIHZlYzIoMS4wLCB2ZXJ0aWNhbFNjYWxlKSArIHZlYzIoMC4wLCAwLjUpO1xcbiAgICB2ZWMyIGRlcHRoVXYgPSBjb2xvclV2IC0gdmVjMigwLjAsIDAuNSk7XFxuXFxuICAgIHZlYzQgY29sb3JTYW1wbGUgPSBwdENvbG9yOy8vIHRleHR1cmUyRChtYXAsIGNvbG9yVXYpOyBcXG4gICAgdmVjNCBkZXB0aFNhbXBsZSA9IHRleHR1cmUyRChtYXAsIGRlcHRoVXYpOyBcXG5cXG4gICAgdmVjMyBoc3YgPSByZ2IyaHN2KGRlcHRoU2FtcGxlLnJnYik7XFxuICAgIGZsb2F0IGRlcHRoID0gaHN2LmIgPiBfRGVwdGhCcmlnaHRuZXNzVGhyZXNob2xkICsgQlJJR0hUTkVTU19USFJFU0hPTERfT0ZGU0VUID8gaHN2LnIgOiAwLjA7XFxuICAgIGZsb2F0IHogPSBkZXB0aCAqIChkZXB0aE1heCAtIGRlcHRoTWluKSArIGRlcHRoTWluO1xcbiAgICBmbG9hdCBhbHBoYSA9IGRlcHRoID4gMC4wICYmIHogPiB0aHJlc2hvbGRNaW4ueiAmJiB6IDwgdGhyZXNob2xkTWF4LnogPyAxLjAgOiAwLjA7XFxuXFxuICAgIGlmKGFscGhhIDw9IDAuMCkge1xcbiAgICAgIGRpc2NhcmQ7XFxuICAgIH1cXG5cXG4gICAgY29sb3JTYW1wbGUuYSAqPSAoYWxwaGEgKiBvcGFjaXR5KTtcXG5cXG4gICAgZ2xfRnJhZ0NvbG9yID0gY29sb3JTYW1wbGU7Ly92ZWM0KGRlYnVnLCAxKTtcXG59XCJdKTtcbmNvbnN0IG9ydGhvVmVydCA9IGdsc2woW1wiI2RlZmluZSBHTFNMSUZZIDFcXG51bmlmb3JtIHNhbXBsZXIyRCBtYXA7XFxuXFxudW5pZm9ybSBmbG9hdCBwb2ludFNpemU7XFxudW5pZm9ybSBmbG9hdCBkZXB0aE1pbjtcXG51bmlmb3JtIGZsb2F0IGRlcHRoTWF4O1xcbnVuaWZvcm0gdmVjMyB0aHJlc2hvbGRNaW47XFxudW5pZm9ybSB2ZWMzIHRocmVzaG9sZE1heDtcXG51bmlmb3JtIGZsb2F0IHNjYWxlO1xcbnZhcnlpbmcgdmVjNCBwdENvbG9yO1xcbnZhcnlpbmcgdmVjMiB2VXY7XFxudmFyeWluZyB2ZWMzIGRlYnVnO1xcblxcbmNvbnN0IGZsb2F0IF9EZXB0aFNhdHVyYXRpb25UaHJlc2hob2xkID0gMC4zOyAvL2EgZ2l2ZW4gcGl4ZWwgd2hvc2Ugc2F0dXJhdGlvbiBpcyBsZXNzIHRoYW4gaGFsZiB3aWxsIGJlIGN1bGxlZCAob2xkIGRlZmF1bHQgd2FzIC41KVxcbmNvbnN0IGZsb2F0IF9EZXB0aEJyaWdodG5lc3NUaHJlc2hvbGQgPSAwLjM7IC8vYSBnaXZlbiBwaXhlbCB3aG9zZSBicmlnaHRuZXNzIGlzIGxlc3MgdGhhbiBoYWxmIHdpbGwgYmUgY3VsbGVkIChvbGQgZGVmYXVsdCB3YXMgLjkpXFxuY29uc3QgZmxvYXQgIF9FcHNpbG9uID0gLjAzO1xcblxcbi8vaHR0cHM6Ly9naXRodWIuY29tL3RvYnNwci9HTFNMLUNvbG9yLVNwYWNlcy9ibG9iL21hc3Rlci9Db2xvclNwYWNlcy5pbmMuZ2xzbFxcbmNvbnN0IGZsb2F0IFNSR0JfR0FNTUEgPSAxLjAgLyAyLjI7XFxuY29uc3QgZmxvYXQgU1JHQl9JTlZFUlNFX0dBTU1BID0gMi4yO1xcbmNvbnN0IGZsb2F0IFNSR0JfQUxQSEEgPSAwLjA1NTtcXG5cXG4vLyBDb252ZXJ0cyBhIHNpbmdsZSBzcmdiIGNoYW5uZWwgdG8gcmdiXFxuZmxvYXQgc3JnYl90b19saW5lYXIoZmxvYXQgY2hhbm5lbCkge1xcbiAgaWYgKGNoYW5uZWwgPD0gMC4wNDA0NSlcXG4gICAgICByZXR1cm4gY2hhbm5lbCAvIDEyLjkyO1xcbiAgZWxzZVxcbiAgICAgIHJldHVybiBwb3coKGNoYW5uZWwgKyBTUkdCX0FMUEhBKSAvICgxLjAgKyBTUkdCX0FMUEhBKSwgMi40KTtcXG59XFxuXFxuLy8gQ29udmVydHMgYSBzcmdiIGNvbG9yIHRvIGEgbGluZWFyIHJnYiBjb2xvciAoZXhhY3QsIG5vdCBhcHByb3hpbWF0ZWQpXFxudmVjMyBzcmdiX3RvX3JnYih2ZWMzIHNyZ2IpIHtcXG4gIHJldHVybiB2ZWMzKFxcbiAgICAgIHNyZ2JfdG9fbGluZWFyKHNyZ2IuciksXFxuICAgICAgc3JnYl90b19saW5lYXIoc3JnYi5nKSxcXG4gICAgICBzcmdiX3RvX2xpbmVhcihzcmdiLmIpXFxuICApO1xcbn1cXG5cXG4vL2Zhc3RlciBidXQgbm9pc2llclxcbnZlYzMgc3JnYl90b19yZ2JfYXBwcm94KHZlYzMgc3JnYikge1xcbnJldHVybiBwb3coc3JnYiwgdmVjMyhTUkdCX0lOVkVSU0VfR0FNTUEpKTtcXG59XFxuXFxudmVjMyByZ2IyaHN2KHZlYzMgYylcXG57XFxuICB2ZWM0IEsgPSB2ZWM0KDAuMCwgLTEuMCAvIDMuMCwgMi4wIC8gMy4wLCAtMS4wKTtcXG4gIHZlYzQgcCA9IG1peCh2ZWM0KGMuYmcsIEsud3opLCB2ZWM0KGMuZ2IsIEsueHkpLCBzdGVwKGMuYiwgYy5nKSk7XFxuICB2ZWM0IHEgPSBtaXgodmVjNChwLnh5dywgYy5yKSwgdmVjNChjLnIsIHAueXp4KSwgc3RlcChwLngsIGMucikpO1xcblxcbiAgZmxvYXQgZCA9IHEueCAtIG1pbihxLncsIHEueSk7XFxuICByZXR1cm4gdmVjMyhhYnMocS56ICsgKHEudyAtIHEueSkgLyAoNi4wICogZCArIF9FcHNpbG9uKSksIGQgLyAocS54ICsgX0Vwc2lsb24pLCBxLngpO1xcbn1cXG5cXG5mbG9hdCBkZXB0aEZvclBvaW50KHZlYzIgdGV4dHVyZVBvaW50KVxcbntcXG4gIHZlYzQgZGVwdGhzYW1wbGUgPSB0ZXh0dXJlMkQobWFwLCB0ZXh0dXJlUG9pbnQpO1xcbiAgdmVjMyBsaW5lYXIgPSBzcmdiX3RvX3JnYiggZGVwdGhzYW1wbGUucmdiKTtcXG4gIHZlYzMgZGVwdGhzYW1wbGVoc3YgPSByZ2IyaHN2KGxpbmVhci5yZ2IpO1xcbiAgcmV0dXJuIGRlcHRoc2FtcGxlaHN2LmcgPiBfRGVwdGhTYXR1cmF0aW9uVGhyZXNoaG9sZCAmJiBkZXB0aHNhbXBsZWhzdi5iID4gX0RlcHRoQnJpZ2h0bmVzc1RocmVzaG9sZCA/IGRlcHRoc2FtcGxlaHN2LnIgOiAwLjA7XFxufVxcblxcbnZvaWQgbWFpbigpXFxue1xcbiAgZmxvYXQgbWluZGVwdGggPSBkZXB0aE1pbjtcXG4gIGZsb2F0IG1heGRlcHRoID0gZGVwdGhNYXg7XFxuXFxuICBmbG9hdCB2ZXJ0aWNhbFNjYWxlID0gMC41Oy8vNDgwLjAgLyA3MjAuMDtcXG4gIGZsb2F0IHZlcnRpY2FsT2Zmc2V0ID0gMS4wIC0gdmVydGljYWxTY2FsZTtcXG5cXG4gIHZlYzIgY29sb3JVdiA9IHV2ICogdmVjMigxLjAsIHZlcnRpY2FsU2NhbGUpICsgdmVjMigwLjAsIDAuNSk7XFxuICB2ZWMyIGRlcHRoVXYgPSBjb2xvclV2IC0gdmVjMigwLjAsIDAuNSk7XFxuXFxuICBmbG9hdCBkZXB0aCA9IGRlcHRoRm9yUG9pbnQoZGVwdGhVdik7XFxuXFxuICBmbG9hdCB6ID0gZGVwdGggKiAobWF4ZGVwdGggLSBtaW5kZXB0aCkgKyBtaW5kZXB0aDtcXG4gIFxcbiAgdmVjNCB3b3JsZFBvcyA9IHZlYzQocG9zaXRpb24ueHksIC16LCAxLjApO1xcbiAgd29ybGRQb3MudyA9IDEuMDtcXG5cXG4gIHZlYzQgbXZQb3NpdGlvbiA9IHZlYzQoIHdvcmxkUG9zLnh5eiwgMS4wICk7XFxuICBtdlBvc2l0aW9uID0gbW9kZWxWaWV3TWF0cml4ICogbXZQb3NpdGlvbjtcXG5cXG4gIHB0Q29sb3IgPSB0ZXh0dXJlMkQobWFwLCBjb2xvclV2KTtcXG5cXG4gIGdsX1Bvc2l0aW9uID0gcHJvamVjdGlvbk1hdHJpeCAqIG1vZGVsVmlld01hdHJpeCAqIHdvcmxkUG9zO1xcbiAgdlV2ID0gdXY7XFxuICBkZWJ1ZyA9IHZlYzMoMSwgMC41LCAwLjApO1xcbiAgXFxuICBnbF9Qb2ludFNpemUgPSBwb2ludFNpemU7XFxuICBnbF9Qb2ludFNpemUgKj0gKCBzY2FsZSAvIC0gbXZQb3NpdGlvbi56ICk7XFxuXFxuICAvL2dsX1Bvc2l0aW9uID0gIHByb2plY3Rpb25NYXRyaXggKiBtb2RlbFZpZXdNYXRyaXggKiB2ZWM0KHBvc2l0aW9uLDEuMCk7XFxufVwiXSk7XG5cbmNvbnN0IGN1dG91dEZyYWcgPSBnbHNsKFtcIiNkZWZpbmUgR0xTTElGWSAxXFxudW5pZm9ybSBzYW1wbGVyMkQgbWFwO1xcbnVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcXG51bmlmb3JtIGZsb2F0IHdpZHRoO1xcbnVuaWZvcm0gZmxvYXQgaGVpZ2h0O1xcbnVuaWZvcm0gZmxvYXQgZGVwdGhNaW47XFxudW5pZm9ybSBmbG9hdCBkZXB0aE1heDtcXG51bmlmb3JtIHZlYzMgdGhyZXNob2xkTWluO1xcbnVuaWZvcm0gdmVjMyB0aHJlc2hvbGRNYXg7XFxuXFxudmFyeWluZyB2ZWMyIHZVdjtcXG5cXG4jZGVmaW5lIEJSSUdIVE5FU1NfVEhSRVNIT0xEX09GRlNFVCAwLjAxXFxuI2RlZmluZSBGTE9BVF9FUFMgMC4wMDAwMVxcblxcbmNvbnN0IGZsb2F0IF9EZXB0aFNhdHVyYXRpb25UaHJlc2hob2xkID0gMC4zOyAvL2EgZ2l2ZW4gcGl4ZWwgd2hvc2Ugc2F0dXJhdGlvbiBpcyBsZXNzIHRoYW4gaGFsZiB3aWxsIGJlIGN1bGxlZCAob2xkIGRlZmF1bHQgd2FzIC41KVxcbmNvbnN0IGZsb2F0IF9EZXB0aEJyaWdodG5lc3NUaHJlc2hvbGQgPSAwLjQ7IC8vYSBnaXZlbiBwaXhlbCB3aG9zZSBicmlnaHRuZXNzIGlzIGxlc3MgdGhhbiBoYWxmIHdpbGwgYmUgY3VsbGVkIChvbGQgZGVmYXVsdCB3YXMgLjkpXFxuXFxudmVjMyByZ2IyaHN2KHZlYzMgYylcXG57XFxuICB2ZWM0IEsgPSB2ZWM0KDAuMCwgLTEuMCAvIDMuMCwgMi4wIC8gMy4wLCAtMS4wKTtcXG4gIHZlYzQgcCA9IG1peCh2ZWM0KGMuYmcsIEsud3opLCB2ZWM0KGMuZ2IsIEsueHkpLCBzdGVwKGMuYiwgYy5nKSk7XFxuICB2ZWM0IHEgPSBtaXgodmVjNChwLnh5dywgYy5yKSwgdmVjNChjLnIsIHAueXp4KSwgc3RlcChwLngsIGMucikpO1xcbiAgZmxvYXQgZCA9IHEueCAtIG1pbihxLncsIHEueSk7XFxuICByZXR1cm4gdmVjMyhhYnMocS56ICsgKHEudyAtIHEueSkgLyAoNi4wICogZCArIEZMT0FUX0VQUykpLCBkIC8gKHEueCArIEZMT0FUX0VQUyksIHEueCk7XFxufVxcblxcbnZvaWQgbWFpbigpIHtcXG5cXG4gIGZsb2F0IHZlcnRpY2FsU2NhbGUgPSAwLjU7Ly80ODAuMCAvIDcyMC4wO1xcbiAgZmxvYXQgdmVydGljYWxPZmZzZXQgPSAxLjAgLSB2ZXJ0aWNhbFNjYWxlO1xcblxcbiAgdmVjMiBjb2xvclV2ID0gdlV2ICogdmVjMigxLjAsIHZlcnRpY2FsU2NhbGUpICsgdmVjMigwLjAsIDAuNSk7XFxuICB2ZWMyIGRlcHRoVXYgPSBjb2xvclV2IC0gdmVjMigwLjAsIDAuNSk7XFxuXFxuICB2ZWM0IGNvbG9yU2FtcGxlID0gdGV4dHVyZTJEKG1hcCwgY29sb3JVdik7IFxcbiAgdmVjNCBkZXB0aFNhbXBsZSA9IHRleHR1cmUyRChtYXAsIGRlcHRoVXYpOyBcXG5cXG4gIHZlYzMgaHN2ID0gcmdiMmhzdihkZXB0aFNhbXBsZS5yZ2IpO1xcbiAgZmxvYXQgZGVwdGggPSBoc3YuYiA+IF9EZXB0aEJyaWdodG5lc3NUaHJlc2hvbGQgKyBCUklHSFRORVNTX1RIUkVTSE9MRF9PRkZTRVQgPyBoc3YuciA6IDAuMDtcXG4gIGZsb2F0IHogPSBkZXB0aCAqIChkZXB0aE1heCAtIGRlcHRoTWluKSArIGRlcHRoTWluO1xcbiAgZmxvYXQgYWxwaGEgPSBkZXB0aCA+IDAuMCAmJiB6ID4gdGhyZXNob2xkTWluLnogJiYgeiA8IHRocmVzaG9sZE1heC56ID8gMS4wIDogMC4wO1xcblxcbiAgaWYoYWxwaGEgPD0gMC4wKSB7XFxuICAgIGRpc2NhcmQ7XFxuICB9XFxuXFxuICBjb2xvclNhbXBsZS5hICo9IChhbHBoYSAqIG9wYWNpdHkpO1xcblxcbiAgZ2xfRnJhZ0NvbG9yID0gY29sb3JTYW1wbGU7XFxufVwiXSk7XG5jb25zdCBjdXRvdXRWZXJ0ID0gZ2xzbChbXCIjZGVmaW5lIEdMU0xJRlkgMVxcbnZhcnlpbmcgdmVjMiB2VXY7XFxudW5pZm9ybSBmbG9hdCBwb2ludFNpemU7XFxudW5pZm9ybSBmbG9hdCBkZXB0aE1pbjtcXG51bmlmb3JtIGZsb2F0IGRlcHRoTWF4O1xcbnVuaWZvcm0gZmxvYXQgc2NhbGU7XFxudW5pZm9ybSB2ZWMzIHRocmVzaG9sZE1pbjtcXG51bmlmb3JtIHZlYzMgdGhyZXNob2xkTWF4O1xcblxcbnZvaWQgbWFpbigpXFxue1xcbiAgdlV2ID0gdXY7XFxuICBnbF9Qb3NpdGlvbiA9ICBwcm9qZWN0aW9uTWF0cml4ICogbW9kZWxWaWV3TWF0cml4ICogdmVjNChwb3NpdGlvbiwxLjApO1xcbn1cIl0pO1xuXG5jb25zdCBITFNfVElNRU9VVCA9IDI1MDA7XG5cbmNvbnN0IHNjaGVtYSA9IHtcbiAgdmlkZW9QYXRoOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gIG1ldGE6IHt0eXBlOiAnb2JqZWN0JywgZGVmYXVsdHM6IHt9fSxcbiAgc3RhcnRhdDogeyB0eXBlOiAnbnVtYmVyJywgZGVmYXVsdDogMCB9LFxuICByZW5kZXJNb2RlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZWZhdWx0OiAncGVyc3BlY3RpdmUnIH0sXG4gIGRlcHRoTWluOiB7IHR5cGU6ICdudW1iZXInLCBkZWZhdWx0OiAwLjI5IH0sXG4gIGRlcHRoTWF4OiB7IHR5cGU6ICdudW1iZXInLCBkZWZhdWx0OiA0LjAgfSxcbiAgcG9pbnRTaXplOiB7IHR5cGU6ICdudW1iZXInLCBkZWZhdWx0OiA4LjAgfSxcbiAgc2NhbGU6IHsgdHlwZTogJ251bWJlcicsIGRlZmF1bHQ6IDEuMCB9LFxuICB0ZXh0dXJlU2l6ZTogeyB0eXBlOiAndmVjMicsIGRlZmF1bHQ6IHt3OjMyMCwgaDoyNDB9IH0sXG4gIHRocmVzaG9sZE1pbjogeyB0eXBlOiAndmVjMycsIGRlZmF1bHQ6IHt4Oi0yLjAsIHk6LTIuMCx6OjAuMH0gfSwgXG4gIHRocmVzaG9sZE1heDogeyB0eXBlOiAndmVjMycsIGRlZmF1bHQ6ICB7eDoyLjAsIHk6Mi4wLHo6NC4wfSB9LFxufVxuXG5jb25zdCBTVFJFQU1FVkVOVFMgPSBPYmplY3QuZnJlZXplKHtcbiAgUExBWV9TVUNDRVNTOiBcIlBMQVlfU1VDQ0VTU1wiLFxuICBQTEFZX0VSUk9SOiBcIlBMQVlfRVJST1JcIixcbiAgTE9BRF9FUlJPUjogXCJMT0FEX0VSUk9SXCIsXG4gIE5FVFdPUktfRVJST1I6IFwiTkVUV09SS19FUlJPUlwiLFxuICBNRURJQV9FUlJPUjogXCJNRURJQV9FUlJPUlwiLFxuICBITFNfRVJST1I6IFwiSExTX0VSUk9SXCJcbn0pXG5cbi8vVm9sdW1ldHJpYyBQZXJmb3JtYW5jZSBUb29sYm94IHN0cmVhbWluZyBwbGF5ZXJcbmNsYXNzIFZQVFN0cmVhbSBleHRlbmRzIFRIUkVFLk9iamVjdDNEIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy52aWRlbyA9IHRoaXMuY3JlYXRlVmlkZW9FbCgpO1xuICAgIHRoaXMudGV4dHVyZSA9IG5ldyBUSFJFRS5WaWRlb1RleHR1cmUodGhpcy52aWRlbyk7XG4gICAgdGhpcy50ZXh0dXJlLm1pbkZpbHRlciA9IFRIUkVFLk5lYXJlc3RGaWx0ZXI7XG4gICAgdGhpcy50ZXh0dXJlLm1hZ0ZpbHRlciA9IFRIUkVFLkxpbmVhckZpbHRlcjtcbiAgICB0aGlzLnRleHR1cmUuZm9ybWF0ID0gVEhSRUUuUkdCRm9ybWF0O1xuICAgIHRoaXMuaGxzID0gbnVsbDtcblxuICAgIC8vV2hlbiB1c2luZyB2cHRzdHJlYW0gaW4gbW96aWxsYSBodWJzL3Nwb2tlIHdlIHJ1biBpbnRvIGlzc3VlcyB3aXRoIHRoZSBwcm94eSAvIGNvcnMgc2V0dXAgYW5kIHRoZSB3YXkgSGxzIHJlc29sdmVzIHVybHMuXG4gICAgLy9IYWNrIGNvcGllZCBmcm9tIGhlcjogaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvaHVicy9ibG9iLzU4NGU0OGFkMGNjYzBkYTFmYzk3ODFlNzY4NmQxOTQzMWEyMzQwY2Qvc3JjL2NvbXBvbmVudHMvbWVkaWEtdmlld3MuanMjTDc3M1xuICAgIC8vdGhlIGZ1bmN0aW9uIHBhcmFtcyAvIHNpZ25hdHVyZSBpcyAoeGhyLCB1KSAgXG4gICAgdGhpcy5obHNfeGhyb3ZlcnJpZGUgPSBudWxsO1xuXG4gICAgdGhpcy5sb2FkVGltZSA9IDA7XG4gICAgdGhpcy5wbGF5aW5nID0gZmFsc2U7XG4gICAgdGhpcy5tZXNoU2NhbGFyID0gMjtcbiAgICB0aGlzLnBhcmFtcyA9IHt9XG4gIH1cblxuICBzdGF0aWMgZ2V0IFNUUkVBTUVWRU5UUygpIHtcbiAgICByZXR1cm4gU1RSRUFNRVZFTlRTO1xuICB9XG5cbiAgZ2V0IExvYWRUaW1lKCkge1xuICAgIHJldHVybiB0aGlzLmxvYWRUaW1lO1xuICB9XG5cbiAgZ2V0IFBsYXlpbmcoKSBcbiAge1xuICAgIHJldHVybiB0aGlzLnBsYXlpbmc7XG4gIH1cblxuICB1cGRhdGVQYXJhbWV0ZXIoIHBhcmFtLCB2YWx1ZSl7XG5cbiAgICBpZiggcGFyYW0gPT0gXCJzdGFydGF0XCIpe1xuICAgICAgdGhpcy52aWRlby5jdXJyZW50VGltZSA9IHZhbHVlO1xuICAgIH1lbHNle1xuICAgICAgaWYoIHRoaXMubWF0ZXJpYWwpe1xuICAgICAgICB0aGlzLm1hdGVyaWFsLnVuaWZvcm1zW3BhcmFtXS52YWx1ZSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICB9XG4gXG4gIGxvYWQocGFyYW1zKSBcbiAge1xuICAgIGNvbnNvbGUubG9nKFwidnB0c3RyZWFtIGxvYWRcIik7XG5cbiAgICBmb3IgKGNvbnN0IHByb3BlcnR5IGluIHNjaGVtYSkge1xuICAgICAgY29uc29sZS5sb2coYCR7cHJvcGVydHl9IHZhbHVlOiR7cGFyYW1zW3Byb3BlcnR5XX0gZGVmYXVsdDoke3NjaGVtYVtwcm9wZXJ0eV0uZGVmYXVsdH1gKTtcbiAgICAgIHRoaXMucGFyYW1zW3Byb3BlcnR5XSA9IHBhcmFtcy5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkgPyBwYXJhbXNbcHJvcGVydHldIDogc2NoZW1hW3Byb3BlcnR5XS5kZWZhdWx0O1xuICAgIH1cblxuICAgIGlmKCB0aGlzLnBhcmFtcy5tZXRhLmhhc093blByb3BlcnR5KFwiZGVwdGhGb2NhbExlbmd0aFwiKSApe1xuICAgICAgdGhpcy5zZXRQcm9wcyggdGhpcy5wYXJhbXMubWV0YSApO1xuICAgIH1lbHNle1xuICAgICAgY29uc29sZS5lcnJvcihcImludmFsaWQgbWV0YSBkYXRhIGZvciBwZXJzcGVjdGl2ZSByZW5kZXJpbmcsIGRlZmF1bHQgdG8gY3V0b3V0XCIpO1xuICAgICAgdGhpcy5wYXJhbXMucmVuZGVyTW9kZSA9IFwiY3V0b3V0XCJcbiAgICB9XG5cbiAgICAvL3NvIGZhciB3ZSBoYXZlIG5vdCBoYWQgdG8gdXNlIGN1c3RvbSBleHRyaW5zaWNlIGZvciBBenVyZSBLaW5lY3Qgb3IgUmVhbHNlbnNlXG4gICAgLy9kZWZhdWx0IGNvdWxkIHN1ZmZpY2UgYXMgdGhlIGFsaWdubWVudCBpcyBkb25lIHVwc3RyZWFtLCB3aGVuIHdlIGdyYWIgaWYgZnJvbSB0aGUgc2Vuc29yXG4gICAgLy9sZWF2aW5nIHRoaXMgaGVyZSB0byBhbGxvdyBmb3IgdGV4dHVyZXMgdGhhdCBzdGlsbCBuZWVkIGFsaWdubWVudCBcbiAgICBjb25zdCBleHRyaW5zaWNzID0gbmV3IFRIUkVFLk1hdHJpeDQoKTtcbiAgICBjb25zdCBleCA9IHRoaXMucHJvcHMuZXh0cmluc2ljcztcbiAgICBleHRyaW5zaWNzLnNldChcbiAgICAgIGV4W1wiZTAwXCJdLCBleFtcImUxMFwiXSwgZXhbXCJlMjBcIl0sIGV4W1wiZTMwXCJdLFxuICAgICAgZXhbXCJlMDFcIl0sIGV4W1wiZTExXCJdLCBleFtcImUyMVwiXSwgZXhbXCJlMzFcIl0sXG4gICAgICBleFtcImUwMlwiXSwgZXhbXCJlMTJcIl0sIGV4W1wiZTIyXCJdLCBleFtcImUzMlwiXSxcbiAgICAgIGV4W1wiZTAzXCJdLCBleFtcImUxM1wiXSwgZXhbXCJlMjNcIl0sIGV4W1wiZTMzXCJdXG4gICAgKTtcblxuICAgIGlmKCB0aGlzLm1hdGVyaWFsKXtcbiAgICAgIGNvbnNvbGUubG9nKFwiTWF0ZXJpYWwgZXhpc3RzLCBkaXNwb3NlXCIpXG4gICAgICB0aGlzLm1hdGVyaWFsLmRpc3Bvc2UoKTtcbiAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5nZXRPYmplY3RCeU5hbWUoXCJWb2x1bWV0cmljVmlkZW9cIik7XG4gICAgICBpZiggY2hpbGQgKXtcbiAgICAgICAgY29uc29sZS5sb2coXCJWb2x1bWV0cmljVmlkZW8gZXhpc3RzLCByZW1vdmVcIilcbiAgICAgICAgdGhpcy5yZW1vdmUoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc3RhcnRWaWRlbyh0aGlzLnBhcmFtcy52aWRlb1BhdGgpO1xuXG4gICAgbGV0IGdlb21ldHJ5ID0gbmV3IFRIUkVFLlBsYW5lQnVmZmVyR2VvbWV0cnkoMSwgMSwgdGhpcy5wYXJhbXMudGV4dHVyZVNpemUudywgIHRoaXMucGFyYW1zLnRleHR1cmVTaXplLmgpO1xuICAgIFxuICAgIHN3aXRjaCAodGhpcy5wYXJhbXMucmVuZGVyTW9kZSkge1xuXG4gICAgICBjYXNlIFwib3J0aG9cIjpcbiAgICAgICAgdGhpcy5tYXRlcmlhbCA9IG5ldyBUSFJFRS5TaGFkZXJNYXRlcmlhbCh7XG4gICAgICAgICAgdW5pZm9ybXM6IHtcbiAgICAgICAgICAgIFwibWFwXCI6IHtcbiAgICAgICAgICAgICAgdHlwZTogXCJ0XCIsXG4gICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnRleHR1cmVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInRpbWVcIjoge1xuICAgICAgICAgICAgICB0eXBlOiBcImZcIixcbiAgICAgICAgICAgICAgdmFsdWU6IDAuMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwib3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgIHR5cGU6IFwiZlwiLFxuICAgICAgICAgICAgICB2YWx1ZTogMS4wXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJwb2ludFNpemVcIjoge1xuICAgICAgICAgICAgICB0eXBlOiBcImZcIixcbiAgICAgICAgICAgICAgdmFsdWU6IHRoaXMucGFyYW1zLnBvaW50U2l6ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZGVwdGhNaW5cIjoge1xuICAgICAgICAgICAgICB0eXBlOiBcImZcIixcbiAgICAgICAgICAgICAgdmFsdWU6IHRoaXMucGFyYW1zLmRlcHRoTWluXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJkZXB0aE1heFwiOiB7XG4gICAgICAgICAgICAgIHR5cGU6IFwiZlwiLFxuICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5wYXJhbXMuZGVwdGhNYXhcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInRocmVzaG9sZE1pblwiOntcbiAgICAgICAgICAgICAgdmFsdWU6IHRoaXMucGFyYW1zLnRocmVzaG9sZE1pblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidGhyZXNob2xkTWF4XCI6e1xuICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5wYXJhbXMudGhyZXNob2xkTWF4XG4gICAgICAgICAgICB9LCAgICBcbiAgICAgICAgICAgIFwic2NhbGVcIjoge1xuICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5wYXJhbXMuc2NhbGVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHRlbnNpb25zOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBkZXJpdmF0aXZlczogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc2lkZTogVEhSRUUuRG91YmxlU2lkZSxcbiAgICAgICAgICB2ZXJ0ZXhTaGFkZXI6IG9ydGhvVmVydCxcbiAgICAgICAgICBmcmFnbWVudFNoYWRlcjogb3J0aG9GcmFnLFxuICAgICAgICAgIHRyYW5zcGFyZW50OiB0cnVlXG4gICAgICAgICAgLy9kZXB0aFdyaXRlOmZhbHNlc1xuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgcG9pbnRzTyA9IG5ldyBUSFJFRS5Qb2ludHMoZ2VvbWV0cnksIHRoaXMubWF0ZXJpYWwpO1xuICAgICAgICBwb2ludHNPLnBvc2l0aW9uLnkgPSAxO1xuICAgICAgICBwb2ludHNPLm5hbWUgPSBcIlZvbHVtZXRyaWNWaWRlb1wiO1xuICAgICAgICB0aGlzLmFkZChwb2ludHNPKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJjdXRvdXRcIjpcbiAgICAgICAgdGhpcy5tYXRlcmlhbCA9IG5ldyBUSFJFRS5TaGFkZXJNYXRlcmlhbCh7XG4gICAgICAgICAgdW5pZm9ybXM6IHtcbiAgICAgICAgICAgIFwibWFwXCI6IHtcbiAgICAgICAgICAgICAgdHlwZTogXCJ0XCIsXG4gICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnRleHR1cmVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInRpbWVcIjoge1xuICAgICAgICAgICAgICB0eXBlOiBcImZcIixcbiAgICAgICAgICAgICAgdmFsdWU6IDAuMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwib3BhY2l0eVwiOiB7XG4gICAgICAgICAgICAgIHR5cGU6IFwiZlwiLFxuICAgICAgICAgICAgICB2YWx1ZTogMS4wXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJkZXB0aE1pblwiOiB7XG4gICAgICAgICAgICAgIHR5cGU6IFwiZlwiLFxuICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5wYXJhbXMuZGVwdGhNaW5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImRlcHRoTWF4XCI6IHtcbiAgICAgICAgICAgICAgdHlwZTogXCJmXCIsXG4gICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnBhcmFtcy5kZXB0aE1heFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidGhyZXNob2xkTWluXCI6e1xuICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5wYXJhbXMudGhyZXNob2xkTWluXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ0aHJlc2hvbGRNYXhcIjp7XG4gICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnBhcmFtcy50aHJlc2hvbGRNYXhcbiAgICAgICAgICAgIH0sICAgIFxuICAgICAgICAgICAgXCJzY2FsZVwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnBhcmFtcy5zY2FsZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGRlcml2YXRpdmVzOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzaWRlOiBUSFJFRS5Eb3VibGVTaWRlLFxuICAgICAgICAgIHZlcnRleFNoYWRlcjogY3V0b3V0VmVydCxcbiAgICAgICAgICBmcmFnbWVudFNoYWRlcjogY3V0b3V0RnJhZyxcbiAgICAgICAgICB0cmFuc3BhcmVudDogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgcGxhbmUgPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgdGhpcy5tYXRlcmlhbCk7XG4gICAgICAgIHBsYW5lLnBvc2l0aW9uLnkgPSAxO1xuICAgICAgICBwbGFuZS5zY2FsZS5zZXQoIHRoaXMucGFyYW1zLnRleHR1cmVTaXplLncgLyB0aGlzLnBhcmFtcy50ZXh0dXJlU2l6ZS5oLCAxLjAsIDEuMCk7XG4gICAgICAgIHBsYW5lLm5hbWUgPSBcIlZvbHVtZXRyaWNWaWRlb1wiO1xuXG4gICAgICAgIHRoaXMuYWRkKHBsYW5lKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJwZXJzcGVjdGl2ZVwiOlxuICAgICAgICAvL2Fzc3VtZXMgZGVwdGhraXQgc3R5bGUgaHN2IGVuY29kaW5nXG5cbiAgICAgICAgLy9NYXRlcmlhbFxuICAgICAgICB0aGlzLm1hdGVyaWFsID0gbmV3IFRIUkVFLlNoYWRlck1hdGVyaWFsKHtcbiAgICAgICAgICB1bmlmb3Jtczoge1xuICAgICAgICAgICAgXCJtYXBcIjoge1xuICAgICAgICAgICAgICB0eXBlOiBcInRcIixcbiAgICAgICAgICAgICAgdmFsdWU6IHRoaXMudGV4dHVyZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwicG9pbnRTaXplXCI6IHtcbiAgICAgICAgICAgICAgdHlwZTogXCJmXCIsXG4gICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnBhcmFtcy5wb2ludFNpemVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImRlcHRoTWluXCI6IHtcbiAgICAgICAgICAgICAgdHlwZTogXCJmXCIsXG4gICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnBhcmFtcy5kZXB0aE1pblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZGVwdGhNYXhcIjoge1xuICAgICAgICAgICAgICB0eXBlOiBcImZcIixcbiAgICAgICAgICAgICAgdmFsdWU6IHRoaXMucGFyYW1zLmRlcHRoTWF4XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJzY2FsZVwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnBhcmFtcy5zY2FsZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiZm9jYWxMZW5ndGhcIjoge1xuICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5wcm9wcy5kZXB0aEZvY2FsTGVuZ3RoXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJwcmluY2lwYWxQb2ludFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnByb3BzLmRlcHRoUHJpbmNpcGFsUG9pbnRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImltYWdlRGltZW5zaW9uc1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnByb3BzLmRlcHRoSW1hZ2VTaXplXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ3aWR0aFwiOntcbiAgICAgICAgICAgICAgdmFsdWU6IHRoaXMucHJvcHMudGV4dHVyZVdpZHRoXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJoZWlnaHRcIjp7XG4gICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnByb3BzLnRleHR1cmVIZWlnaHRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcInRocmVzaG9sZE1pblwiOntcbiAgICAgICAgICAgICAgdmFsdWU6IHRoaXMucGFyYW1zLnRocmVzaG9sZE1pblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidGhyZXNob2xkTWF4XCI6e1xuICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5wYXJhbXMudGhyZXNob2xkTWF4XG4gICAgICAgICAgICB9LCAgICBcbiAgICAgICAgICAgIFwiZXh0cmluc2ljc1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBleHRyaW5zaWNzXG4gICAgICAgICAgICB9LCAgICAgICAgICAgICAgXG4gICAgICAgICAgICBcIm9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICB0eXBlOiBcImZcIixcbiAgICAgICAgICAgICAgdmFsdWU6IDEuMFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgZXh0ZW5zaW9uczpcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkZXJpdmF0aXZlczogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHZlcnRleFNoYWRlcjogcmdiZFZlcnQsXG4gICAgICAgICAgZnJhZ21lbnRTaGFkZXI6IHJnYmRGcmFnLFxuICAgICAgICAgIHRyYW5zcGFyZW50OiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vTWFrZSB0aGUgc2hhZGVyIG1hdGVyaWFsIGRvdWJsZSBzaWRlZFxuICAgICAgICB0aGlzLm1hdGVyaWFsLnNpZGUgPSBUSFJFRS5Eb3VibGVTaWRlO1xuICAgICAgICBcbiAgICAgICAgbGV0IHBvaW50UCA9IG5ldyBUSFJFRS5Qb2ludHMoZ2VvbWV0cnksIHRoaXMubWF0ZXJpYWwpO1xuICAgICAgICBwb2ludFAubmFtZSA9IFwiVm9sdW1ldHJpY1ZpZGVvXCI7XG4gICAgICAgIHBvaW50UC5wb3NpdGlvbi55ID0gMTtcbiAgICAgICAgdGhpcy5hZGQocG9pbnRQKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBcbiAgICAgIGNhc2UgXCJwZXJzcGVjdGl2ZV9ybDJcIjpcbiAgICAgICBcbiAgICAgICAgICAvL2Fzc3VtaW5nIGxpYnJlYWxzZW5zZTIgaHN2IGNvbG9yaXplclxuICAgICAgICAgIC8vaHR0cHM6Ly9kZXYuaW50ZWxyZWFsc2Vuc2UuY29tL2RvY3MvZGVwdGgtaW1hZ2UtY29tcHJlc3Npb24tYnktY29sb3JpemF0aW9uLWZvci1pbnRlbC1yZWFsc2Vuc2UtZGVwdGgtY2FtZXJhcyNzZWN0aW9uLTZyZWZlcmVuY2VzXG4gICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAgIC8vTWF0ZXJpYWxcbiAgICAgICAgICB0aGlzLm1hdGVyaWFsID0gbmV3IFRIUkVFLlNoYWRlck1hdGVyaWFsKHtcbiAgICAgICAgICAgIHVuaWZvcm1zOiB7XG4gICAgICAgICAgICAgIFwibWFwXCI6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInRcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy50ZXh0dXJlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIFwicG9pbnRTaXplXCI6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImZcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5wYXJhbXMucG9pbnRTaXplXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIFwiZGVwdGhNaW5cIjoge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZlwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnBhcmFtcy5kZXB0aE1pblxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBcImRlcHRoTWF4XCI6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImZcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5wYXJhbXMuZGVwdGhNYXhcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXCJzY2FsZVwiOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHRoaXMucGFyYW1zLnNjYWxlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIFwiZm9jYWxMZW5ndGhcIjoge1xuICAgICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnByb3BzLmRlcHRoRm9jYWxMZW5ndGhcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXCJwcmluY2lwYWxQb2ludFwiOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHRoaXMucHJvcHMuZGVwdGhQcmluY2lwYWxQb2ludFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBcImltYWdlRGltZW5zaW9uc1wiOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHRoaXMucHJvcHMuZGVwdGhJbWFnZVNpemVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXCJ3aWR0aFwiOntcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5wcm9wcy50ZXh0dXJlV2lkdGhcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXCJoZWlnaHRcIjp7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHRoaXMucHJvcHMudGV4dHVyZUhlaWdodFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBcInRocmVzaG9sZE1pblwiOntcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5wYXJhbXMudGhyZXNob2xkTWluXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIFwidGhyZXNob2xkTWF4XCI6e1xuICAgICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnBhcmFtcy50aHJlc2hvbGRNYXhcbiAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgIFwiZXh0cmluc2ljc1wiOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IGV4dHJpbnNpY3NcbiAgICAgICAgICAgICAgfSwgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBcIm9wYWNpdHlcIjoge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZlwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAxLjBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGRlcml2YXRpdmVzOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZlcnRleFNoYWRlcjogcmdiZFZlcnRfcnMyLFxuICAgICAgICAgICAgZnJhZ21lbnRTaGFkZXI6IHJnYmRGcmFnX3JzMixcbiAgICAgICAgICAgIHRyYW5zcGFyZW50OiB0cnVlXG4gICAgICAgICAgfSk7XG4gIFxuICAgICAgICAgIC8vTWFrZSB0aGUgc2hhZGVyIG1hdGVyaWFsIGRvdWJsZSBzaWRlZFxuICAgICAgICAgIHRoaXMubWF0ZXJpYWwuc2lkZSA9IFRIUkVFLkRvdWJsZVNpZGU7XG4gICAgICAgICAgXG4gICAgICAgICAgbGV0IHBvaW50UFJMMiA9IG5ldyBUSFJFRS5Qb2ludHMoZ2VvbWV0cnksIHRoaXMubWF0ZXJpYWwpO1xuICAgICAgICAgIHBvaW50UFJMMi5uYW1lID0gXCJWb2x1bWV0cmljVmlkZW9cIjtcbiAgICAgICAgICBwb2ludFBSTDIucG9zaXRpb24ueSA9IDE7XG4gICAgICAgICAgdGhpcy5hZGQocG9pbnRQUkwyKTtcbiAgICAgICAgICBicmVhazsgIFxuICAgIH1cbiAgfVxuXG4gIC8vbG9hZCBkZXB0aCBjYW1lcmEgcHJvcGVydGllcyBmb3IgcGVyc3BlY3RpdmUgcmVwcm9qZWN0aW9uXG4gIGxvYWRQcm9wc0Zyb21GaWxlKGZpbGVQYXRoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QganNvbkxvYWRlciA9IG5ldyBUSFJFRS5GaWxlTG9hZGVyKHRoaXMubWFuYWdlcik7XG4gICAgICAgIGpzb25Mb2FkZXIuc2V0UmVzcG9uc2VUeXBlKCdqc29uJyk7XG4gICAgICAgIGpzb25Mb2FkZXIubG9hZChmaWxlUGF0aCwgZGF0YSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgfSwgbnVsbCwgZXJyID0+IHtcbiAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTsgICAgXG4gIH1cbiAgXG4gIC8vc2V0IHBlcnNwZWN0aXZlIHByb2plY3Rpb24gcHJvcGVydGllc1xuICBzZXRQcm9wcyhfcHJvcHMpIHtcbiAgICB0aGlzLnByb3BzID0gX3Byb3BzO1xuICAgIGlmICh0aGlzLnByb3BzLnRleHR1cmVXaWR0aCA9PSB1bmRlZmluZWQgfHwgdGhpcy5wcm9wcy50ZXh0dXJlSGVpZ2h0ID09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5wcm9wcy50ZXh0dXJlV2lkdGggPSB0aGlzLnByb3BzLmRlcHRoSW1hZ2VTaXplLng7XG4gICAgICB0aGlzLnByb3BzLnRleHR1cmVIZWlnaHQgPSB0aGlzLnByb3BzLmRlcHRoSW1hZ2VTaXplLnkgKiAyO1xuICAgIH1cbiAgICBpZiAodGhpcy5wcm9wcy5leHRyaW5zaWNzID09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5wcm9wcy5leHRyaW5zaWNzID0ge1xuICAgICAgICBlMDA6IDEsIGUwMTogMCwgZTAyOiAwLCBlMDM6IDAsXG4gICAgICAgIGUxMDogMCwgZTExOiAxLCBlMTI6IDAsIGUxMzogMCxcbiAgICAgICAgZTIwOiAwLCBlMjE6IDAsIGUyMjogMSwgZTIzOiAwLFxuICAgICAgICBlMzA6IDAsIGUzMTogMCwgZTMyOiAwLCBlMzM6IDFcbiAgICAgIH07XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLmNyb3AgPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnByb3BzLmNyb3AgPSB7IHg6IDAsIHk6IDAsIHo6IDEsIHc6IDEgfTtcbiAgICB9IFxuICB9XG5cbiAgcGxheSgpIHtcbiAgICB0aGlzLnZpZGVvLnBsYXkoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCh7IHR5cGU6IFNUUkVBTUVWRU5UUy5QTEFZX1NVQ0NFU1MsIG1lc3NhZ2U6IFwiYXV0b3BsYXkgc3VjY2Vzc1wiIH0pO1xuICAgICAgdGhpcy5wbGF5aW5nID0gdHJ1ZTtcbiAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCh7IHR5cGU6IFNUUkVBTUVWRU5UUy5QTEFZX0VSUk9SLCBtZXNzYWdlOiBcImF1dG9wbGF5IGVycm9yXCIgfSk7XG4gICAgICB0aGlzLnBsYXlpbmcgPSBmYWxzZTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLnBsYXlpbmc7XG5cbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgdGhpcy52aWRlby5zdG9wKCk7XG4gIH1cblxuICBwYXVzZSgpIHtcblxuICB9XG5cbiAgc2V0Vm9sdW1lKHZvbHVtZSkge1xuICAgIHRoaXMudmlkZW8udm9sdW1lID0gdm9sdW1lO1xuICB9XG5cbiAgdXBkYXRlKHRpbWUpIHtcbiAgICB0aGlzLl9tYXRlcmlhbC51bmlmb3Jtcy50aW1lLnZhbHVlID0gdGltZTtcbiAgfVxuXG4gIGNyZWF0ZVZpZGVvRWwoKSB7XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidmlkZW9cIik7XG5cbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcInZvbHVtZXRyaWMtc3RyZWFtLXZpZGVvXCIpO1xuXG4gICAgZWwuc2V0QXR0cmlidXRlKFwicGxheXNpbmxpbmVcIiwgXCJcIik7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwid2Via2l0LXBsYXlzaW5saW5lXCIsIFwiXCIpO1xuICAgIC8vIGlPUyBTYWZhcmkgcmVxdWlyZXMgdGhlIGF1dG9wbGF5IGF0dHJpYnV0ZSwgb3IgaXQgd29uJ3QgcGxheSB0aGUgdmlkZW8gYXQgYWxsLlxuICAgIGVsLmF1dG9wbGF5ID0gdHJ1ZTtcbiAgICAvLyBpT1MgU2FmYXJpIHdpbGwgbm90IHBsYXkgdmlkZW9zIHdpdGhvdXQgdXNlciBpbnRlcmFjdGlvbi4gV2UgbXV0ZSB0aGUgdmlkZW8gc28gdGhhdCBpdCBjYW4gYXV0b3BsYXkgYW5kIHRoZW5cbiAgICAvLyBhbGxvdyB0aGUgdXNlciB0byB1bm11dGUgaXQgd2l0aCBhbiBpbnRlcmFjdGlvbiBpbiB0aGUgdW5tdXRlLXZpZGVvLWJ1dHRvbiBjb21wb25lbnQuXG4gICAgZWwubXV0ZWQgPSBmYWxzZTtcbiAgICBlbC5wcmVsb2FkID0gXCJhdXRvXCI7XG4gICAgZWwuY3Jvc3NPcmlnaW4gPSBcImFub255bW91c1wiO1xuXG4gICAgY29uc29sZS5sb2coXCJWb2x1bWV0cmljIFN0cmVhbTogVmlkZW8gZWxlbWVudCBjcmVhdGVkXCIsIGVsKTtcblxuICAgIHJldHVybiBlbDtcbiAgfVxuXG4gIHNjYWxlVG9Bc3BlY3RSYXRpbyhlbCwgcmF0aW8pIHtcbiAgICBjb25zdCB3aWR0aCA9IE1hdGgubWluKDEuMCwgMS4wIC8gcmF0aW8pO1xuICAgIGNvbnN0IGhlaWdodCA9IE1hdGgubWluKDEuMCwgcmF0aW8pO1xuICAgIGVsLm9iamVjdDNETWFwLm1lc2guc2NhbGUuc2V0KHdpZHRoLCBoZWlnaHQsIDEpO1xuICAgIGVsLm9iamVjdDNETWFwLm1lc2gubWF0cml4TmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICBpZiAodGhpcy50ZXh0dXJlLmltYWdlIGluc3RhbmNlb2YgSFRNTFZpZGVvRWxlbWVudCkge1xuICAgICAgY29uc3QgdmlkZW8gPSB0aGlzLnRleHR1cmUuaW1hZ2U7XG4gICAgICB2aWRlby5wYXVzZSgpO1xuICAgICAgdmlkZW8uc3JjID0gXCJcIjtcbiAgICAgIHZpZGVvLmxvYWQoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5obHMpIHtcbiAgICAgIHRoaXMuaGxzLnN0b3BMb2FkKCk7XG4gICAgICB0aGlzLmhscy5kZXRhY2hNZWRpYSgpO1xuICAgICAgdGhpcy5obHMuZGVzdHJveSgpO1xuICAgICAgdGhpcy5obHMgPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMudGV4dHVyZS5kaXNwb3NlKCk7XG4gICAgdGhpcy5tYXRlcmlhbC5kaXNwb3NlKCk7XG4gIH1cblxuICBzZXRWaWRlb1VybCh2aWRlb1VybCkge1xuICAgIGlmICh0aGlzLmhscykge1xuICAgICAgdGhpcy5zdGFydFZpZGVvKHZpZGVvVXJsKTtcbiAgICB9XG4gIH1cblxuICBzdGFydFZpZGVvKHZpZGVvVXJsKSB7XG4gICAgY29uc29sZS5sb2coXCJzdGFydFZpZGVvIFwiICsgdmlkZW9VcmwpO1xuXG4gICAgaWYgKEhscy5pc1N1cHBvcnRlZCgpKSB7XG5cbiAgICAgIGNvbnN0IGJhc2VVcmwgPSB2aWRlb1VybDtcblxuICAgICAgY29uc3Qgc2V0dXBIbHMgPSAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmhscykge1xuICAgICAgICAgIHRoaXMuaGxzLnN0b3BMb2FkKCk7XG4gICAgICAgICAgdGhpcy5obHMuZGV0YWNoTWVkaWEoKTtcbiAgICAgICAgICB0aGlzLmhscy5kZXN0cm95KCk7XG4gICAgICAgICAgdGhpcy5obHMgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9kbyB3ZSBuZWVkIHRvIGhvb2sgLyBvdmVycmlkZSBIbHMgeGhyIGNhbGxzIHRvIGhhbmRsZSBjb3JzIHByb3h5aW5nXG4gICAgICAgIGlmKCB0aGlzLmhsc194aHJvdmVycmlkZSApe1xuICAgICAgICAgIHRoaXMuaGxzID0gbmV3IEhscyh7XG4gICAgICAgICAgICB4aHJTZXR1cDogdGhpcy5obHNfeGhyb3ZlcnJpZGVcbiAgICAgICAgICB9KTtcblxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICB0aGlzLmhscyA9IG5ldyBIbHMoKTsgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5obHMubG9hZFNvdXJjZSh2aWRlb1VybCk7XG4gICAgICAgIHRoaXMuaGxzLmF0dGFjaE1lZGlhKHRoaXMudmlkZW8pO1xuXG4gICAgICAgIHRoaXMuaGxzLm9uKEhscy5FdmVudHMuRVJST1IsIChldmVudCwgZGF0YSkgPT4ge1xuICAgICAgICAgIGlmIChkYXRhLmZhdGFsKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGRhdGEudHlwZSkge1xuICAgICAgICAgICAgICBjYXNlIEhscy5FcnJvclR5cGVzLk5FVFdPUktfRVJST1I6XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcIk5FVFdPUktfRVJST1JcIiwgZGF0YSApXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KHsgdHlwZTogU1RSRUFNRVZFTlRTLk5FVFdPUktfRVJST1IsIG1lc3NhZ2U6IGRhdGEubWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICAvLyB0cnkgdG8gcmVjb3ZlciBuZXR3b3JrIGVycm9yXG4gICAgICAgICAgICAgICAgdGhpcy5obHMuc3RhcnRMb2FkKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSGxzLkVycm9yVHlwZXMuTUVESUFfRVJST1I6XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcIk1FRElBX0VSUk9SXCIsIGRhdGEgKVxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCh7IHR5cGU6IFNUUkVBTUVWRU5UUy5NRURJQV9FUlJPUiwgbWVzc2FnZTogZGF0YS5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuaGxzLnJlY292ZXJNZWRpYUVycm9yKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcIkhscyBFUlJPUlwiLCBkYXRhIClcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoeyB0eXBlOiBTVFJFQU1FVkVOVFMuSExTX0VSUk9SLCBtZXNzYWdlOiBgaGxzIGVycm9yICR7ZGF0YS50eXBlfSAke2RhdGEubWVzc2FnZX1gIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJIbHMgbm9uIGZhdGFyIGVycm9yOlwiLCBkYXRhKTtcbiAgICAgICAgICAgIGlmKCBkYXRhLnR5cGUgPT0gSGxzLkVycm9yVHlwZXMuTUVESUFfRVJST1Ipe1xuICAgICAgICAgICAgICAvL3RoaXMuaGxzLnJlY292ZXJNZWRpYUVycm9yKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmhscy5vbihIbHMuRXZlbnRzLk1BTklGRVNUX1BBUlNFRCwgKGV2ZW50LCBkYXRhKSA9PiB7XG4gICAgICAgICAgdGhpcy5sb2FkVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICAgIGNvbnN0IF90aGlzID0gdGhpcztcbiAgICAgICAgICB0aGlzLnZpZGVvLnBsYXkoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSGxzIHN1Y2Nlc3MgYXV0byBwbGF5aW5nIFwiICsgX3RoaXMucGFyYW1zLnN0YXJ0YXQgKTtcbiAgICAgICAgICAgIF90aGlzLnZpZGVvLmN1cnJlbnRUaW1lID0gX3RoaXMucGFyYW1zLnN0YXJ0YXQ7XG4gICAgICAgICAgICBfdGhpcy5kaXNwYXRjaEV2ZW50KHsgdHlwZTogU1RSRUFNRVZFTlRTLlBMQVlfU1VDQ0VTUywgbWVzc2FnZTogXCJhdXRvcGxheSBzdWNjZXNzXCIgfSk7XG4gICAgICAgICAgICBfdGhpcy5wbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJIbHMgZXJyb3IgdHJ5aW5nIHRvIGF1dG8gcGxheSBcIiArIGVycm9yICsgXCIgXCIgKyBlcnJvci5uYW1lKTtcbiAgICAgICAgICAgIF90aGlzLmRpc3BhdGNoRXZlbnQoeyB0eXBlOiBTVFJFQU1FVkVOVFMuUExBWV9FUlJPUiwgbWVzc2FnZTogXCJlcnJvciB0cnlpbmcgdG8gYXV0byBwbGF5IFwiICsgZXJyb3IgKyBcIiBcIiArIGVycm9yLm5hbWUgfSk7XG4gICAgICAgICAgICBfdGhpcy5wbGF5aW5nID0gZmFsc2U7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgc2V0dXBIbHMoKTtcblxuICAgIH0gZWxzZSBpZiAodGhpcy52aWRlby5jYW5QbGF5VHlwZShjb250ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMudmlkZW8uc3JjID0gdmlkZW9Vcmw7XG4gICAgICB0aGlzLnZpZGVvLm9uZXJyb3IgPSBmYWlsTG9hZDtcblxuICAgICAgdGhpcy52aWRlby5wbGF5KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCh7IHR5cGU6IFNUUkVBTUVWRU5UUy5QTEFZX1NVQ0NFU1MsIG1lc3NhZ2U6IFwiYXV0b3BsYXkgc3VjY2Vzc1wiIH0pO1xuICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCh7IHR5cGU6IFNUUkVBTUVWRU5UUy5QTEFZX0VSUk9SLCBtZXNzYWdlOiBcImF1dG9wbGF5IGVycm9yXCIgfSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgYXV0b3BsYXlcIiwgZGF0YSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coXCJIbHMgdW5zdXBwb3J0ZWQsIGNhbid0IGxvYWQgb3IgcGxheVwiKTtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCh7IHR5cGU6IFNUUkVBTUVWRU5UUy5MT0FEX0VSUk9SLCBtZXNzYWdlOiBcIkhscyB1bnN1cHBvcnRlZCwgY2FuJ3QgcGxheSBtZWRpYVwiIH0pO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZQVFN0cmVhbTsiXX0=
