# Analytics API

You can register to a set of various events that occur within the Webchat, from data flows like "a message was received from Cognigy" to interactions like "the webchat was closed".  
To do that, use the `webchat.registerAnalyticsService` function to execute a callback when events occur:

```javascript
webchat.registerAnalyticsService(event => {
	// react to the event that ocurred
});
```

If you e.g. want to react to incoming messages from Cognigy, you can do it like this:

```javascript
webchat.registerAnalyticsService(event => {
	if (event.type === "webchat/incoming-message") {
		console.log("incoming message: " + event.payload.text);
	}
});
```

Anytime an event is being emitted within the Webchat, it will cause the passed callback function to be executed.
The `event` object will always have a `type` property and may have a `payload` property depending on the event.
By checking for `event.type`, you can filter events for the ones you are interested in.

If you want to react when the user closes the Webchat widget using a header close ("X") button, listen for the `webchat/close-button` event. A common goal is to tear down the connection when the user closes the chat — for example after the connection dropped and the user dismisses the connection-lost overlay. Use `webchat.disconnect()` for that, and use the event payload to act **only when a session was actually started** (the same close button also appears on screens shown _before_ a session connects — the home screen, the privacy notice, and the previous-conversations screen):

```javascript
webchat.registerAnalyticsService(event => {
	if (event.type === "webchat/close-button") {
		// `hadConnection` is true once a session has connected this visit —
		// including after the connection dropped (e.g. the connection-lost
		// overlay) or a home screen returned to after connecting. It is false
		// only before the first connection, where there is nothing to disconnect.
		if (event.payload?.hadConnection) {
			webchat.disconnect();
		}
	}
});
```

Pick the action that matches your intent:

- **`webchat.disconnect()`** — close the socket and halt reconnection attempts. This is usually what you want when the user closes a chat, especially after the connection was lost. It is not a permanent stop: the Webchat reconnects when the conversation resumes or connectivity is restored — see [`webchat.disconnect()`](./webchat-api.md#disconnect-the-session).
- **`webchat.endSession()`** — switch to a fresh session and clear its messages. This **reconnects** to a new session; it does not stop the connection. Use it to reset the conversation, not to disconnect.
- **`webchat.close()`** — only collapse the widget; the connection and any reconnection attempts keep running in the background.

> [!NOTE]
> Use `webchat/close-button` rather than `webchat/close` for this. The `webchat/close` event also fires when the user collapses the open chat with the toggle button (the chat icon in the corner of the page) and when you call `webchat.close()` or `webchat.toggle()`, so acting on `webchat/close` would also fire on every toggle. The `webchat/close-button` event fires when a header close ("X") button is used — the chat window header, the home screen, and the connection-lost (disconnect) overlay. (The home screen's X also emits `webchat/minimize`, since it minimizes rather than closing a session.) The header **minimize** button emits only `webchat/minimize`, never `webchat/close-button`. Because the close button also appears on pre-session screens, always check `event.payload.hadConnection` (as shown above) before acting.

## Webchat Events

| Type                       | Payload                        | Description                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `webchat/open`             | -                              | The webchat was opened                                                                                                                                                                                                                                                                                                                                                                           |
| `webchat/close`            | -                              | The webchat was closed — fires for a header close ("X") button, the toggle button, and the `webchat.close()` / `webchat.toggle()` APIs (but not for minimizing)                                                                                                                                                                                                                                  |
| `webchat/close-button`     | `{ connected, hadConnection }` | The webchat was closed via a header close ("X") button — the chat window header, the home screen, or the disconnect overlay. `connected` is the live socket state at close time; `hadConnection` is `true` once a session has connected this visit (and stays `true` after it drops). Does not fire for the toggle button, the header minimize button, or `webchat.close()` / `webchat.toggle()` |
| `webchat/minimize`         | -                              | The webchat was minimized                                                                                                                                                                                                                                                                                                                                                                        |
| `webchat/switch-session`   | `sessionId`                    | The session was switched                                                                                                                                                                                                                                                                                                                                                                         |
| `webchat/incoming-message` | `{ text, data }`               | A message was received from Cognigy                                                                                                                                                                                                                                                                                                                                                              |
| `webchat/outgoing-message` | `{ text, data }`               | A message was sent to Cognigy                                                                                                                                                                                                                                                                                                                                                                    |
| `plugin/messenger/action`  | `Object`                       | An action was triggered from a Webchat or Messenger Template                                                                                                                                                                                                                                                                                                                                     |

See it in action:  
[![Edit Analytics API](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/using-the-webchat-api-ho5nk?fontsize=14&hidenavigation=1&theme=dark)
