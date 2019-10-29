import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { ExternalEntitiesAuth } from './external-entities-auth.js';
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

        .at-the-bottom {
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
          label="Senha de acesso"
          value="{{ssPassword}}"
          error-message="Senha demasiado curta"
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
      <div class="at-the-bottom">
        <slot name="notice"></slot>
        <template is="dom-if" if="[[_readonly]]">
          <casper-notice type="warning">Para modificar os campos que estão bloqueados poderá fazê-lo na opção de menu <i>Senhas da Empresa</i></casper-notice>
        </template>
      </div>
    `;
  }

  static get is() {
    return 'ss-login';
  }

  static get entity() {
    return 'SS';
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

  async getVaultData () {
    let _originalSsUsername = this.ssUsername;

    try {
      const entityLogin = this._entityAccess;

      if (entityLogin['auto-login']) {
        this.ssUsername = entityLogin.username;
        this.ssPassword = this._generateFakePassword();
        this.ssUseFromVault = true;
        this._readonly = true;
        this.$.ssUsername.readonly = true;
        this.$.ssPassword.readonly = true;
      } else {
        this._addPassword('SS', 'entity');
      }
    } catch (error) {
      this._cdbUnavailable = true;
      this._resetFieldsToOriginalState(_originalSsUsername);
    }
  }

  checkCredentials() {
    if (this.ssPassword === null || this.ssPassword.length < this.$.ssPassword.minlength) {
      if (this.ssPassword.length === 0) {
        this._addError('A senha do segurança social é de preenchimento obrigatório.');
      } else {
        this._addError('A senha do segurança social é demasiado curta.');
      }
    }
  }

  _resetFieldsToOriginalState(originalSsUsername) {
    this._readonly = false;
    this.ssUsername = originalSsUsername;
    this.ssPassword = '';
    this.ssUseFromVault = false;
    this.$.ssUsername.readonly = false;
    this.$.ssPassword.readonly = false;
  }
}

window.customElements.define(SsLogin.is, SsLogin);