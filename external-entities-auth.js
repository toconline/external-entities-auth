import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';

class ExternalEntitiesAuth extends PolymerElement {
  static get template() {
    return html`
      External Entities Authentication
    `;
  }
}

window.customElements.define('external-entities-auth', ExternalEntitiesAuth);
