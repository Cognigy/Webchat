import { Server, Client, SocketIO, WebSocket } from 'mock-socket'

const goOffline = () => {
    cy.log('**go offline**')
        .then(() => {
            return Cypress.automation('remote:debugger:protocol',
                {
                    command: 'Network.enable',
                })
        })
        .then(() => {
            return Cypress.automation('remote:debugger:protocol',
                {
                    command: 'Network.emulateNetworkConditions',
                    params: {
                        offline: true,
                        latency: -1,
                        downloadThroughput: -1,
                        uploadThroughput: -1,
                    },
                })
        })
}

const goOnline = () => {
    // disable offline mode, otherwise we will break our tests :)
    cy.log('**go online**')
        .then(() => {
            // https://chromedevtools.github.io/devtools-protocol/1-3/Network/#method-emulateNetworkConditions
            return Cypress.automation('remote:debugger:protocol',
                {
                    command: 'Network.emulateNetworkConditions',
                    params: {
                        offline: false,
                        latency: -1,
                        downloadThroughput: -1,
                        uploadThroughput: -1,
                    },
                })
        })
        .then(() => {
            return Cypress.automation('remote:debugger:protocol',
                {
                    command: 'Network.disable',
                })
        })
}

const assertOnline = () => {
    return cy.wrap(window).its('navigator.onLine').should('be.true')
}

const assertOffline = () => {
    return cy.wrap(window).its('navigator.onLine').should('be.false')
}

// Offline behavior is not supported in Firefox
describe('Reconnection', { browser: "!firefox" }, () => {

    beforeEach(() => {
        goOnline();
        cy.visit("/webchat.test.html")
    });

    afterEach(goOnline);

    it('should send the messages after network reconnection', () => {
        cy.initWebchat({
            settings: {
                homeScreen: {
                    enabled: true,
                    previousConversations: {
                        enabled: true,
                        buttonText: "View previous conversations",
                    },
                },
                behavior: {
                    enableConnectionStatusIndicator: false,
                }
            }
        })

        // Open Webchat to establish a connection
        cy.openWebchat();
        cy.startConversation()

        // Wait until a stable connection is established before going offline
        cy.waitUntil(
            () => cy.get(".webchat-chat-history").contains("You're now chatting with an AI Agent."),
        );
        // Go offline
        goOffline();

        assertOffline();

        // Send a  messages
        cy.get('[aria-label="Message to send"]')
            .type("Hi")
            .get('[aria-label="Send Message"]')
            .click()
            .get(".webchat-chat-history")
            .contains("Hi");

        // Wait for the reconnection
        goOnline();
        assertOnline();

        cy.get(".webchat-chat-history").contains("You said \"Hi\".");

    });
});