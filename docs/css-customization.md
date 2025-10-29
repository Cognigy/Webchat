# CSS Customization

In order to enhance the visual design of the Webchat, there is the possibility to apply custom CSS.
You will have to add the style to your embeded Webchat or just link a CSS file to it.

<!-- TODO: Add Working CodeSandbox link here -->

There are several classes that you need to take in consideration if you want to make some changes to the Webchat, the classes '_bot_' and '_user_' are used as helper classes that give us the possibility to customize the messages from the user and the bot separatly. The classes are the following:

- _webchat-root_
- _webchat_
- _webchat-toggle-button_
- _webchat-toggle-button-disabled_
- _webchat-unread-message-badge_
- _webchat-unread-message-preview-text_
- _webchat-teaser-message-root_
- _webchat-teaser-message-bubble_
- _webchat-teaser-message-header_
- _webchat-teaser-message-header-title_
- _webchat-teaser-message-header-logo_
- _webchat-teaser-message-header-close-button_
- _webchat-teaser-message-action-buttons_
- _webchat-teaser-message-button-container_
- _webchat-teaser-message-button_
- _webchat-header-bar_
- _webchat-header-logo-name-container_
- _webchat-header-logo_
- _webchat-header-cognigy-logo_
- _webchat-header-title_
- _webchat-header-close-button_
- _webchat-header-back-button_
- _webchat-header-minimize-button_
- _webchat-header-delete-all-conversations-button_
- _webchat-chat-history_
- _webchat-scroll-to-bottom-button_
- _webchat-input_
- _webchat-input-message-container_
- _webchat-input-message-label_
-! _webchat-input-text-active_
-! _webchat-input-stt-active_
-! _webchat-input-button-speech_
-! _webchat-input-button-speech-active_
-! _webchat-input-button-speech-background_
- _webchat-input-menu-form_
- _webchat-input-message-input_
- _webchat-input-button-add-attachments_
- _webchat-input-drag-and-drop-file-text_
- _webchat-input-button-send_
- _webchat-input-get-started-button_
- _webchat-input-persistent-menu-button_
- _webchat-input-persistent-menu_
- _webchat-input-persistent-menu-item_
- _webchat-input-persistent-menu-item-container_
- _webchat-privacy-notice-root_
- _webchat-privacy-notice-message_
- _webchat-privacy-notice-markdown-container_
- _webchat-privacy-notice-actions_
- _webchat-privacy-notice-accept-button_
- _webchat-privacy-policy-link_
- _webchat-homescreen-root_
- _webchat-homescreen-content_
- _webchat-homescreen-header_
-! _webchat-homescreen-header-logo_
-! _webchat-homescreen-header-cognigy-logo_
- _webchat-homescreen-close-button_
- _webchat-homescreen-title_
-! _webchat-homescreen-buttons_
- _webchat-homescreen-button-container_
- _webchat-homescreen-button_
- _webchat-homescreen-actions_
- _webchat-homescreen-send-button_
- _webchat-homescreen-previous-conversation-button_
- _webchat-prev-conversations-root_
- _webchat-prev-conversations-content_
- _webchat-prev-conversations-item_
- _webchat-prev-conversations-send-button_
-! _webchat-prev-conversations-actions_
- _webchat-chat-options-root_
- _webchat-chat-options-container_
- _webchat-chat-options-action-btns-root_
- _webchat-chat-options-action-btns-title_
-! _webchat-chat-options-action-btns-wrapper_
- _webchat-chat-options-action-button-container_
- _webchat-chat-options-action-button_
- _webchat-rating-widget-root_
- _webchat-rating-widget-title_
- _webchat-rating-widget-content-container_
- _webchat-rating-widget-thumbs-up-button_
- _webchat-rating-widget-thumbs-down-button_
- _webchat-rating-widget-comment-input-field-container_
- _webchat-rating-widget-comment-input-field-label_
- _webchat-rating-widget-comment-input-field_
- _webchat-rating-widget-send-button_
-! _webchat-tts-option-root_
-! _webchat-chat-options-tts-option-label_
-! _webchat-chat-options-tts-option-toggle_
-! _webchat-chat-options-footer_
- _webchat-chat-options-footer-link_
- _webchat-chat-options-footer-link-text_
-! _webchat-chip-conversation-ended_
- _webchat-modal-root_
- _webchat-modal-header_
- _webchat-modal-title_
- _webchat-modal-close-button_
- _webchat-modal-close-icon_
- _webchat-modal-divider-wrapper_
- _webchat-modal-divider_
- _webchat-modal-body_
- _webchat-modal-footer_
- _webchat-delete-conversation-container_
- _webchat-delete-conversation-title_
- _webchat-delete-conversation-button_
- _webchat-delete-confirmation-cancel-button_
- _webchat-delete-confirmation-confirm-button_
- _webchat-delete-conversation-text_
- _webchat-delete-all-conversation-text_
-! _webchat-queue-updates_
-! _webchat-information-message-root_
-! _webchat-information-message-content_
-! _webchat-toggle-button-root_
- _webchat-message-row_
- _regular-message_
- _webchat-avatar_
- _webchat-message-row + bot_
- _regular-message + bot_
- _webchat-avatar + bot_
- _webchat-message-row + user_
- _regular-message + user_
- _webchat-avatar + user_
- _webchat-chat-typing-indicator_

