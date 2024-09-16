# CSS Customization

In order to enhance the visual design of the Webchat, there is the possibility to apply custom CSS.
You will have to add the style to your embeded Webchat or just link a CSS file to it.

See it in action:  
[![Edit CSS Customization](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/css-customization-gv35e?fontsize=14&hidenavigation=1&theme=dark)

There are several classes that you need to take in consideration if you want to make some changes to the Webchat, the classes '*bot*' and '*user*' are used as helper classes that give us the possibility to customize the messages from the user and the bot separatly. The classes are the following:

* *webchat-root*
* *webchat*
* *webchat-header-bar*
* *webchat-header-logo*
* *webchat-header-title*
* *webchat-header-close-button*
* *webchat-header-rating-button*
* *webchat-chat-history*
* *webchat-message-row*
* *regular-message*
* *webchat-avatar*
* *webchat-message-row + bot*
* *regular-message + bot*
* *webchat-avatar + bot*
* *webchat-message-row + user*
* *regular-message + user*
* *webchat-avatar + user*
* *webchat-chat-typing-indicator*
* *webchat-input*
* *webchat-input-menu-form*
* *webchat-input-button-menu*
* *webchat-input-message-input*
* *webchat-input-button-send*
* *webchat-input-persistent-menu*
* *webchat-input-persistent-menu-title*
* *webchat-input-persistent-menu-item*
* *webchat-toggle-button*
* *webchat-unread-message-preview*
* *webchat-unread-message-badge*
* *webchat-unread-message-preview-text*
* *webchat-teaser-message-root*
* *webchat-teaser-message-header-title*
* *webchat-teaser-message-header-logo*
* *webchat-teaser-message-button-container*
* *webchat-teaser-message-button*
* *webchat-homescreen-root*
* *webchat-homescreen-content*
* *webchat-homescreen-header*
* *webchat-homescreen-close-button*
* *webchat-homescreen-title*
* *webchat-homescreen-button-container*
* *webchat-homescreen-button*
* *webchat-homescreen-actions*
* *webchat-homescreen-send-button*
* *webchat-homescreen-previous-conversation-button*
* *webchat-prev-conversations-root*
* *webchat-prev-conversations-content*
* *webchat-prev-conversations-item*
* *webchat-prev-conversations-send-button*
* *webchat-chat-options-root*
* *webchat-chat-options-container*
* *webchat-chat-options-action-btns-root*
* *webchat-chat-options-action-btns-title*
* *webchat-chat-options-action-button-container*
* *webchat-chat-options-action-button*
* *webchat-rating-widget-root*
* *webchat-rating-widget-title*
* *webchat-rating-widget-content-container*
* *webchat-rating-widget-thumbs-up-button*
* *webchat-rating-widget-thumbs-down-button*
* *webchat-rating-widget-comment-input-field*
* *webchat-rating-widget-send-button*
* *webchat-chat-options-footer-link*
* *webchat-chat-options-footer-link-text*

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
### Here are the used classes with an example on how to apply them.

The following code snippets are just suggestions so it shows the syntax required to acces all classes, the examples shown here are simple design changes so you get the idea how it works. You can change all this properties in any way you want, keep in mind that some components are nested in others and that some properties won't have an effect due to the nature of the Webchat widget

* *webchat-root*  
This is the root <div> containingthe webchat, not much to customize here.
```CSS
[data-cognigy-webchat-root].webchat-root {

}
```
* *webchat*  
This class is the main Webchat component that can be customized, you can add size like height or width in it.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat {
    width: 500px;
    height:500px;
}
```
* *webchat-header-bar*  
The header bar of the Webchat, here you can change color, it also contains other components like the header logo and header title.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-bar {

    background: rgb(5, 5, 131);
}
```
* *webchat-header-logo*  
The logo of the Webchat, it can be changed by editing the URL.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-logo {

    background-image: url(https://...);
    margin-left: 10px;
}
```
* *webchat-header-title*  
The text that is in the header, you can modify the font as you wish.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-header-title {

    font-size: 20px;
}
```
* *webchat-chat-history*  
This is the element where all the messages of the chat are are shown, you could change its color for example.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-chat-history {

    background-color: rgb(48, 48, 48);
}
```
* *webchat-message-row*  
The general class for any message in the chat, containing the message and the avatar logo.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-message-row {

    padding-right: 10px;

}
```
* *regular-message*  
The text of the message, you can change the font and style the dialog bubble,  this one comes from the regular message plugin that comes shipped with the Webchat!
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .regular-message {

    border:2px solid  white;
    background: black;
    color:white;
    box-shadow: none;

}
```
* *webchat-avatar*  
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

* *webchat-message-row + bot*  
The classes for the bot message in the chat, containing the message and the avatar logo.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-message-row.bot {

    padding-right: 10px;

}
```
* *regular-message + bot*  
The text of the message from the bot, you can change the font and style the dialog bubble.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .regular-message.bot {

    background: rgb(5, 5, 131);    
    box-shadow: none;
}
```
* *webchat-avatar + bot*  
The icon from the bot that will be show when a message is received. You can put the avatar you like by adding a URL to it.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-avatar.bot {

    background-image: url(https://***.png);
    width: 30px;
    height: 28px;
    
}
```
* *webchat-message-row + user*  
The class for the user message in the chat, containing the message and the avatar logo.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-message-row.user {

    padding-right: 10px;

}
```
* *regular-message + user*  
The text of the message from the user, you can change the font and style the dialog bubble.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .regular-message.user {

    background: rgb(5, 5, 131);    
    box-shadow: none;
}
```
* *webchat-avatar + user*  
The icon from the user that will be show when a message is received. You can put the avatar you like by adding a URL to it.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-avatar.user {

    background-image: url(https://***.png);
    // use flex-basis instead of "width" here!
    flex-basis: 30px;
    height: 28px;
    
}
```
* *webchat-message-row + agent*  
The class for the agent message when using handover in the chat, containing the message and the avatar logo.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-message-row.agent {

    padding-right: 10px;

}
```
* *regular-message + agent*  
The text of the message from the agent when using handover, you can change the font and style the dialog bubble.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .regular-message.agent {

    background: rgb(5, 5, 131);    
    box-shadow: none;
}
```
* *webchat-avatar + agent*  
The icon from the agent when using handover that will be show when a message is received. You can put the avatar you like by adding a URL to it.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-avatar.agent {

    background-image: url(https://***.png);
    // use flex-basis instead of "width" here!
    flex-basis: 30px;
    height: 28px;
    
}
```

* *webchat-chat-typing-indicator*  
The typing indicator bubble of the message from the bot, you can change the background color.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-typing-indicator {

    background: rgb(5, 5, 131);
}
```

* *webchat-input*  
The footer of the Webchat, it contains some other components like the text input, menu and buttons.
Careful to modify the height here since it will influence the input menu
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input {
   
   background: rgb(5, 5, 131);
}
```
* *webchat-input-menu-form*  
The form that will take care of submit the message, you can modify the borders for example.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-menu-form {

    border-bottom-color: rgb(5, 5, 131);
}
```
* *webchat-input-button-menu*  
The sandwich menu to open the input menu, you can not change the icon but you can customize the position, size and background.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-button-menu {

    border-radius: 5px;
    background-color: white;
}
```
* *webchat-input-message-input*  
The text input where you can write your messages, you can change how the font looks like.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-message-input {
   
   color: white;
}
```
* *webchat-input-button-send*  
The button to send the message, you can not change the icon but you can customize the position, size and background.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-button-send {

    border-radius: 20px;
    background-color: white;
    
}
```
* *webchat-input-button-add-attachments*  
The button to open the file attachment section, you can not change the icon but you can customize the position, size and background.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-button-add-attachments {
   
    border-radius: 20px;
    background-color: white;
}
```
* *webchat-input-button-browse-files*  
The button to select a file attacment.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-button-browse-files {
   
    border-radius: 20px;
    background-color: white;
}
```
* *webchat-input-drag-and-drop-file-text*  
The text for drag and drop file upload, you can modify the font.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-drag-and-drop-file-text {
 
     color: white;
     
}
```
* *webchat-input-persistent-menu*  
This is the persistent input menu, you can change its color. It also contains the menu title and menu items components.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-persistent-menu {

    background: white;

}
```
* *webchat-input-persistent-menu-title*  
The text title from the persistent input menu, you can modify the font.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-persistent-menu-title {
 
     color: white;
     
}
```
* *webchat-input-persistent-menu-item*  
The persistent input menu items, where you can modify it borders, and fonts for example.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat].webchat .webchat-input-persistent-menu-item {
   
   border-color: white;
   color:white;
   
}
```
* *webchat-toggle-button* 
This is the button to open the Webchat, if you want to modify its color you have to set the "background-image" to none.
```CSS
[data-cognigy-webchat-root] [data-cognigy-webchat-toggle].webchat-toggle-button {

    background-image: none;
    background-color: rgb(5, 5, 131);
}
```

* *webchat-unread-message-preview*
This is the message bubble which is diplayed next to the *webchat-toggle-button*, when the user retreived an unread message from Cognigy.
```CSS
.webchat-unread-message-preview {
    background-color: rgb(5, 5, 131);
}
```

* *webchat-unread-message-badge*
This is the unread message count which is diplayed next to the *webchat-toggle-button*, when the user retreived an unread message from Cognigy.
```CSS
[data-cognigy-webchat-root] .webchat-unread-message-badge {
    background-color: 'white';
}
```

* *webchat-unread-message-preview-text*
This is the text in the teaser message and unread message preview bubble. You can change the font, text color, or any other text properties.
```CSS
[data-cognigy-webchat-root] .webchat-unread-message-preview-text {
    color: white;
    font-size: 14px;
}
```

* *webchat-teaser-message-root*
The root class for the teaser message, used for customizing the overall look of the teaser message box.
```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-root {
    background-color: rgb(240, 240, 240);
    padding: 10px;
}
```

* *webchat-teaser-message-header-title*
The title of the teaser message displayed at the top of the teaser message bubble.
```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-header-title {
    font-size: 18px;
    font-weight: bold;
    color: rgb(5, 5, 131);
}
```

* *webchat-teaser-message-header-logo*
The logo displayed in the header of the teaser message. You can replace the logo image URL.
```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-header-logo {
    border: 2px solid rgb(5, 5, 131);
}
```

* *webchat-teaser-message-button-container*
This container holds the button(s) displayed in the teaser message. You can adjust the layout and spacing.
```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-button-container {
    justify-content: space-between;
    padding-top: 10px;
}
```

* *webchat-teaser-message-button* 
This is the button that is displayed below the teaser message bubble and inside *webchat-teaser-message-button-container*.
```CSS
[data-cognigy-webchat-root] .webchat-teaser-message-button {
    background-color: rgb(5, 5, 131);
    color: white;
}
```

* *webchat-homescreen-root*
The root container for the homescreen of the webchat. 
```CSS
[data-cognigy-webchat-root] .webchat-homescreen-root {
    border-radius: 20px;
    border: 2px solid rgb(5, 5, 131);
    padding: 20px;
}
```

* *webchat-homescreen-content*
This is the main content area of the homescreen.
```CSS
[data-cognigy-webchat-root] .webchat-homescreen-content {
    background-color: black;
}
```

* *webchat-homescreen-header*
The header section of the homescreen, containing the logo and close button.
```CSS
[data-cognigy-webchat-root] .webchat-homescreen-header {
    margin: 10px;
}
```

* *webchat-homescreen-close-button*
The close button in the homescreen header.
```CSS
[data-cognigy-webchat-root] .webchat-homescreen-close-button {
    border: 2px solid white !important;
    padding: 10px !important;
}
```

* *webchat-homescreen-title*
The title displayed on the homescreen.
```CSS
[data-cognigy-webchat-root] .webchat-homescreen-title {
    font-size: 24px;
    color: red !important;
}
```

* *webchat-homescreen-button-container*
The container for the conversation starter buttons on the homescreen.
```CSS
[data-cognigy-webchat-root] .webchat-homescreen-button-container {
    padding: 10px;
}
```

* *webchat-homescreen-button*
Individual buttons on the homescreen (like for starting a new conversation).
```CSS
[data-cognigy-webchat-root] .webchat-homescreen-button {
    background-color: rgb(5, 5, 131) !important;
    color: black;
    border-radius: 5px;
}
```

To change the font-family of the homescreen starter button labels, you need to target the *span* tag inside *webchat-homescreen-button* like the following
```CSS
[data-cognigy-webchat-root] .webchat-homescreen-button span {
  font-family: Arial, Helvetica, sans-serif;
}
```

* *webchat-homescreen-actions*
The container for any actions on the homescreen.
```CSS
[data-cognigy-webchat-root] .webchat-homescreen-actions {
    margin-top: 15px;
}
```

* *webchat-homescreen-send-button*
The button to send a new message from the homescreen.
```CSS
[data-cognigy-webchat-root] .webchat-homescreen-send-button {
    background-color: rgb(5, 5, 131) !important;
    color: white;
}
```

* *webchat-homescreen-previous-conversation-button*
The button to view previous conversations from the homescreen.
```CSS
[data-cognigy-webchat-root] .webchat-homescreen-previous-conversation-button {
    background-color: rgb(5, 5, 131) !important;
}
```

* *webchat-prev-conversations-root*
The root container for the previous conversations screen.
```CSS
[data-cognigy-webchat-root] .webchat-prev-conversations-root {
    padding: 20px;
}
```

* *webchat-prev-conversations-content*
The container for the list of previous conversations.
```CSS
[data-cognigy-webchat-root] .webchat-prev-conversations-content {
    padding: 0px;
}
```

* *webchat-prev-conversations-item*
An individual item in the previous conversations list.
```CSS
[data-cognigy-webchat-root] .webchat-prev-conversations-item {
    background-color: rgb(5, 5, 131);
}
```

* *webchat-prev-conversations-send-button*
The button to start a new conversation from the Previous conversations screen.
```CSS
[data-cognigy-webchat-root] .webchat-prev-conversations-send-button {
    background-color: rgb(5, 5, 131) !important;
}
```

* *webchat-chat-options-root*
The root container for the chat options.
```CSS
[data-cognigy-webchat-root] .webchat-chat-options-root {
    padding: 20px;
}
```

* *webchat-chat-options-container*
The container that holds all chat options.
```CSS
[data-cognigy-webchat-root] .webchat-chat-options-container {
    border: 2px solid rgb(5, 5, 131);
}
```

* *webchat-chat-options-action-btns-root*
The container for quick reply buttons  and its title inside the chat options screen.
```CSS
[data-cognigy-webchat-root] .webchat-chat-options-action-btns-root {
    justify-content: space-between;
    padding: 10px;
}
```

* *webchat-chat-options-action-button-container*
The container for the set of quick reply buttons in the chat options screen
```CSS
[data-cognigy-webchat-root] .webchat-chat-options-action-button-container {
    justify-content: space-around;
    padding: 10px;
}
```

* *webchat-chat-options-action-btns-title*
The title for the quick reply buttons in the chat options screen
```CSS
[data-cognigy-webchat-root] .webchat-chat-options-action-btns-title {
    font-size: 18px;
    font-family: Arial, Helvetica, sans-serif;
    color: rgb(5, 5, 131);
}
```

* *webchat-chat-options-action-button*
An individual quick reply button in the chat options screen.
```CSS
[data-cognigy-webchat-root] .webchat-chat-options-action-button {
    background-color: rgb(5, 5, 131) !important;
    color: white;
}
```

* *webchat-rating-widget-root*
The root container for the rating widget that includes the rating title, thumbs up/down button, text area and submit button.
```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-root {
    padding: 20px;
}
```

* *webchat-rating-widget-title*
The title of the rating widget.
```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-title {
    font-size: 20px;
    color: rgb(5, 5, 131);
}
```

* *webchat-rating-widget-content-container*
The container for the rating widget's thumbs up/down buttons.
```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-content-container {
    justify-content: space-between;
    padding: 10px;
}
```

* *webchat-rating-widget-thumbs-up-button*
The thumbs-up button for the rating widget.
```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-thumbs-up-button {
    background-color: #00cc66 !important;
}
```

* *webchat-rating-widget-thumbs-down-button*
The thumbs-down button for the rating widget.
```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-thumbs-down-button {
    background-color: #cc0000 !important;
}
```

* *webchat-rating-widget-comment-input-field*
The input field for comments in the rating widget.
```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-comment-input-field {
    font-family: Arial, Helvetica, sans-serif !important;
}
```

* *webchat-rating-widget-send-button*
The button to send the rating/comment.
```CSS
[data-cognigy-webchat-root] .webchat-rating-widget-send-button {
    background-color: rgb(5, 5, 131) !important;
}
```

* *webchat-chat-options-footer-link*
The link displayed at the footer of the chat options screen.
```CSS
[data-cognigy-webchat-root] .webchat-chat-options-footer-link {
    text-decoration: underline !important;
    padding: 10px;
}
```

* *webchat-chat-options-footer-link-text*
The text for the footer link in chat options screen.
```CSS
[data-cognigy-webchat-root] .webchat-chat-options-footer-link-text {
    font-size: 14px;
    font-family: Arial, Helvetica, sans-serif !important;
}
```

## Webchat templates messages customization

Our Webchat ships with message templates out of the box (Quick replies, Buttons, Image Galleries, Media, Lists) these elements can be also customized to meet design guidelines even more!

See it in action:  
[![Edit modern-dawn-9ez8r](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/modern-dawn-9ez8r?fontsize=14&hidenavigation=1&theme=dark)  


Here are the classes that you can use to modify it:

### Quick Replies

* *webchat-quick-reply-template-root*  
This class contains the whole Quick Reply element, you can modify its size for example.
```CSS
[data-cognigy-webchat-root] .webchat-quick-reply-template-root {
width: 500px;
height: 500px;
}

```
* *webchat-quick-reply-template-header-message*  
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
* *webchat-quick-reply-template-replies-container*  
This is the element holding all Quick Replies, you can change the way they are shown, e.g. as a column.
```CSS
[data-cognigy-webchat-root] .webchat-quick-reply-template-replies-container {
  display: flex;
  flex-direction: column;
}

```
* *webchat-quick-reply-template-reply*  
This is the style of the single Quick Reply element, all of them will be modified.
```CSS
[data-cognigy-webchat-root] .webchat-quick-reply-template-replies-container .webchat-quick-reply-template-reply {
    animation: "Some animation" ;
    border-color:#272343;
    color: #2d334a;
}

```

### Buttons

* *webchat-buttons-template-root*  
This class contains the Buttons element.
```CSS
[data-cognigy-webchat-root] .webchat-buttons-template-root {
  border-radius: 0;
  animation: "Some animation" ;
}

```
* *webchat-buttons-template-header*  
The container and header of the buttons, you can modify the text position and style.
```CSS
[data-cognigy-webchat-root] .webchat-buttons-template-header {
  text-align: center;
  font-weight: bold;
  background: #e3f6f5;
}

```
* *webchat-buttons-template-button*  
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

* *webchat-carousel-template-root*  
The card element from a Gallery, here you can increase its size for example.
```CSS
[data-cognigy-webchat-root] .webchat-carousel-template-root {
  width: 200px;
}

* *webchat-carousel-template-frame*  
The frame that adds the "card styles" such as background-color or box-shadow.
```CSS
[data-cognigy-webchat-root] .webchat-carousel-template-frame {
  box-shadow: none;
}

```
* *webchat-carousel-template-content*  
The content of the card, you can modify it's height and make it look smaller so you could show more content.
```CSS
[data-cognigy-webchat-root] .webchat-carousel-template-content {
  background: #e3f6f5;
  height: 200px;
}

```
* *webchat-carousel-template-title*  
The title of the card.
```CSS
[data-cognigy-webchat-root] .webchat-carousel-template-title {
    color:blue;
}

```
* *webchat-carousel-template-subtitle*  
The subtitle of the card.
```CSS
[data-cognigy-webchat-root] .webchat-carousel-template-subtitle {
  color:white;
}
```
* *webchat-carousel-template-button*  
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

* *webchat-media-template*  
The media element can be of three forms: Image, Video or Audio. You can modify its container or put some animations on it
```CSS
[data-cognigy-webchat-root] .webchat-media-template-image {
  animation: "Some animation" 1s;
}

[data-cognigy-webchat-root] .webchat-media-template-video {
}

[data-cognigy-webchat-root] .webchat-media-template-audio {
}
```

### List

* *webchat-list-template-root*  
The container element of the List, you can remove the border-radius that comes with it.
```CSS
[data-cognigy-webchat-root] .webchat-list-template-root {
  border-radius: 0;
}
```
* *webchat-list-template-header*  
This is the header element, which is above all other componets of the list.
```CSS
[data-cognigy-webchat-root] .webchat-list-template-header {
  heigth: 200px;
}
```
* *webchat-list-template-header-content*  
The content of the header, here you can center all elements for example.
```CSS
[data-cognigy-webchat-root] .webchat-list-template-header-content {
  text-align: center;
}
```
* *webchat-list-template-header-title*  
The title of the header element.
```CSS
[data-cognigy-webchat-root] .webchat-list-template-header-title {
  color: green;
}
```
* *webchat-list-template-header-subtitle*  
The subtitle of the header element.
```CSS
[data-cognigy-webchat-root] .webchat-list-template-header-subtitle {
  color: green;
}
```
* *webchat-list-template-header-button*  
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
* *webchat-list-template-element*  
The element that contains a single list element
```CSS
[data-cognigy-webchat-root] .webchat-list-template-element {
  background: #e3f6f5;
}
```
* *webchat-list-template-element-title*  
The title of every list element.
```CSS
[data-cognigy-webchat-root] .webchat-list-template-element-title {
  color: yellow;
}
```
* *webchat-list-template-element-subtitle*  
The subtitle of every list element.
```CSS
[data-cognigy-webchat-root] .webchat-list-template-element-subtitle {
  color: yellow;
}
```
* *webchat-list-template-element-button*  
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
* *webchat-list-template-global-button*   
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

* *webchat-plugin-date-picker*  
The container element of the Date picker plugin, you can make it's font appear bigger.
```CSS
[data-cognigy-webchat-root] .webchat-plugin-date-picker {
  font-size: 125%;
}
```
* *webchat-plugin-date-picker-header*  
The header of the Date picker plugin, it it possible to change e.g. it's background color.
```CSS
[data-cognigy-webchat-root] .webchat-plugin-date-picker-header {
  background-color: linear-gradient(185deg,#36b96e,#2c6caf);
}
```
* *webchat-plugin-date-picker-content*  
The content container element of the Date picker plugin, let it glow with an inset shadow.
```CSS
[data-cognigy-webchat-root] .webchat-plugin-date-picker-content {
  box-shadow: 0 0 70px #ff99d7 inset;
}
```
* *webchat-plugin-date-picker-footer*  
The footer element of the Date picker plugin, give it a custom look with padding.
```CSS
[data-cognigy-webchat-root] .webchat-plugin-date-picker-footer {
  padding: 1em 3em;
}
```
* *webchat-plugin-date-picker-weekdays*  
The Weekdays of the calendar can be customized with e.g. uppercase labels.
```CSS
[data-cognigy-webchat-root] .flatpickr-weekday {
  text-transform: uppercase;
}
```
* *webchat-plugin-date-picker-footer*  
The look and feel of the selected date can be changed.
```CSS
[data-cognigy-webchat-root] .flatpickr-day.selected {
  background: #28c8ef;
  color: hsla(0, 0%, 100%, 0.95);
  font-weight: bold;
  font-size: 22px;
}
```
