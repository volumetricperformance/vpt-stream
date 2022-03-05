# Custom Hubs Components

This article walks through how we created a custom "component" in Mozilla Hubs. This article does not pretend to follow best practices, it's one way/hack on how we get things to work in November 2020.

Since then Mozilla has released documentation on how to create a Custom Component, this was released after we made made our modificatios in December 2020
https://github.com/mozilla/Spoke/blob/master/docs/creating-custom-elements.md

We will create a modified Hubs Cloud client and Spoke instance that we deploy to AWS Hubs Cloud. 

The outcome is the ability to add a custom component in a Spoke, publish this and view it in a custom Hubs client.

The custom component we are creating is a wrapper around vpt-stream, which renders RGBD streams as pointcloud. See here for more info: https://medium.com/volumetric-performance/light-pixel-point-unpacking-the-volumetric-performance-toolbox-e5bf7a9781f5

## Behind the Scene

A space in Hubs is stored as a GLTF file. When you publish a project from Spoke it generates a GLTF files and publishes this to the Hubs server environment. The Hubs client parses this GLTF file in runtime and instantiates the relevant components as AFRAME components. 

To add a custom component you need to hook into the saving and loading/parsing of the GLTF file. Saving happens in Spoke and Loading happens in Hubs.

## Spoke


### Setup

- Clone of fork https://github.com/mozilla/Spoke.git
- Checkout hubs-cloud branch
- yarn install
- edit ```.env.defaults``` replace the following lines
```
HUBS_SERVER="localhost:8080"
RETICULUM_SERVER="dev.reticulum.io"
THUMBNAIL_SERVER="nearspark-dev.reticulum.io"
NON_CORS_PROXY_DOMAINS="hubs.local,localhost,mux.com,dev.reticulum.io"
CORS_PROXY_SERVER="hubs-proxy.com"
```
- yarn start

To deploy to your AWS server

- Create ```scripts/deploy.js``` and copy in this file: https://github.com/volumetricperformance/Spoke/blob/hubs-cloud/scripts/deploy.js
- Edit ```package.json```
- Insert the following command at line #25
```"deploy": "node -r esm -r @babel/register ./scripts/deploy.js",```
- Copy ret.credentials after Hubs Cloud ```npm run login```
- Deploy: ```yarn run deploy```


### Overview

Please read this documentation on modifying Spoke first:

- https://github.com/mozilla/Spoke/blob/master/docs/README.md#Elements
- https://github.com/mozilla/Spoke/blob/master/docs/creating-custom-elements.md


To add vpt-stream to Spoke we need to:

- create the component that is rendered in the view (Node class)
- create the properties node that sits in the scene hierarchy (Node Property Editor)
- add depth camera intrinsics files
- modify ```config.js``` to register the new component (Node Registration)
- modify ```cloneObject3D.js``` to successfully serialize the vpt-stream 


### Add vpt-stream

- add the vpt-stream module: ```yarn add https://github.com/volumetricperformance/vpt-stream.git```

- the glslify dependency does not auto install so manually install it: ```yarn add glslify```

- create ```src/editor/nodes/VPTStreamNode.js```
  - copy in contents from 
  https://github.com/volumetricperformance/Spoke/blob/hubs-cloud/src/editor/nodes/VPTStreamNode.js

- create ```src/editor/ui/properties/VPTStreamNodeEditor.js```
  - copy in conteents from 
  https://github.com/volumetricperformance/Spoke/blob/hubs-cloud/src/ui/properties/VPTStreamNodeEditor.js

- create the folder ```src/assets/vpt```
  - copy contents from here https://github.com/volumetricperformance/Spoke/tree/hubs-cloud/src/assets/vpt
    - these file are hard coded in teh Node class, they define the camera intriniscs vpt-stream uses to calculate the point cloud from the rgbd stream

- edit `src/config.js`
  - add the following ```import``` statements
  ```
  import VPTStreamNode from "./editor/nodes/VPTStreamNode";
  import VPTStreamStreamNodeEditor from "./ui/properties/VPTStreamNodeEditor";
  ```

  - add the following to ```createEditor``` 
  ```
  editor.registerNode(VPTStreamNode, VPTStreamStreamNodeEditor);
  ```

If we were to publish at this point our export would throw an error. This is because our "wrapper" node instantiate a new Threejs Object3d. This is so you can preview the content inside Spoke. These "runtime" created elements don't need to be serialized as Hubs Cloud will created them based on the Node properties set on the Node. To work around this we added the concept of "NotForExport" nodes in Spoke that won't be written to the scene. 