If you want to be sure that the custom CSS that you apply will be shown, you will have to add some other selectors to those classes, for the Webchat we will use the attribute selectors:

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat] [data-cognigy-webchat-toggle]
```

This way we asure specificity of the classes in our script.

An example where we change the color of the Webchat header:

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-bar {

    background: rgb(15, 15, 194);
}
```

## Here are the used classes with an example on how to apply them.

The following code snippets are just suggestions so it shows the syntax required to acces all classes, the examples shown here are simple design changes so you get the idea how it works. You can change all this properties in any way you want, keep in mind that some components are nested in others and that some properties won't have an effect due to the nature of the Webchat widget

### Webchat Container

- _webchat-root_  
  This is the root <div> containingthe webchat, not much to customize here.

```CSS
[data-cognigy-webchat-root].webchat-root {

}
```

- _webchat_  
  This class is the main Webchat component that can be customized, you can add size like height or width in it.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat {
    width: 500px;
    height:500px;
}
```

### Webchat Toggle

- _webchat-toggle-button_  
  This is the button to open the Webchat. If you want to modify its background color you have to set the "background-image" to none.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat-toggle].webchat-toggle-button {
    background-image: none;
    background-color: rgb(5, 5, 131);
}
```

- _webchat-toggle-button-disabled_  
  This is the disabled state of the button that opens the Webchat. If you want to modify its background color you have to set the "background-image" to none.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat-toggle].webchat-toggle-button-disabled {
    background-image: none;
    background-color: rgba(170, 170, 170, 1);
}
```

### Webchat Unread and Teaser Message

- _webchat-unread-message-badge_  
  This is the unread message count which is diplayed next to the _webchat-toggle-button_, when the user retreived an unread message from Cognigy.

```CSS
[data-cognigy-webchat-root] .webchat-unread-message-badge {
    background-color: 'white';
}
```

- _webchat-unread-message-preview-text_  
  This is the text in the teaser message and unread message preview bubble. You can change the font, text color, or any other text properties.

```CSS
[data-cognigy-webchat-root] .webchat-unread-message-preview-text {
    color: white;
    font-size: 0.875rem;
}
```

- _webchat-teaser-message-root_  
  The root class for the teaser message, used for customizing the alingnment and position of the teaser message.

```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-root {
    padding: 10px;
    right: 10px;
    bottom: 75px;
}
```

- _webchat-teaser-message-root_  
  The class for the teaser message, used for customizing the look of the teaser message bubble.

```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-bubble {
    width: 400px;
    background-color: red;
}
```

- _webchat-teaser-message-header_  
  The header of the teaser message contining the logo, title and the close button.

```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-header {
    gap: 20px;
    margin: 10px;
}
```

- _webchat-teaser-message-header-title_  
  The title of the teaser message displayed at the top of the teaser message bubble.

```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-header-title {
    font-size: 1.125rem;
    font-weight: bold;
    color: rgb(5, 5, 131);
}
```

- _webchat-teaser-message-header-logo_  
  The logo displayed in the header of the teaser message.

```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-header-logo {
    border: 2px solid rgb(5, 5, 131);
}
```

- _webchat-teaser-message-header-close-button_  
  The close button displayed in the header of the teaser message.

```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-header .webchat-teaser-message-header-close-button {
    border: 2px solid rgb(5, 5, 131);
}
```

- _webchat-teaser-message-action-buttons_  
  This class that is used to adjust the position and alignment of the postback buttons displayed in the teaser message. 

```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-action-buttons {
    border: 2px solid rgb(232 232 245);
    margin: auto;
    padding: 20px;
    border-radius: 15px;
}
```

- _webchat-teaser-message-button-container_  
  This container holds the button(s) displayed in the teaser message. You can adjust the layout and spacing.

```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-button-container {
    justify-content: space-between;
    padding-top: 10px;
}
```

- _webchat-teaser-message-button_  
  This is the button that is displayed below the teaser message bubble and inside _webchat-teaser-message-button-container_.

```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-button {
    background-color: rgb(5, 5, 131);
    color: white;
}
```

### Webchat Header Elements

- _webchat-header-bar_  
  The header bar of the Webchat, here you can change color, it also contains other components like the header logo and header title.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-bar {

    background: rgb(5, 5, 131);
}
```

- _webchat-header-logo-name-container_  
  The container for the header logo and title, you can modify the spacing and alignment between them.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-logo-name-container {
    gap: 25px;
}
```

- _webchat-header-logo_  
  The custom logo shown in the webchat header of chat log screen. You can customize, for example, its size and border properties.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-logo-name-container .webchat-header-logo {
    width: 32px;
    height: 32px;
    border: 2px solid red;
}
```

