import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { ExternalEntitiesAuth } from './external-entities-auth.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import '@polymer/paper-input/paper-input.js';
import '@casper2020/casper-notice/casper-notice.js';

class SsLogin extends ExternalEntitiesAuth {
  static get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .container-input {
          height: 80px;
          display: flex;
        }

        .container-notice {
          display: flex;
          flex-grow: 2.0;
          flex-direction: column-reverse;
        }

        .login-input {
          margin-right: 1%;
          width: 49%;
        }

        .password-input {
          margin-left: 1%;
          width: 49%;
        }

        .sequence-input {
          width: 100%;
        }
      </style>

      <div class="container-input">
        <paper-input
          id="ssUsername"
          class="login-input"
          label="Código de identificação"
          value="{{ssUsername}}"
          error-message="Código inválido"
          allowed-pattern="[0-9]"
          maxlength="11"
          auto-validate
          required
        >
        </paper-input>
        <paper-input
          id="ssPassword"
          type="password"
          class="password-input"
          label="Palavra chave"
          value="{{ssPassword}}"
          error-message="Palavra chave demasiado curta"
          minlength="[[minPasswordLength]]"
          auto-validate
          required
        >
        </paper-input>
      </div>
      <paper-input
        class="sequence-input"
        label="Número de sequência do ficheiro a substitituir"
        value="{{seqNumber}}"
        allowed-pattern="[0-9]"
        maxlength="6"
        required>
      </paper-input>
      <div class="container-notice">
        <casper-notice>
          <slot name="notice"></slot>
        </casper-notice>
      </div>
    `;
  }

  static get is() {
    return 'ss-login';
  }

  static get properties() {
    return {
      ssUsername: {
        type: String,
        notify: true
      },
      ssPassword: {
        type: String
      },
      ssObfuscatedPassword: {
        type: String,
        computed: '_btoaPassword(ssPassword)'
      },
      ssUseFromVault: {
        type: Boolean,
        value: false
      },
      seqNumber: {
        type: Number
      }
    };
  }

  ready() {
    super.ready();
    afterNextRender(this, () => this.getVaultData());
  }

  async getVaultData () {
    try {
      const entityLogin = await this._checkVaultLoginAccess('SS', 'entity');

      if (entityLogin['auto-login']) {
        this.ssUsername = entityLogin.username;
        this.ssPassword = this._generateFakePassword();
        this.ssUseFromVault = true;
        this.$.ssPassword.readonly = true;
      } else {
        this._addPassword('SS', 'entity');
      }
    } catch (error) {
    }
  }

  checkCredentials() {
    let errorMessages = [];

    if (this.ssPassword === undefined || this.ssPassword.length < this.ssPassword.minlength) {
      if (this.ssPassword.length === 0) {
        errorMessages.push('A senha do segurança social é de preenchimento obrigatório.');
      } else {
        errorMessages.push('A senha do segurança social é demasiado curta.');
      }
    }

    return errorMessages;
  }
}

window.customElements.define(SsLogin.is, SsLogin);