- edit ```src/editor/utils/cloneObject3D.js```
  - overwrite with https://github.com/volumetricperformance/Spoke/blob/0010513e26dff963de995937826e5c2b1dd3fd9d/src/editor/utils/cloneObject3D.js
  - note: this is a hack that worked as of March 2022, if cloneObject3d changes after that you will need to cherry pick the modifications instead of overwriting the file. See this commit for the changes made: 
https://github.com/volumetricperformance/Spoke/commit/0010513e26dff963de995937826e5c2b1dd3fd9d#diff-f5b857785eec77af62aad031a55b06081dcfb0b4b9b3d89167ea8cd3007d4da3


## Hubs Cloud


### Setup

Setup your own Hubs Cloud
https://hubs.mozilla.com/docs/hubs-cloud-intro.html

Create your own Custom Cloud
https://hubs.mozilla.com/docs/hubs-cloud-custom-clients.html

Troubleshooting:

- Add hubs.local to your hosts file (https://github.com/mozilla/reticulum#1-setup-the-hubslocal-hostname)
- Before running npm run start, set the env variable HOST_IP to hubs.local. Edit ```.defaults.env``` add ```HOST_IP=hubs.local```. (https://github.com/mozilla/hubs/issues/4194#issuecomment-828881267)


### Overview

To add vpt-stream to Hubs we need to:

- install vpt-stream
- create a component that wraps vpt-stream
- import the component ```hubs.js```
- register it in ```gltf-component-mappings.js```

To cover for cases where autoplaying the stream fails we need to 

- add a button template in ```hubs.html```
- modify ```ui-root.js``` to show a button for lobby guests

### Add vpt-stream

- Install vpt-stream: ```npm install https://github.com/volumetricperformance/vpt-stream.git```
- Create component that wraps vtp-stream:
  - create file ```src/components/vpt-stream.js```
  - copy contents from https://github.com/volumetricperformance/hubs/blob/hubs-cloud/src/components/vpt-stream.js
- Import the component in ```hubs.js```:
  - add ```import "./components/vpt-stream";``` with the other import statements
- Register the component in ```gltf-component-mappings.js```;
  - add the following code block at the end of the file
  ```
  AFRAME.GLTFModelPlus.registerComponent("vpt-stream", "vpt-stream", (el, _componentName, componentData) => {
    console.log("VPT Stream " + _componentName);
    if (componentData.hasOwnProperty("id")) {
      el.setAttribute("id", componentData.id.trim());
    }

    el.setAttribute(_componentName, componentData);
  });
  ```

### Fallback for autoplay failing

We need to add support for a "play stream" button in case autoplay is disabled or does not pass muster

- Add the following button template in ```hubs.html``` after video-mute
  ```
  <template id="vpt-stream-autoplay">
                  <a-entity
                      billboard
                      class="ui interactable-ui unmute-ui"
                      tags="singleActionButton:true;" 
                      mixin="rounded-text-button" 
                      slice9="width: 0.8"                     
                      is-remote-hover-target>
                          <a-entity text="value:Play Stream; width:2; align:center;" text-raycast-hack position="0 0 0.02"></a-entity>                
                  </a-entity>
              </template>
  ```            

The vpt-stream componment will look for this template and instantiate it if needed it will emit "show_autoplay_dialog" and "hide_autoplay_dialog" for other systems / components to respond to.

When in the lobby you can't interact with a-frame components, so the autoplay button wont work. We need to show a button in the "UI" layer. 

- Edit ```src/react-components/ui-root.js```
  - Add the following to the state property
  ```showAutoplay: false```
  - Add listeners to show_autoplay_dialog and hide_autoplay_dialog in ```componentDidMount``` function
  ```
  this.props.scene.addEventListener("show_autoplay_dialog", () => this.setState({ showAutoplay: true }));
  this.props.scene.addEventListener("hide_autoplay_dialog", () => this.setState({ showAutoplay: false }));
  ```
  - Respond to the state change, add this to ```toolbarCenter``` under ```watching``` around line #1550
  ```
  {this.state.showAutoplay && (
    <ToolbarButton
      icon={<WarningCircleIcon />}
      label={<FormattedMessage id="toolbar.autoplay" defaultMessage="Play Stream" />}
      preset="accept"
      onClick={() => {
        this.props.scene.emit("autoplay_clicked");
      }}
    />
  )}

  ```