describe('Source Color Mapping', () => {
    beforeEach(() => {
        cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
        cy.window().then(window => {
            cy.getWebchat().then(webchat => {
                // @ts-ignore
                window.webchat = webchat;
            });
        })
    });

    it('should render user messages as a shade of primary by default', () => {

        cy.receiveMessage('user message', {}, 'user');

        cy.get('.webchat-message-row.user .chat-bubble').should('have.css', 'background-color', 'rgb(232, 235, 255)');
    });

    it('should render bot messages as neutral by default', () => {
        cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

        cy.receiveMessage('bot message', {}, 'bot');

        cy.get('.webchat-message-row.bot .chat-bubble').should('have.css', 'background', 'rgb(255, 255, 255) none repeat scroll 0% 0% / auto padding-box border-box');
    });

    it('should render agent messages as "primary" by default', () => {
        cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

        cy.receiveMessage('agent message', {}, 'agent');

        cy.get('.webchat-message-row.agent .chat-bubble').should('have.css', 'background', 'rgb(255, 255, 255) none repeat scroll 0% 0% / auto padding-box border-box');
    });

    // TODO: SourceColorMapping is not working anymore. Check if this is planned in a follow-up

    xit('should render user messages as "neutral" if configures in sourceColorMapping', () => {
        cy.visitWebchat().initMockWebchat({
            settings: {
                widgetSettings: {
                    sourceColorMapping: {
                        user: 'neutral'
                    }
                }
            }
        }).openWebchat().startConversation();

        cy.receiveMessage('user message', {}, 'user');

        cy.get('.webchat-message-row.user .chat-bubble').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    });

    xit('should render bot messages as "primary" if configures in sourceColorMapping', () => {
        cy.visitWebchat().initMockWebchat({
            settings: {
                widgetSettings: {
                    sourceColorMapping: {
                        bot: 'primary'
                    }
                }
            }
        }).openWebchat().startConversation();

        cy.receiveMessage('bot message', {}, 'bot');

        cy.get('.webchat-message-row.bot .chat-bubble').should('have.css', 'background-color', 'rgb(232, 235, 255)');
    });

    xit('should render agent messages as "primary" if configures in sourceColorMapping', () => {
        cy.visitWebchat().initMockWebchat({
            settings: {
                widgetSettings: {
                    sourceColorMapping: {
                        agent: 'primary'
                    }
                }
            }
        }).openWebchat().startConversation();

        cy.receiveMessage('agent message', {}, 'agent');

        cy.get('.webchat-message-row.agent .chat-bubble').should('have.css', 'background-color', 'rgb(232, 235, 255)');
    });
});