# Persistent History

By using the Webchat, the conversation history will be persisted locally into the client browser's `LocalStorage` for this Website.
When the Webchat is initialized via `initWebchat`, it will try to load a previous conversation based on the provided `userId` and `sessionId`.
By default, the Webchat will automatically re-use the `userId`. By manually telling `initWebchat` to use the same `sessionId` as before, the Webchat can be instructed to load the previously persisted chat history.

```javascript

// Initialize a sessionId, undefined by default.
let sessionId;

function storeSessionId(sessionId) {
  if (window.localStorage) {
    localStorage.setItem("SESSIONID", sessionId);
  }
}

// in case LocalStorage is supported...
if (window.localStorage) {  
  // try to load a previously stored sessionId from the LocalStorage
  sessionId = window.localStorage.getItem("SESSIONID");

  // in case there was no previously stored sessionId,
  // generate one and store it into LocalStorage
  if (!sessionId) {
    sessionId = "session-" + Date.now() * Math.random();
    storeSessionId(sessionId);
  }
}

// use the sessionId for initializing the Webchat
initWebchat("...", {
  sessionId
}).then(webchat => {
  webchat.open();
  // If the Previous Conversations feature is enabled, it is possible for the sessionsId to be changed.
  // For this scenario, we should subscribe to the analytics event `switch-session` and update the LocalStorage
  webchat.registerAnalyticsService(event => {
    if (event.type === "webchat/switch-session") {
      storeSessionId(event.payload);
    }
});
});
```

See it in action:  
[![Edit Local Persistent History](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/local-persistent-history-jpr6z?fontsize=14&hidenavigation=1&theme=dark)