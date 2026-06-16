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

If you e.g. want to end the session when the user closes the Webchat widget using the header close ("X") button, listen for the `webchat/close-button` event:

```javascript
webchat.registerAnalyticsService(event => {
	if (event.type === "webchat/close-button") {
		webchat.endSession();
	}
});
```

This will end the current session and clear any messages from the session.

> [!NOTE]
> Use `webchat/close-button` rather than `webchat/close` for this. The `webchat/close` event also fires when the user collapses the open chat with the toggle button (the chat icon in the corner of the page) and when you call `webchat.close()` or `webchat.toggle()`, so ending the session on `webchat/close` would also end it on every toggle. The `webchat/close-button` event fires **only** when a header close ("X") button is used — both the chat window header and the connection-lost (disconnect) overlay. The home screen's close button and the header minimize button emit `webchat/minimize` (never `webchat/close-button`), so they do not end the session.

## Webchat Events

| Type                       | Payload          | Description                                                                                                                                                                                                                        |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webchat/open`             | -                | The webchat was opened                                                                                                                                                                                                             |
| `webchat/close`            | -                | The webchat was closed — fires for a header close ("X") button, the toggle button, and the `webchat.close()` / `webchat.toggle()` APIs (but not for minimizing)                                                                    |
| `webchat/close-button`     | -                | The webchat was closed via a header close ("X") button — the chat window header or the disconnect overlay. Does not fire for the toggle button, the home screen close (which minimizes), or `webchat.close()` / `webchat.toggle()` |
| `webchat/minimize`         | -                | The webchat was minimized                                                                                                                                                                                                          |
| `webchat/switch-session`   | `sessionId`      | The session was switched                                                                                                                                                                                                           |
| `webchat/incoming-message` | `{ text, data }` | A message was received from Cognigy                                                                                                                                                                                                |
| `webchat/outgoing-message` | `{ text, data }` | A message was sent to Cognigy                                                                                                                                                                                                      |
| `plugin/messenger/action`  | `Object`         | An action was triggered from a Webchat or Messenger Template                                                                                                                                                                       |

See it in action:  
[![Edit Analytics API](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/using-the-webchat-api-ho5nk?fontsize=14&hidenavigation=1&theme=dark)