- _webchat-header-cognigy-logo_  
  The default Cognigy logo shown in the webchat header of chat log screen, when no custom logo URL is provided. You can customize, for example, its size and border properties.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-logo-name-container .webchat-header-cognigy-logo {
    width: 32px;
    height: 32px;
    border: 2px solid red;
}
```

  The default Cognigy logo shown in the conversation list items of previous conversation screen, when no custom logo URL is provided. You can customize, for example, its size and border properties.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-prev-conversations-item .webchat-header-cognigy-logo{
    width: 32px;
    height: 32px;
    margin-left: 12px;
    border: 2px solid red;
}
```

- _webchat-header-title_  
  The text that is in the header, you can modify the font as you wish.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-title {
    font-size: 1.25rem;
}
```

- _webchat-header-close-button_  
  The close button shown in the webchat header bar and in the connection lost overlay dialog. You can customize its appearance, size, and hover effects, etc.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-close-button {
    background-color: red;
    padding: 8px;
    border-radius: 4px;
}

[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-close-button svg {
    width: 20px;
    height: 20px;
}

[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-close-button svg path {
    fill: black
}
```

- _webchat-header-back-button_  
  The back button shown in the webchat header. You can customize its appearance, size, and icon color, etc.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-back-button {
    background-color: red;
    border-radius: 4px;
}

