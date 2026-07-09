# Webchat API

The `initWebchat()` method resolves a `webchat` object as soon as a connection is established. You can use this object to access the Webchat's API.

For modern browsers, you can access it like this:

```
initWebchat('...').then(webchat => {
    // use webchat here
})
```

If you plan to support legacy browsers, there is an alternative syntax:

```
initWebchat('...', {}, function (webchat) {
    // use webchat here
})
```

For integrations with Websites, it is recommended to store the `webchat` object in the global window namespace for access all across the Website:

```
initWebchat('...').then(webchat => {
    window.webchat = webchat;
})
```

See it in action:  
[![Edit Using the Webchat API](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/using-the-webchat-api-ppl1v?fontsize=14&hidenavigation=1&theme=dark)

## Open and Close the Webchat Widget

To open or close the Webchat widget from your website once it is loaded, use the following methods:

- `webchat.open()` — opens the Webchat widget. Use this method to open the Webchat widget, for example, when a user clicks a custom button on your website. Note that if the Webchat widget is already open, calling this method will close it.
- `webchat.close()` — closes the Webchat widget. Use this method to close the Webchat widget, for example, after a conversation is completed.
- `webchat.toggle()` — toggles the Webchat widget between open and closed states. For example, if your website has a **Chat with us** button, clicking it once opens the Webchat widget and clicking it again closes it.

```javascript
// Open the Webchat widget when a user clicks a custom button on your website
document.getElementById("my-chat-button").addEventListener("click", () => {
	webchat.open();
});

// Close the Webchat widget after a conversation is completed
document.getElementById("my-close-button").addEventListener("click", () => {
	webchat.close();
});

// Toggle the Webchat widget open and closed state with a single button
document.getElementById("my-toggle-button").addEventListener("click", () => {
	webchat.toggle();
});
```

[![Edit Opening / Closing the Webchat widget externally](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/using-the-webchat-api-o227i?fontsize=14&hidenavigation=1&theme=dark)

## Disconnect the Session

To close the Webchat's socket connection and stop any automatic reconnection attempts, use `webchat.disconnect()`:

```javascript
webchat.disconnect();
```

This is distinct from the other "closing" methods:

- `webchat.close()` only collapses the widget — the socket connection, and any automatic reconnection attempts, keep running in the background.
- `webchat.endSession()` switches to a fresh session and **reconnects** — it does not stop the connection.
- `webchat.disconnect()` closes the socket and cancels in-flight reconnection attempts.

`disconnect()` is not a permanent stop: the Webchat establishes a new connection again when the conversation resumes (the user sends a message or returns to the chat screen) or when connectivity is restored (the browser tab becomes visible again or the network comes back online).

## Send Messages

You can use the Webchat API to send messages from outside of the Webchat widget via `webchat.sendMessage()`.

### Send Text Messages

To send text messages, pass the text content as the first argument:

```javascript
webchat.sendMessage("hello world!");
```

### Send Text and Data Messages

If you want to add data-output to your message, pass it as an object via a second argument, like this:

```javascript
webchat.sendMessage("hello world!", {
	origin: "sendMessage method",
});
```

### Send Data-Only Messages

In case you want to send a data-only message, pass an empty string as the first argument:

```javascript
webchat.sendMessage("", {
	origin: "sendMessage method",
});
```

By default, data-only messages will be invisible in the Chat History.

### Send a Message with an Alternative Label

It is possible to override the visible message text by using a third parameter like this:

```javascript
webchat.sendMessage(
	"hello world!",
	{},
	{
		label: "foobar",
	},
);
```

### Show notification in Chat

Shows a notification banner when the Webchat widget is open.

```javascript
webchat.showNotification("hello world!");
```

### Skip the Start Screen

To skip the start screen and start the conversation immediately, use the `startConversation()` method:

```javascript
webchat.startConversation();
```

See it in action:  
[![Edit Sending Messages via the Webchat API](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/using-the-webchat-api-hnd6r?fontsize=14&hidenavigation=1&theme=dark)

## Update Webchat Settings

To update the Webchat settings at runtime, use the `webchat.updateSettings(...)` method.
This method receives a settings object as a parameter and updates the settings provided in the object while leaving the remaining settings unchanged.

> [!NOTE]
> Only a subset of settings is safe to update at runtime. For further information, refer to the [Endpoint Settings](./embedding.md#endpoint-settings).

```javascript
// this will disable the unread message preview at runtime
webchat.updateSettings({
	unreadMessages: {
		enablePreview: false,
	},
});
```

## Analytics API

Read more on how to register for Webchat events on the [Analytics API](./analytics-api.md) page.
