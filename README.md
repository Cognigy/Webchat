# Cognigy Webchat (v3)

Webchat v3 is a significant upgrade from the previous Webchat 2 versions, featuring enhanced user interface, improved customization options, and a host of [new features](https://docs.cognigy.com/webchat/v3/features/#webchat-3-key-features) designed to provide a better user experience.

## Documentation

To get started using this newer version of Webchat on your website, you can refer to the [Documentation section](./docs/README.md) in this repository. For additional information, please consult the [Getting Started with Webchat v3](https://docs.cognigy.com/webchat/getting-started/) guide in our product documentation.

Customizing your Webchat endpoint has been made easy with Webchat v3, as it offers a lot of new settings. Here you can find the [list of endpoint settings](./docs/embedding.md/#endpoint-settings). information on further styling customization can be found in the [guide on applying custom CSS to the Webchat](./docs/css-customization.md).

## Building your Webchat

You need an installed version of `Node.js` to build your Webchat. Clone this repository, then run `npm i` and `npm run bundle` within the root folder to install dependencies and create bundle files in `dist/`.

## Development

For development purposes, you can utilize `npm run dev`. This command spawns an HTTP server on port 8080, showcasing the current form of the webchat directly from the source code. It automatically reloads upon updating source files, simplifying the development process.
It automatically reloads when you make changes, streamlining the development process.

## Migration Guide

If you are already using Webchat 2 and want to migrate to Webchat v3, please follow the [migration guide](https://docs.cognigy.com/webchat/migration/) here.

## DEPRECATION WARNING FOR WEBCHAT v2

With the release of our Webchat v3, we are also announcing the deprecation of older versions of [Webchat (v2.X)](https://github.com/Cognigy/WebchatWidget).

**End of Support: 31st January 2026**

### What This Means for You:
Effective immediately, there will be
- No Further Feature Updates: We will no longer release feature updates for the deprecated Webchat versions.
- No Bug Fixes: Issues reported in the deprecated versions will not be addressed.
- Limited Support: Customer support for the deprecated versions will be significantly reduced and eventually unavailable after the end of support date.
- Security Fixes: We will continue to provide security fixes until the end of the support date. 
