//VPTStream 

//NOTE on GLSL
//we use webpack-glsl-loader to include the shaders (https://github.com/grieve/webpack-glsl-loader#readme)
//which in turn depends on glslify (https://github.com/glslify/glslify)
const rgbdFrag = require('./shaders/perspective.frag');
const rgbdVert = require('./shaders/perspective.vert');

const orthoFrag = require('./shaders/ortho.frag');
const orthoVert = require('./shaders/ortho.vert');

const cutoutFrag = require('./shaders/cutout.frag');
const cutoutVert = require('./shaders/cutout.vert');

const HLS_TIMEOUT = 2500;

const schema = {
  videoPath: { type: 'string' },
  meta: {type: 'object', defaults: {}},
  startat: { type: 'number', default: 0 },
  renderMode: { type: 'string', default: 'perspective' },
  depthMin: { type: 'number', default: 0.29 },
  depthMax: { type: 'number', default: 4.0 },
  pointSize: { type: 'number', default: 8.0 },
  scale: { type: 'number', default: 1.0 },
  textureSize: { type: 'vec2', default: {w:320, h:240} },
  thresholdMin: { type: 'vec3', default: {x:-2.0, y:-2.0,z:0.0} }, 
  thresholdMax: { type: 'vec3', default:  {x:2.0, y:2.0,z:4.0} },
}

const STREAMEVENTS = Object.freeze({
  PLAY_SUCCESS: "PLAY_SUCCESS",
  PLAY_ERROR: "PLAY_ERROR",
  LOAD_ERROR: "LOAD_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  MEDIA_ERROR: "MEDIA_ERROR",
  HLS_ERROR: "HLS_ERROR"
})

//Volumetric Performance Toolbox streaming player
class VPTStream extends THREE.Object3D {

  constructor() {
    super();

    this.video = this.createVideoEl();
    this.texture = new THREE.VideoTexture(this.video);
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.format = THREE.RGBFormat;
    this.hls = null;

    //When using vptstream in mozilla hubs/spoke we run into issues with the proxy / cors setup and the way Hls resolves urls.
    //Hack copied from her: https://github.com/mozilla/hubs/blob/584e48ad0ccc0da1fc9781e7686d19431a2340cd/src/components/media-views.js#L773
    //the function params / signature is (xhr, u)  
    this.hls_xhroverride = null;

    this.loadTime = 0;
    this.playing = false;
    this.meshScalar = 2;
    this.params = {}

    // Set param defaults
    for (const property in schema) {
      this.params[property] = schema[property].default;
    }
  }

  static get STREAMEVENTS() {
    return STREAMEVENTS;
  }

  get LoadTime() {
    return this.loadTime;
  }

  get Playing() 
  {
    return this.playing;
  }

  updateParameter( param, value){

    if( param == "startat"){
      this.video.currentTime = value;
    }else{
      if( this.material){
        this.material.uniforms[param].value = value;
      }
    }

  }

  updateParameters(params) {
    for (const property in params) {
      console.log(`${property} value:${params[property]}`);
      this.params[property] = params[property];
    }
  }
 
  load(params) 
  {
    console.log("vptstream load");

    for (const property in schema) {
      console.log(`${property} value:${params[property]} default:${schema[property].default}`);
      this.params[property] = params.hasOwnProperty(property) ? params[property] : schema[property].default;
    }

    this.setProps( this.params.meta );

    this.startVideo(this.params.videoPath);

    this.setupGeometry();
  }

