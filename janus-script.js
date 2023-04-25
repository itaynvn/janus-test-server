let janus;
let streamingHandle;

function initJanus(callback) {
  Janus.init({
    debug: "all",
    callback: function () {
      if (typeof callback === "function") callback();
    },
  });
}

function initSetupPage() {
  initJanus(() => {
    // Instantiate Janus and create the streaming handle
    // Replace 'http://your-janus-server-ip:8088/janus' with your Janus server's address
    janus = new Janus({
      server: "http://localhost:8088/janus",
      success: function () {
        janus.attach({
          plugin: "janus.plugin.streaming",
          success: function (pluginHandle) {
            streamingHandle = pluginHandle;
            // Implement camera/microphone selection and level display
            // Implement start/stop broadcast logic
          },
          error: function (error) {
            console.error("Error attaching plugin: ", error);
          },
        });
      },
      error: function (error) {
        console.error("Error initializing Janus: ", error);
      },
    });
  });
}

function initDisplayPage() {
  initJanus(() => {
    // Instantiate Janus and create the streaming handle
    // Replace 'http://your-janus-server-ip:8088/janus' with your Janus server's address
    janus = new Janus({
      server: "http://localhost:8088/janus",
      success: function () {
        janus.attach({
          plugin: "janus.plugin.streaming",
          success: function (pluginHandle) {
            streamingHandle = pluginHandle;
            // Start streaming from the broadcast source
            document.getElementById("streamSelector").addEventListener("change", (event) => {
                const streamId = parseInt(event.target.value);
                startRemoteStream(streamId);
            });              
          },
          error: function (error) {
            console.error("Error attaching plugin: ", error);
          },
          onmessage: function (msg, jsep) {
            Janus.debug(" ::: Got a message ::: ", msg);
            if (jsep) {
              // Remote video feed
              streamingHandle.createAnswer({
                jsep: jsep,
                media: { audioSend: false, videoSend: false },
                success: function (jsep) {
                  streamingHandle.send({ message: { request: "start" }, jsep: jsep });
                },
                error: function (error) {
                  console.error("Error creating answer: ", error);
                },
              });
            }
          },
          onremotestream: function (stream) {
            // Attach the remote stream to the video element
            Janus.attachMediaStream(document.getElementById("remoteVideo"), stream);
          },
        });
      },
      error: function (error) {
        console.error("Error initializing Janus: ", error);
      },
    });
  });
  createDisplayHandle(populateStreamSelector);
}

function createDisplayHandle(callback) {
    janus.attach({
      plugin: "janus.plugin.streaming",
      success: function (pluginHandle) {
        streamingHandle = pluginHandle;
        callback();
      },
      error: function (error) {
        console.error("Error attaching plugin:", error);
      },
    });
  }    

function listStreams(callback) {
    streamingHandle.send({
      message: { request: "list" },
      success: function (result) {
        if (result && result.list) {
          callback(null, result.list);
        } else {
          callback("Failed to get stream list");
        }
      },
      error: function (error) {
        callback(error);
      },
    });
  }
  

let broadcasting = false;

function startBroadcast() {
  if (broadcasting) return;
  broadcasting = true;
  
  streamingHandle.createOffer({
    media: {
      video: true,
      audio: true,
    },
    success: function (jsep) {
      streamingHandle.send({ message: { request: "create" }, jsep: jsep });
    },
  });
}

function stopBroadcast() {
  if (!broadcasting) return;
  broadcasting = false;
  
  streamingHandle.send({ message: { request: "destroy" } });
}


function populateStreamSelector() {
    const streamSelector = document.getElementById("streamSelector");
    listStreams((streams) => {
      streams.forEach((stream) => {
        const option = document.createElement("option");
        option.value = stream.id;
        option.textContent = stream.description || `Stream ${stream.id}`;
        streamSelector.appendChild(option);
      });
    });
  }  

function startRemoteStream(streamId) {
if (!streamId) return;
streamingHandle.send({ message: { request: "watch", id: streamId } });
}  