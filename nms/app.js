const NodeMediaServer = require('node-media-server');

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    mediaroot: './media',
    allow_origin: '*'
  },
  trans: {
    ffmpeg: '/usr/local/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        ac: "aac",
        acParam: ['-ab', '44100', '-ac', '1', '-ar', '44100'],
        vc: 'libx264',
        hls: true,
        hlsFlags: '[hls_time=5:hls_list_size=10:hls_flags=delete_segments]',
        mp4: true,
        mp4Flags:'[movflags=frag_keyframe+empty_moov]'
      }
    ]
  }
};

var nms = new NodeMediaServer(config)
nms.run();
