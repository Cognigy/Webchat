import * as React from 'react';
import { Store } from 'redux';
import { StoreState, createWebchatStore } from '../store/store';
import { Provider } from 'react-redux';
import { ConnectedWebchatUI, FromProps } from './ConnectedWebchatUI';
import { MessagePlugin } from '../../common/interfaces/message-plugin';
import { sendMessage } from '../store/messages/message-middleware';
import { MessageSender } from '../../webchat-ui/interfaces';
import { setHasAcceptedTerms, setOpen, setShowHomeScreen, showChatScreen, toggleOpen, setShowChatOptionsScreen } from '../store/ui/ui-reducer';
import { loadConfig } from '../store/config/config-middleware';
import { connect } from '../store/connection/connection-middleware';
import { EventEmitter } from 'events';
import { SocketClient } from '@cognigy/socket-client';
import { getEndpointBaseUrl, getEndpointUrlToken } from '../helper/endpoint';
import { IWebchatSettings } from '../../common/interfaces/webchat-config';
import { Options } from '@cognigy/socket-client/lib/interfaces/options';
import { setInitialSessionId, updateSettings } from '../store/config/config-reducer';
import { createOutputHandler } from '../store/messages/message-handler';
import { isDisabledDueToMaintenance } from '../helper/maintenance';
import { isDisabledOutOfBusinessHours } from '../helper/businessHours';
import { isDisabledDueToConnectivity } from '../helper/connectivity';
import { createNotification } from '../../webchat-ui/components/presentational/Notifications';
import { getStorage } from '../helper/storage';
import { hasAcceptedTermsInStorage } from '../helper/privacyPolicy';
import { setUserId } from '../store/options/options-reducer';

export interface WebchatProps extends FromProps {
    url: string;
    options?: Partial<Options>;
	settings?: Partial<IWebchatSettings>;
    messagePlugins?: MessagePlugin[];
}

export class Webchat extends React.PureComponent<WebchatProps> {
    public store: Store<StoreState>;
    public client: SocketClient;
    public analytics: EventEmitter = new EventEmitter();
    public _handleOutput: (output: unknown) => void;


    // component lifecycle methods
    constructor(props: WebchatProps) {
        super(props);

        const { url, options, settings } = props;

        const baseUrl = getEndpointBaseUrl(url);
        const token = getEndpointUrlToken(url);
        const socketOptions = {
            channel: 'webchat-client',
            ...options
        }

        const client = new SocketClient(baseUrl, token, socketOptions);
        this.client = client;
        const store = createWebchatStore(this, url, settings);
        this.store = store;

        this._handleOutput = createOutputHandler(this.store);
    }

	UNSAFE_componentWillMount() {
		const { settings } = this.props;

		const disableLocalStorage = settings?.embeddingConfiguration?.disableLocalStorage ?? false;
		const useSessionStorage = settings?.embeddingConfiguration?.useSessionStorage ?? false;
		const browserStorage = getStorage({ disableLocalStorage, useSessionStorage });
		const userId = this.client.socketOptions.userId;
		if (hasAcceptedTermsInStorage(browserStorage, userId)) {
			this.store.dispatch(setHasAcceptedTerms(userId));
		}

        this.store.dispatch(loadConfig());
        if (this.props.options?.sessionId) {
            this.store.dispatch(setInitialSessionId(this.props.options.sessionId));
        }
        if (this.props.options?.userId) {
            this.store.dispatch(setUserId(this.props.options?.userId));
        }
    }

    componentWillUnmount() {
        this.client.disconnect();
    }

    registerAnalyticsService(handler: (event: { type: string; payload?: any; }) => void) {
        this.analytics.on('analytics-event', handler);
    }

    emitAnalytics = (type: string, payload?: any) => {
        this.analytics.emit('analytics-event', {
            type,
            payload
        });
    }

    // component API (for usage via ref)
    connect = async () => {
        this.store.dispatch(connect());
    }

    sendMessage: MessageSender = (text, data, options) => {
        this.store.dispatch(sendMessage({ text, data }, options));
    }

    // TODO: move the logic to middleware
  _open = () => {
      const { settings } = this.store.getState().config;
      
      const disableLocalStorage = settings?.embeddingConfiguration?.disableLocalStorage ?? false;
      const useSessionStorage = settings?.embeddingConfiguration?.useSessionStorage ?? false;
      const browserStorage = getStorage({ disableLocalStorage, useSessionStorage });
      const userId = this.client.socketOptions.userId;
      
      const homeScreenEnabled = settings?.homeScreen?.enabled === true;
      const privacyNoticeEnabled = settings?.privacyNotice?.enabled === true;
      const skipPrivacyNotice = !privacyNoticeEnabled || hasAcceptedTermsInStorage(browserStorage, userId)
      
      if (!homeScreenEnabled && skipPrivacyNotice) {
          this.store.dispatch(setShowHomeScreen(false));
          this.store.dispatch(setShowChatOptionsScreen(false));
          this.store.dispatch(showChatScreen());
        }
        
      this.store.dispatch(toggleOpen());
    }


    open = async () => {
      /*
      * Here was the logic for maintenance and business hours
      *
      * We got rid of it for two reasons:
      * 1. It was broken, as the final else was making the chat open in any case.
      * 2. If you programatically trigger the chat to open, we asusme you know what you are doing.
      * 
      * We always await config from the endpoint.
      */

        const timeout = this.store.getState().config.settings.embeddingConfiguration?.connectivity?.enabled && this.store.getState().config.settings.embeddingConfiguration?.connectivity?.timeout || 1000;
        let timeoutReached = false;
        let timeoutCounter = 0;
        while (!this.store.getState().config.isConfigLoaded && !timeoutReached) {
          await new Promise(f => setTimeout(f, 50));
          timeoutCounter += 50;
          if (timeoutCounter >= timeout) {
            timeoutReached = true;
          }
        }
      this._open();
    }

    close = () => {
        this.store.dispatch(setOpen(false));
    }

    toggle = () => {
        this.store.dispatch(toggleOpen());
    }

    showNotification = (message: string) => {
        createNotification(message,);
    }

    startConversation = () => {
        this.store.dispatch(setShowHomeScreen(false));
        this.store.dispatch(showChatScreen());
    }

    on = (event, handler) => {
        this.client.on(event, handler);
    }

    onMessage = (handler: (message) => void) => {
        this.client.on('output', handler);
    }

    updateSettings = (settings: IWebchatSettings) => {
        this.store.dispatch(updateSettings(settings));
    }

    render() {
        const { url, options, messagePlugins = [], inputPlugins = [], ...props } = this.props;

        return (
            <Provider store={this.store}>
                <ConnectedWebchatUI
                    {...props}
                    options={options}
                    messagePlugins={messagePlugins}
                    inputPlugins={inputPlugins}
                    onEmitAnalytics={this.emitAnalytics}
                />
            </Provider>
        )
    }
}