[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-back-button svg path {
    width: 20px;
    height: 20px;
}

[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-back-button svg path {
    fill: black;
}
```

- _webchat-header-minimize-button_  
  The minimize button shown in the webchat header. You can customize its appearance, size, and icon color.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-minimize-button {
    background-color: red;
    border-radius: 4px;
}

[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-minimize-button svg {
    width: 20px;
    height: 20px;
}

[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-minimize-button svg path {
    fill: black;
}
```

- _webchat-header-delete-all-conversations-button_  
  The icon button to delete all conversations in the previous conversations header.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-delete-all-conversations-button {
    background-color: red;
    border: 2px solid #666;
}

[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-delete-all-conversations-button svg path{
    fill: black;
}
```

### Chat Log

- _webchat-chat-history_  
  This is the element where all the messages of the chat are are shown, you could change its color for example.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-chat-history {

    background-color: rgb(48, 48, 48);
}
```

- _webchat-scroll-to-bottom-button_  
  The button that appears when scrolled up in chat history to scroll to bottom. You can customize its appearance, position, and hover effects.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-scroll-to-bottom-button {
    background-color: red;
    color: white;
    width: 40px;
    height: 40px;
    font-size: 1.3rem;
}
```

### Webchat Input Fields

- _webchat-input_  
  The input at the footer of the Webchat, it contains some other components like the text input, menu and buttons.
  Careful to modify the height here since it will influence the input menu

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input {
   background: rgb(5, 5, 131);
}
```

- _webchat-input-message-container_  
  The container for the message input and its label.

```CSS
[data-cognigy-webchat-root] .webchat-input-message-container {
    background: #f8f8f8;
    padding: 8px 0;
    border-radius: 8px;
}
```

- _webchat-input-message-label_  
  The floating label for the message input.

```CSS
[data-cognigy-webchat-root] .webchat-input-message-label {
    color:rgb(209, 22, 22);
    font-style: italic;
    font-size: 14px;
}
```

- _webchat-input-menu-form_  
  The form that will take care of submit the message, you can modify the borders for example.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-menu-form {

    border-bottom-color: rgb(5, 5, 131);
}
```

- _webchat-input-message-input_  
  The text input where you can write your messages, you can change how the font looks like.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-message-input {

   color: white;
}
```

- _webchat-input-button-add-attachments_  
  The button to open the file attachment section, you can not change the icon but you can customize the position, size and background.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-button-add-attachments {

    border-radius: 20px;
    background-color: white;
}
```

- _webchat-input-drag-and-drop-file-text_  
  The text for drag and drop file upload, you can modify the font.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-drag-and-drop-file-text {
    color: white;
}
```

- _webchat-input-button-send_  
  The button to send the message, you can not change the icon but you can customize the position, size and background.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-button-send {

    border-radius: 20px;
    background-color: white;

}
```

- _webchat-input-get-started-button_  
  The button to initiate the first interaction in the Webchat. You can customize its appearance, size, and background.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-get-started-button {

    border-radius: 10px;
    background-color: rgb(0, 123, 255);
}
```

### Persistent Menu

- _webchat-input-persistent-menu-button_  
  This class is used to style the persistent menu icon. You can customize the size, color, and background.

```CSS
[data-cognigy-webchat-root] .webchat-input-persistent-menu-button {
    background-color: #ffffff;
    color: #000000;
    font-size: 16px;
}
```

- _webchat-input-persistent-menu_  
  This class is used to style the persistent menu container, which includes the title and menu items. You can adjust the layout, background color, and padding.

```CSS
[data-cognigy-webchat-root] .webchat-input-persistent-menu {
    background-color: #f9f9f9;
    padding: 15px;
    border-radius: 5px;
}
```

- _webchat-input-persistent-menu-item_  
  This class is used to style individual items in the persistent menu. You can customize the background color, font, and padding.

```CSS
[data-cognigy-webchat-root] .webchat-input-persistent-menu-item {
    background-color: #f0f0f0;
    padding: 10px;
    font-family: Arial, Helvetica, sans-serif;
}
```

- _webchat-input-persistent-menu-item-container_  
  This class is used to style the container that holds the persistent menu items. You can adjust the layout, spacing, and border.

```CSS
[data-cognigy-webchat-root] .webchat-input-persistent-menu-item-container {
    display: flex;
    flex-direction: column;
    border: 1px solid #ccc;
    margin: 5px;
}
```

### Privacy Notice

- _webchat-privacy-notice-root_  
  The root container for the privacy screen of the webchat.

```CSS
[data-cognigy-webchat-root] .webchat-privacy-notice-root {
    border-radius: 20px;
    border: 2px solid rgb(5, 5, 131);
    padding: 20px;
}
```

- _webchat-privacy-notice-message_  
  The root container for the privacy text content.

```CSS
[data-cognigy-webchat-root] .webchat-privacy-notice-message {
    background-color: rgb(227, 227, 251);
}
```

- _webchat-privacy-notice-markdown-container_  
  The markdown container of the privacy text content.

```CSS
[data-cognigy-webchat-root] .webchat-privacy-notice-markdown-container > p {
    color: rgb(227, 227, 251);
}
```

To change the font-family of the privacy notice text, you need to target the _p_ tag inside _webchat-privacy-notice-message_ like the following

```CSS
[data-cognigy-webchat-root] .webchat-privacy-notice-message p {
  font-family: Arial, Helvetica, sans-serif;
}
```

- _webchat-privacy-notice-actions_  
  The container for the action items of the privacy screen.

```CSS
[data-cognigy-webchat-root] .webchat-privacy-notice-actions {
    background-color: rgb(227, 227, 251);
    padding: 20px;
}
```

- _webchat-privacy-notice-accept-button_  
  The privacy submit button in the privacy screen.

```CSS
[data-cognigy-webchat-root] .webchat-privacy-notice-accept-button {
    background-color: rgb(5, 5, 131);
}
```

- _webchat-privacy-policy-link_
  The privacy policy link in the privacy screen.

```CSS
[data-cognigy-webchat-root] .webchat-privacy-policy-link {
   color: rgb(227, 227, 251);
}
```

To change the font-family of the privacy policy link text, you need to target the _p_ tag inside _webchat-privacy-policy-link_ like the following

```CSS
[data-cognigy-webchat-root] .webchat-privacy-policy-link p {
  font-family: Arial, Helvetica, sans-serif;
}
```

### Home Screen

- _webchat-homescreen-root_  
  The root container for the homescreen of the webchat.

```CSS
[data-cognigy-webchat-root] .webchat-homescreen-root {
    border-radius: 20px;
    border: 2px solid rgb(5, 5, 131);
    padding: 20px;
}
```

- _webchat-homescreen-content_  
  This is the main content area of the homescreen.

```CSS
[data-cognigy-webchat-root] .webchat-homescreen-content {
    background-color: black;
}
```

- _webchat-homescreen-header_  
  The header section of the homescreen, containing the logo and close button.

```CSS
[data-cognigy-webchat-root] .webchat-homescreen-header {
    margin: 10px;
}
```

- _webchat-homescreen-close-button_  
  The close button in the homescreen header.

```CSS
[data-cognigy-webchat-root] .webchat-homescreen-close-button {
    border: 2px solid white !important;
    padding: 10px !important;
}
```

- _webchat-homescreen-title_  
  The title displayed on the homescreen.

```CSS
[data-cognigy-webchat-root] .webchat-homescreen-title {
    font-size: 24px;
    color: red !important;
}
```

- _webchat-homescreen-button-container_  
  The container for the conversation starter buttons on the homescreen.

```CSS
[data-cognigy-webchat-root] .webchat-homescreen-button-container {
    padding: 10px;
}
```

- _webchat-homescreen-button_  
  Individual buttons on the homescreen (like for starting a new conversation).

```CSS
[data-cognigy-webchat-root] .webchat-homescreen-button {
    background-color: rgb(5, 5, 131) !important;
    color: black;
    border-radius: 5px;
}
```

To change the font-family of the homescreen starter button labels, you need to target the _span_ tag inside _webchat-homescreen-button_ like the following

```CSS
[data-cognigy-webchat-root] .webchat-homescreen-button span {
  font-family: Arial, Helvetica, sans-serif;
}
```

- _webchat-homescreen-actions_  
  The container for any actions on the homescreen.

```CSS
[data-cognigy-webchat-root] .webchat-homescreen-actions {
    margin-top: 15px;
}
```

- _webchat-homescreen-send-button_  
  The button to send a new message from the homescreen.

```CSS
[data-cognigy-webchat-root] .webchat-homescreen-send-button {
    background-color: rgb(5, 5, 131) !important;
    color: white;
}
```

- _webchat-homescreen-previous-conversation-button_  
  The button to view previous conversations from the homescreen.

```CSS
[data-cognigy-webchat-root] .webchat-homescreen-previous-conversation-button {
    background-color: rgb(5, 5, 131) !important;
}
```

### Previous Conversation Screen

- _webchat-prev-conversations-root_  
  The root container for the previous conversations screen.

```CSS
[data-cognigy-webchat-root] .webchat-prev-conversations-root {
    padding: 20px;
}
```

- _webchat-prev-conversations-content_  
  The container for the list of previous conversations.

```CSS
[data-cognigy-webchat-root] .webchat-prev-conversations-content {
    padding: 0px;
}
```

- _webchat-prev-conversations-item_  
  An individual item in the previous conversations list.

```CSS
[data-cognigy-webchat-root] .webchat-prev-conversations-item {
    background-color: rgb(5, 5, 131);
}
```

- _webchat-prev-conversations-send-button_  
  The button to start a new conversation from the Previous conversations screen.

```CSS
[data-cognigy-webchat-root] .webchat-prev-conversations-send-button {
    background-color: rgb(5, 5, 131) !important;
}
```

### Chat Options Screen

- _webchat-chat-options-root_  
  The root container for the chat options.

```CSS
[data-cognigy-webchat-root] .webchat-chat-options-root {
    padding: 20px;
}
```

- _webchat-chat-options-container_  
  The container that holds all chat options.

```CSS
[data-cognigy-webchat-root] .webchat-chat-options-container {
    border: 2px solid rgb(5, 5, 131);
}
```

- _webchat-chat-options-action-btns-root_  
  The container for quick reply buttons and its title inside the chat options screen.

```CSS
[data-cognigy-webchat-root] .webchat-chat-options-action-btns-root {
    justify-content: space-between;
    padding: 10px;
}
```

- _webchat-chat-options-action-button-container_  
  The container for the set of quick reply buttons in the chat options screen

```CSS
[data-cognigy-webchat-root] .webchat-chat-options-action-button-container {
    justify-content: space-around;
    padding: 10px;
}
```

- _webchat-chat-options-action-btns-title_  
  The title for the quick reply buttons in the chat options screen

```CSS
[data-cognigy-webchat-root] .webchat-chat-options-action-btns-title {
    font-size: 1.125rem;
    font-family: Arial, Helvetica, sans-serif;
    color: rgb(5, 5, 131);
}
```

- _webchat-chat-options-action-button_  
  An individual quick reply button in the chat options screen.

```CSS
[data-cognigy-webchat-root] .webchat-chat-options-action-button {
    background-color: rgb(5, 5, 131) !important;
    color: white;
}
```

#### Rating Widget

- _webchat-rating-widget-root_  
  The root container for the rating widget that includes the rating title, thumbs up/down button, text area and submit button.

```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-root {
    padding: 20px;
}
```

- _webchat-rating-widget-title_  
  The title of the rating widget.

```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-title {
    font-size: 1.25rem;
    color: rgb(5, 5, 131);
}
```

- _webchat-rating-widget-content-container_  
  The container for the rating widget's thumbs up/down buttons.

```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-content-container {
    justify-content: space-between;
    padding: 10px;
}
```

- _webchat-rating-widget-thumbs-up-button_  
  The thumbs-up button for the rating widget.

```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-thumbs-up-button {
    background-color: #00cc66 !important;
}
```

- _webchat-rating-widget-thumbs-down-button_  
  The thumbs-down button for the rating widget.

```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-thumbs-down-button {
    background-color: #cc0000 !important;
}
```

- _webchat-rating-widget-comment-input-field-container_  
  The container for comments input field with label in the rating widget.

```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-comment-input-field-container {
  background: #cc0000;
}
```

- _webchat-rating-widget-comment-input-field-label_  
  The label for comments input field in the rating widget.

```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-comment-input-field-label {
    font-size: 1.25rem;
}
```

- _webchat-rating-widget-comment-input-field_  
  The input field for comments in the rating widget.

```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-comment-input-field {
    font-family: Arial, Helvetica, sans-serif !important;
}
```

- _webchat-rating-widget-send-button_  
  The button to send the rating/comment.

```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-send-button {
    background-color: rgb(5, 5, 131) !important;
}
```

#### Chat Options Footer

- _webchat-chat-options-footer-link_  
  The link displayed at the footer of the chat options screen.

```CSS
[data-cognigy-webchat-root] .webchat-chat-options-footer-link {
    text-decoration: underline !important;
    padding: 10px;
}
```

- _webchat-chat-options-footer-link-text_  
  The text for the footer link in chat options screen.

```CSS
[data-cognigy-webchat-root] .webchat-chat-options-footer-link-text {
    font-size: 0.875rem;
    font-family: Arial, Helvetica, sans-serif !important;
}
```

### Generic Modal

- _webchat-modal-root_  
  The root container for modals. You can customize the overall appearance of modal windows.

```CSS
[data-cognigy-webchat-root] .webchat-modal-root {
    background-color: rgba(0, 0, 0, 0.5);
    padding: 20px;
    border-radius: 8px;
}
```

- _webchat-modal-header_  
  The header section of modal windows.

```CSS
[data-cognigy-webchat-root] .webchat-modal-header {
    background-color: #f5f5f5;
    padding: 10px;
    border-bottom: 1px solid #ddd;
}
```

- _webchat-modal-title_  
  The title text in modal headers.

```CSS
[data-cognigy-webchat-root] .webchat-modal-title {
    font-size: 1.125rem;
    color: #333;
    font-weight: bold;
}
```

- _webchat-modal-close-button_  
  The close button in modal headers.

```CSS
[data-cognigy-webchat-root] .webchat-modal-close-button {
    background-color: transparent;
    border: none;
    color: #666;
}
```

- _webchat-modal-close-icon_  
  The icon within the modal close button.

```CSS
[data-cognigy-webchat-root] .webchat-modal-close-icon {
    font-size: 20px;
    color: #666;
}
```

- _webchat-modal-divider-wrapper_  
  The wrapper for modal dividers.

```CSS
[data-cognigy-webchat-root] .webchat-modal-divider-wrapper {
    padding: 10px 0;
}
```

- _webchat-modal-divider_  
  The divider line in modals.

```CSS
[data-cognigy-webchat-root] .webchat-modal-divider {
    border-top: 1px solid #ddd;
}
```

- _webchat-modal-body_  
  The main content area of modals.

```CSS
[data-cognigy-webchat-root] .webchat-modal-body {
    padding: 15px;
    background-color: white;
}
```

- _webchat-modal-footer_  
  The footer section of modals.

```CSS
[data-cognigy-webchat-root] .webchat-modal-footer {
    padding: 10px;
    background-color: #f5f5f5;
    border-top: 1px solid #ddd;
}
```

### Delete Conversations Modal

- _webchat-delete-conversation-container_  
  The container for delete conversation in chat options screen.

```CSS
[data-cognigy-webchat-root] .webchat-delete-conversation-container {
    padding: 20px;
    text-align: center;
}
```

- _webchat-delete-conversation-title_  
  The title of delete conversation setting in chat options screen.

```CSS
[data-cognigy-webchat-root] .webchat-delete-conversation-title {
    font-size: 1rem;
    font-weight: bold;
    color: #333;
}
```

- _webchat-delete-conversation-button_  
  The delete button style inside the chat options screen.

```CSS
[data-cognigy-webchat-root] .webchat-delete-conversation-button {
    padding: 8px 16px;
    margin: 5px;
    border-radius: 4px;
}
```

- _webchat-delete-confirmation-cancel-button_  
  The cancel button in delete confirmation dialog.

```CSS
[data-cognigy-webchat-root] .webchat-delete-confirmation-cancel-button {
    background-color: #f5f5f5;
    color: #333;
}
```

- _webchat-delete-confirmation-confirm-button_  
  The confirm button in delete confirmation dialog.

```CSS
[data-cognigy-webchat-root] .webchat-delete-confirmation-confirm-button {
    background-color: #dc3545;
    color: white;
}
```

- _webchat-delete-conversation-text_  
  The warning text in delete conversation dialog.

```CSS
[data-cognigy-webchat-root] .webchat-delete-conversation-text {
    color: #666;
    margin: 10px 0;
}
```

- _webchat-delete-all-conversation-text_  
  The warning text for deleting all conversations in delete dialog.

```CSS
[data-cognigy-webchat-root] .webchat-delete-all-conversation-text {
    color: #dc3545;
    font-weight: bold;
}
```

### Webchat Message Types

Our Webchat ships with message templates out of the box (Quick replies, Galleries, Media, Lists, etc.) these elements can be also customized to meet design guidelines even more!

<!-- TODO: Add Working CodeSandbox link here -->

Here are the classes that you can use to modify it:

### Quick Replies

- _webchat-quick-reply-template-root_  
  This class contains the whole Quick Reply element, you can modify its size for example.

```CSS
[data-cognigy-webchat-root] .webchat-quick-reply-template-root {
width: 500px;
height: 500px;
}

```

- _webchat-quick-reply-template-header-message_  
  This is the header message of the Quick Reply.

```CSS
[data-cognigy-webchat-root] .webchat-quick-reply-template-header-message {
  border:2px solid  #fffffe;
  border-radius: 0;
  text-align: center;
  background: #e3f6f5;
  color: #272343;
  animation: "Some animation" ;
}

```

- _webchat-quick-reply-template-replies-container_  
  This is the element holding all Quick Replies, you can change the way they are shown, e.g. as a column.

```CSS
[data-cognigy-webchat-root] .webchat-quick-reply-template-replies-container {
  display: flex;
  flex-direction: column;
}

```

- _webchat-quick-reply-template-reply_  
  This is the style of the single Quick Reply element, all of them will be modified.

```CSS
[data-cognigy-webchat-root] .webchat-quick-reply-template-replies-container .webchat-quick-reply-template-reply {
    animation: "Some animation" ;
    border-color:#272343;
    color: #2d334a;
}

```

- _webchat-template-button-image_  
  This class modifies the style of the images inside the quick reply buttons. The default border-top-left-radius and border-bottom-left-radius of the images inside the button is 19px. You can override that with the help of this class.

```CSS
[data-cognigy-webchat-root] .webchat-quick-reply-template-replies-container .webchat-template-button-image {
    background-color: black;
    border-radius: 10px;
}
```

### Buttons

- _webchat-buttons-template-root_  
  This class contains the Buttons element.

```CSS
[data-cognigy-webchat-root] .webchat-buttons-template-root {
  border-radius: 0;
  animation: "Some animation" ;
}

```

- _webchat-buttons-template-header_  
  The container and header of the buttons, you can modify the text position and style.

```CSS
[data-cognigy-webchat-root] .webchat-buttons-template-header {
  text-align: center;
  font-weight: bold;
  background: #e3f6f5;
}

```

- _webchat-buttons-template-button_  
  The class of a single button, you can add cool animations when hovering and styling, this will take effect for all buttons in the list.

```CSS
[data-cognigy-webchat-root] .webchat-buttons-template .webchat-buttons-template-button {
    background-color: #fffffe;
    color: #2d334a;
}

[data-cognigy-webchat-root] .webchat-buttons-template .webchat-buttons-template-button:hover {
  animation: "Some animation" 1s ease;
  animation-iteration-count: 1;
  font-weight: bold;
}

```

### Image Gallery

- _webchat-carousel-template-root_  
  The card element from a Gallery, here you can increase its size for example.

````CSS
[data-cognigy-webchat-root] .webchat-carousel-template-root {
  width: 200px;
}

* *webchat-carousel-template-frame*
The frame that adds the "card styles" such as background-color or box-shadow.
```CSS
[data-cognigy-webchat-root] .webchat-carousel-template-frame {
  box-shadow: none;
}

````

- _webchat-carousel-template-content_  
  The content of the card, you can modify it's height and make it look smaller so you could show more content.

```CSS
[data-cognigy-webchat-root] .webchat-carousel-template-content {
  background: #e3f6f5;
  height: 200px;
}

```

- _webchat-carousel-template-title_  
  The title of the card.

```CSS
[data-cognigy-webchat-root] .webchat-carousel-template-title {
    color:blue;
}

```

- _webchat-carousel-template-subtitle_  
  The subtitle of the card.

```CSS
[data-cognigy-webchat-root] .webchat-carousel-template-subtitle {
  color:white;
}
```

- _webchat-carousel-template-button_  
  The Button at the bottom of the card, containing a URL.

```CSS
[data-cognigy-webchat-root] .webchat-carousel-template-button {
  color: #272343;
  background: #ffd803;
}

[data-cognigy-webchat-root] .webchat-carousel-template-button:hover {
  background: #cfb000;
}
```

### Media

- _webchat-media-template_  
  The media element can be of three forms: Image, Video or Audio. You can modify its container or put some animations on it

```CSS
[data-cognigy-webchat-root] .webchat-media-template-image {
  animation: "Some animation" 1s;
}

[data-cognigy-webchat-root] .webchat-media-template-video {
}

[data-cognigy-webchat-root] .webchat-media-template-audio {
}

[data-cognigy-webchat-root] .webchat-media-template-file {
}

/* Add styles for the container containing group of file attachments */
[data-cognigy-webchat-root] .webchat-media-template-files-container {
}

/* Add styles for the container containing group of image attachments */
[data-cognigy-webchat-root] .webchat-media-template-image-container {
}

```

### List

- _webchat-list-template-root_  
  The container element of the List, you can remove the border-radius that comes with it.

```CSS
[data-cognigy-webchat-root] .webchat-list-template-root {
  border-radius: 0;
}
```

- _webchat-list-template-header_  
  This is the header element, which is above all other componets of the list.

```CSS
[data-cognigy-webchat-root] .webchat-list-template-header {
  heigth: 200px;
}
```

- _webchat-list-template-header-content_  
  The content of the header, here you can center all elements for example.

```CSS
[data-cognigy-webchat-root] .webchat-list-template-header-content {
  text-align: center;
}
```

- _webchat-list-template-header-title_  
  The title of the header element.

```CSS
[data-cognigy-webchat-root] .webchat-list-template-header-title {
  color: green;
}
```

- _webchat-list-template-header-subtitle_  
  The subtitle of the header element.

```CSS
[data-cognigy-webchat-root] .webchat-list-template-header-subtitle {
  color: green;
}
```

- _webchat-list-template-header-button_  
  This is the button inside the header, it can look better if you add some hovering effects.

```CSS
[data-cognigy-webchat-root] .webchat-list-template-header-button {
  background: #ffd803;
  color: #272343;
}

[data-cognigy-webchat-root] .webchat-list-template-header-button:hover {
  background: #cfb000;
}
```

- _webchat-list-template-element_  
  The element that contains a single list element

```CSS
[data-cognigy-webchat-root] .webchat-list-template-element {
  background: #e3f6f5;
}
```

- _webchat-list-template-element-title_  
  The title of every list element.

```CSS
[data-cognigy-webchat-root] .webchat-list-template-element-title {
  color: yellow;
}
```

- _webchat-list-template-element-subtitle_  
  The subtitle of every list element.

```CSS
[data-cognigy-webchat-root] .webchat-list-template-element-subtitle {
  color: yellow;
}
```

- _webchat-list-template-element-button_  
  This is the button inside every list element, adding some hovering effects or animation can make it look better.

```CSS
[data-cognigy-webchat-root] .webchat-list-template-element-button {
  border-color: #ffd803;
  background-color: #fffffe;
  color: #272343;
}

[data-cognigy-webchat-root] .webchat-list-template-element-button:hover {
  background-color: #cfb00071;
}
```

- _webchat-list-template-global-button_  
  This is the global button of the list template,you could change, for example, its background color and also add custom hover effects.

```CSS
[data-cognigy-webchat-root] .webchat-list-template-global-button {
    background-color: #cfb00071;
}

[data-cognigy-webchat-root] .webchat-list-template-global-button:hover {
    background-color: #39801071;
}
```

### Date Picker

- _webchat-plugin-date-picker_  
  The container element of the Date picker plugin, you can make it's font appear bigger.

```CSS
[data-cognigy-webchat-root] .webchat-plugin-date-picker {
  font-size: 125%;
}
```

- _webchat-plugin-date-picker-header_  
  The header of the Date picker plugin, it it possible to change e.g. it's background color.

```CSS
[data-cognigy-webchat-root] .webchat-plugin-date-picker-header {
  background-color: linear-gradient(185deg,#36b96e,#2c6caf);
}
```

- _webchat-plugin-date-picker-content_  
  The content container element of the Date picker plugin, let it glow with an inset shadow.

```CSS
[data-cognigy-webchat-root] .webchat-plugin-date-picker-content {
  box-shadow: 0 0 70px #ff99d7 inset;
}
```

- _webchat-plugin-date-picker-footer_  
  The footer element of the Date picker plugin, give it a custom look with padding.

```CSS
[data-cognigy-webchat-root] .webchat-plugin-date-picker-footer {
  padding: 1em 3em;
}
```

- _webchat-plugin-date-picker-weekdays_  
  The Weekdays of the calendar can be customized with e.g. uppercase labels.

```CSS
[data-cognigy-webchat-root] .flatpickr-weekday {
  text-transform: uppercase;
}
```

- _webchat-plugin-date-picker-footer_  
  The look and feel of the selected date can be changed.

```CSS
[data-cognigy-webchat-root] .flatpickr-day.selected {
  background: #28c8ef;
  color: hsla(0, 0%, 100%, 0.95);
  font-weight: bold;
  font-size: 1.375rem;
}
```



- _webchat-message-row_  
  The general class for any message in the chat, containing the message and the avatar logo.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-message-row {

    padding-right: 10px;

}
```

- _regular-message_  
  The text of the message, you can change the font and style the dialog bubble, this one comes from the regular message plugin that comes shipped with the Webchat!

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .regular-message {

    border:2px solid  white;
    background: black;
    color:white;
    box-shadow: none;

}
```

- _webchat-avatar_  
  The icon from the avatar that will be show when a message is written or received. You can put the avatar you like by adding a URL to it.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-avatar {

    background-image: url(https://***.png);
    // use flex-basis instead of "width" here!
    flex-basis: 30px;
    height: 28px;
}
```

The avatars can be repositioned to appear at the top edge of a message rather than the bottom edge.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-avatar {
  align-self: flex-start !important;
}
```

- _webchat-message-row + bot_  
  The classes for the bot message in the chat, containing the message and the avatar logo.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-message-row.bot {

    padding-right: 10px;

}
```

- _regular-message + bot_  
  The text of the message from the bot, you can change the font and style the dialog bubble.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .regular-message.bot {

    background: rgb(5, 5, 131);
    box-shadow: none;
}
```

- _webchat-avatar + bot_  
  The icon from the bot that will be show when a message is received. You can put the avatar you like by adding a URL to it.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-avatar.bot {

    background-image: url(https://***.png);
    width: 30px;
    height: 28px;

}
```

- _webchat-message-row + user_  
  The class for the user message in the chat, containing the message and the avatar logo.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-message-row.user {

    padding-right: 10px;

}
```

- _regular-message + user_  
  The text of the message from the user, you can change the font and style the dialog bubble.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .regular-message.user {

    background: rgb(5, 5, 131);
    box-shadow: none;
}
```

- _webchat-avatar + user_  
  The icon from the user that will be show when a message is received. You can put the avatar you like by adding a URL to it.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-avatar.user {

    background-image: url(https://***.png);
    // use flex-basis instead of "width" here!
    flex-basis: 30px;
    height: 28px;

}
```

- _webchat-message-row + agent_  
  The class for the agent message when using handover in the chat, containing the message and the avatar logo.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-message-row.agent {

    padding-right: 10px;

}
```

- _regular-message + agent_  
  The text of the message from the agent when using handover, you can change the font and style the dialog bubble.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .regular-message.agent {

    background: rgb(5, 5, 131);
    box-shadow: none;
}
```

- _webchat-avatar + agent_  
  The icon from the agent when using handover that will be show when a message is received. You can put the avatar you like by adding a URL to it.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-avatar.agent {

    background-image: url(https://***.png);
    // use flex-basis instead of "width" here!
    flex-basis: 30px;
    height: 28px;

}
```

- _webchat-chat-typing-indicator_  
  The typing indicator bubble of the message from the bot, you can change the background color.

```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-typing-indicator {

    background: rgb(5, 5, 131);
}
```
