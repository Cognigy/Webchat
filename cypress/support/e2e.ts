// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Message fixtures load images from picsum.photos. Serve them from a local 200×200
// image so the image specs don't fail when that external service is slow or down.
beforeEach(() => {
	cy.intercept("GET", "https://picsum.photos/**", {
		fixture: "images/square-200.png",
		headers: { "content-type": "image/png" },
	});
});