  setupGeometry()
  {
    //so far we have not had to use custom extrinsics for Azure Kinect or Realsense
    //default could suffice as the alignment is done upstream, when we grab if from the sensor
    //leaving this here to allow for textures that still need alignment 
    const extrinsics = new THREE.Matrix4();
    const ex = this.props.extrinsics;
    extrinsics.set(
      ex["e00"], ex["e10"], ex["e20"], ex["e30"],
      ex["e01"], ex["e11"], ex["e21"], ex["e31"],
      ex["e02"], ex["e12"], ex["e22"], ex["e32"],
      ex["e03"], ex["e13"], ex["e23"], ex["e33"]
    );

    if( this.material){
      console.log("Material exists, dispose")
      this.material.dispose();
      const child = this.getObjectByName("VolumetricVideo");
      if( child ){
        console.log("VolumetricVideo exists, remove")
        this.remove(child);
      }
    }

    let geometry = new THREE.PlaneBufferGeometry(1, 1, this.params.textureSize.w,  this.params.textureSize.h);
    
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
            "thresholdMin":{
              value: this.params.thresholdMin
            },
            "thresholdMax":{
              value: this.params.thresholdMax
            },    
            "scale": {
              value: this.params.scale
            },
            extensions:
            {
              derivatives: true
            }
          },
          side: THREE.DoubleSide,
          vertexShader: orthoVert,
          fragmentShader: orthoFrag,
          transparent: true
          //depthWrite:falses
        });

        let pointsO = new THREE.Points(geometry, this.material);
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
            "thresholdMin":{
              value: this.params.thresholdMin
            },
            "thresholdMax":{
              value: this.params.thresholdMax
            },    
            "scale": {
              value: this.params.scale
            },
            extensions:
            {
              derivatives: true
            }
          },
          side: THREE.DoubleSide,
          vertexShader: cutoutVert,
          fragmentShader: cutoutFrag,
          transparent: true
        });

        let plane = new THREE.Mesh(geometry, this.material);
        plane.position.y = 1;
        plane.scale.set( this.params.textureSize.w / this.params.textureSize.h, 1.0, 1.0);
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
            "width":{
              value: this.props.textureWidth
            },
            "height":{
              value: this.props.textureHeight
            },
            "thresholdMin":{
              value: this.params.thresholdMin
            },
            "thresholdMax":{
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
          extensions:
          {
            derivatives: true,
          },
          vertexShader: rgbdVert,
          fragmentShader: rgbdFrag,
          transparent: true
        });

        //Make the shader material double sided
        this.material.side = THREE.DoubleSide;
        
        let pointP = new THREE.Points(geometry, this.material);
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
              "width":{
                value: this.props.textureWidth
              },
              "height":{
                value: this.props.textureHeight
              },
              "thresholdMin":{
                value: this.params.thresholdMin
              },
              "thresholdMax":{
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
            extensions:
            {
              derivatives: true,
            },
            vertexShader: rgbdVert_rs2,
            fragmentShader: rgbdFrag_rs2,
            transparent: true
          });
  
          //Make the shader material double sided
          this.material.side = THREE.DoubleSide;
          
          let pointPRL2 = new THREE.Points(geometry, this.material);
          pointPRL2.name = "VolumetricVideo";
          pointPRL2.position.y = 1;
          this.add(pointPRL2);
          break;  
    }
  }

  setMediaStream(mediaStream, params = null)
  {
    console.log("vptstream setMediaStream");

    if (params) {
      for (const property in schema) {
        console.log(`${property} value:${params[property]} default:${schema[property].default}`);
        this.params[property] = params.hasOwnProperty(property) ? params[property] : schema[property].default;
      }
    }

    this.setProps( this.params.meta );

    const _this = this;
    this.video.srcObject = mediaStream;
    this.video.play().then(function () {
        _this.dispatchEvent({ type: STREAMEVENTS.PLAY_SUCCESS, message: "autoplay success" });
    }).catch(function (error) {
        _this.dispatchEvent({ type: STREAMEVENTS.PLAY_ERROR, message: "autoplay error" });
        console.log("error autoplay", data);
    });

    /* Recreate the texture to match the video */
    if (this.texture) {
      this.texture.dispose();
    }
    this.texture = new THREE.VideoTexture(this.video);
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.LinearFilter;

    this.setupGeometry();
  }

  //load depth camera properties for perspective reprojection
  loadPropsFromFile(filePath) {
    return new Promise((resolve, reject) => {
        const jsonLoader = new THREE.FileLoader(this.manager);
        jsonLoader.setResponseType('json');
        jsonLoader.load(filePath, data => {
          resolve(data);
        }, null, err => {
          reject(err);
        });
      });    
  }
  
  //set perspective projection properties
  setProps(_props) {
    this.props = _props;

    if (!this.props.hasOwnProperty("depthFocalLength") ){
      console.error("invalid meta data for perspective rendering, default to cutout");
      this.params.renderMode = "cutout"
    }

    if (this.props.textureWidth == undefined || this.props.textureHeight == undefined) {
      this.props.textureWidth = this.props.depthImageSize.x;
      this.props.textureHeight = this.props.depthImageSize.y * 2;
    }
    if (this.props.extrinsics == undefined) {
      this.props.extrinsics = {
        e00: 1, e01: 0, e02: 0, e03: 0,
        e10: 0, e11: 1, e12: 0, e13: 0,
        e20: 0, e21: 0, e22: 1, e23: 0,
        e30: 0, e31: 0, e32: 0, e33: 1
      };
    }
    if (this.props.crop == undefined) {
      this.props.crop = { x: 0, y: 0, z: 1, w: 1 };
    } 
  }

  play() {
    this.video.play().then(function () {
      this.dispatchEvent({ type: STREAMEVENTS.PLAY_SUCCESS, message: "autoplay success" });
      this.playing = true;
    }).catch(function (error) {
      this.dispatchEvent({ type: STREAMEVENTS.PLAY_ERROR, message: "autoplay error" });
      this.playing = false;
    });

    return this.playing;

  }

  stop() {
    this.video.stop();
  }

  pause() {

  }

  setVolume(volume) {
    this.video.volume = volume;
  }

  update(time) {
    this._material.uniforms.time.value = time;
  }

  createVideoEl() {
    const el = document.createElement("video");

    el.setAttribute("id", "volumetric-stream-video");

    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    // iOS Safari requires the autoplay attribute, or it won't play the video at all.
    el.autoplay = true;
    // iOS Safari will not play videos without user interaction. We mute the video so that it can autoplay and then
    // allow the user to unmute it with an interaction in the unmute-video-button component.
    el.muted = false;
    el.preload = "auto";
    el.crossOrigin = "anonymous";

    console.log("Volumetric Stream: Video element created", el);

    return el;
  }

  scaleToAspectRatio(el, ratio) {
    const width = Math.min(1.0, 1.0 / ratio);
    const height = Math.min(1.0, ratio);
    el.object3DMap.mesh.scale.set(width, height, 1);
    el.object3DMap.mesh.matrixNeedsUpdate = true;
  }

  dispose() {
    if (this.texture.image instanceof HTMLVideoElement) {
      const video = this.texture.image;
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

  setVideoUrl(videoUrl) {
    if (this.hls) {
      this.startVideo(videoUrl);
    }
  }

  startVideo(videoUrl) {
    console.log("startVideo " + videoUrl);

    if (Hls.isSupported()) {

      const baseUrl = videoUrl;

      const setupHls = () => {
        if (this.hls) {
          this.hls.stopLoad();
          this.hls.detachMedia();
          this.hls.destroy();
          this.hls = null;
        }

        //do we need to hook / override Hls xhr calls to handle cors proxying
        if( this.hls_xhroverride ){
          this.hls = new Hls({
            xhrSetup: this.hls_xhroverride
          });

        }else{
          this.hls = new Hls();          
        }
        this.hls.loadSource(videoUrl);
        this.hls.attachMedia(this.video);

        this.hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                //console.log("NETWORK_ERROR", data )
                this.dispatchEvent({ type: STREAMEVENTS.NETWORK_ERROR, message: data.message });
                // try to recover network error
                this.hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                //console.log("MEDIA_ERROR", data )
                this.dispatchEvent({ type: STREAMEVENTS.MEDIA_ERROR, message: data.message });
                this.hls.recoverMediaError();
                break;
              default:
                //console.log("Hls ERROR", data )
                this.dispatchEvent({ type: STREAMEVENTS.HLS_ERROR, message: `hls error ${data.type} ${data.message}` });
                return;
            }
          } else {
            console.log("Hls non fatar error:", data);
            if( data.type == Hls.ErrorTypes.MEDIA_ERROR){
              //this.hls.recoverMediaError();
            }
          }
        });

        this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          this.loadTime = performance.now();
          const _this = this;
          this.video.play().then(function () {
            console.log("Hls success auto playing " + _this.params.startat );
            _this.video.currentTime = _this.params.startat;
            _this.dispatchEvent({ type: STREAMEVENTS.PLAY_SUCCESS, message: "autoplay success" });
            _this.playing = true;
          }).catch(function (error) {
            //console.log("Hls error trying to auto play " + error + " " + error.name);
            _this.dispatchEvent({ type: STREAMEVENTS.PLAY_ERROR, message: "error trying to auto play " + error + " " + error.name });
            _this.playing = false;
          });
        });
      };

      setupHls();

    } else if (this.video.canPlayType(contentType)) {
      this.video.src = videoUrl;
      this.video.onerror = failLoad;

      this.video.play().then(function () {
        this.dispatchEvent({ type: STREAMEVENTS.PLAY_SUCCESS, message: "autoplay success" });
      }).catch(function (error) {
        this.dispatchEvent({ type: STREAMEVENTS.PLAY_ERROR, message: "autoplay error" });
        console.log("error autoplay", data);
      });
    } else {
      console.log("Hls unsupported, can't load or play");
      this.dispatchEvent({ type: STREAMEVENTS.LOAD_ERROR, message: "Hls unsupported, can't play media" });
    }
  }
}

module.exports = VPTStream;
