# Testing with Cypress

```typescript
//cypress/commands.ts
import vroom from '../../src/vroom';

vroom.server?.setDelay(0);
Cypress.Commands.add('vroomReset', () => vroom.server?.reset())

declare global {
    namespace Cypress {
        interface Chainable {
            vroomReset(): void
        }
    }
}

// Add the vroom instance to the test window
Cypress.on('window:before:load', (win: any) => {
    win.cypressVroom = vroom;
});

export default vroom;
```

In a test you can now use vroom, like you would in seeds

```typescript
// e2e/example.cy.ts

import vroom from '../support/e2e';

describe('My First Test', () => {
  beforeEach(() => {
    // Reset vroom before each test to truncate db and remove route overrides
    cy.vroomReset();
  })

  it('Shows data', () => {
    vroom.db.author.create({
      name: 'George RR Martin'
    })
    cy.visit('/')
    cy.contains('George RR Martin')
  })

  it('Shows an error when api faild', () => {
    vroom.server?.get('/authors', () => {
      throw new ServerError(500)
    })

    cy.visit('/')
    cy.contains('Could not load authors')
  })
})
