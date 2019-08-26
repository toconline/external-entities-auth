import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { ExternalEntitiesAuth } from './external-entities-auth.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@casper2020/casper-notice/casper-notice.js';

class AtLogin extends ExternalEntitiesAuth {
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

        .container-checkbox {
          margin-top: 10px;
          display: none;
        }

        .container-input-accountant {
          height: 80px;
          display: none;
        }

        .container-notice {
          display: flex;
          flex-grow: 2.0;
          flex-direction: column-reverse;
        }

        .login-checkbox {
          margin-top: 10px;
          display: none;
        }

        .login-input {
          margin-right: 1%;
          width: 49%;
        }

        .password-input {
          margin-left: 1%;
          width: 49%;
        }
      </style>

      <div class="container-input">
        <paper-input
          id="entityTaxRegistrationNumber"
          class="login-input"
          label="NIF do sujeito passivo"
          value="{{entityTaxRegistrationNumber}}"
          error-message="NIF inválido"
          allowed-pattern="[0-9]|\/"
          auto-validate
          readonly
        >
        </paper-input>
        <paper-input
          id="entityPassword"
          type="password"
          class="password-input"
          label="Palavra chave"
          value="{{entityPassword}}"
          error-message="Palavra chave demasiado curta"
          minlength="[[minPasswordLength]]"
          auto-validate
        >
        </paper-input>
      </div>
      <div id="containerCheckbox" class="container-checkbox">
        <paper-checkbox id="submittedByAccountant" checked="{{submittedByAccountant}}">
          Declaração entregue por contabilista
        </paper-checkbox>
        <paper-checkbox id="authorizedAccountant" class="login-checkbox" checked="{{authorizedAccountant}}">
          Contabilista autorizado sujeito passivo
        </paper-checkbox>
      </div>
      <div id="containerAccountant" class="container-input-accountant">
        <paper-input
          id="accountantTaxRegistrationNumber"
          class="login-input"
          label="NIF do contabilista"
          value="{{accountantTaxRegistrationNumber}}"
          error-message="NIF inválido"
          allowed-pattern="[0-9]|\/"
          auto-validate
        >
        </paper-input>
        <paper-input
          id="accountantPassword"
          type="password"
          class="password-input"
          label="Senha do contabilista"
          value="{{accountantPassword}}"
          minlength="[[minPasswordLength]]"
          error-message="Senha demasiado curta"
          auto-validate
        >
        </paper-input>
      </div>
      <div class="container-notice">
        <casper-notice>
          <slot name="notice"></slot>
        </casper-notice>
      </div>
    `;
  }

  static get is() {
    return 'at-login';
  }

  static get properties() {
    return {
      entityTaxRegistrationNumber: {
        type: String,
        notify: true
      },
      entityPassword: {
        type: String
      },
      entityObfuscatedPassword: {
        type: String,
        computed: '_btoaPassword(entityPassword)'
      },
      entityUseFromVault: {
        type: Boolean,
        value: false
      },
      accountantTaxRegistrationNumber: {
        type: String,
        notify: true
      },
      accountantPassword: {
        type: String
      },
      accountantObfuscatedPassword: {
        type: String,
        computed: '_btoaPassword(accountantPassword)'
      },
      accountantUseFromVault: {
        type: Boolean,
        value: false
      },
      submittedByAccountant: {
        type: Boolean,
        default: false
      },
      authorizedAccountant: {
        type: Boolean,
        default: false
      },
      minPasswordLength: {
        type: Number,
        value: 4
      },
      withAccountantPassword: {
        type: Boolean,
        default: false
      }
    };
  }

  static get observers() {
    return [
      '_checkedSubmittedByAccountant(submittedByAccountant)',
      '_checkedAuthorizedAccountant(authorizedAccountant)'
    ]
  }

  ready() {
    super.ready();
    afterNextRender(this, () => this.getVaultData());
  }

  async getVaultData () {
    try {
      const entityLogin = await this._checkVaultLoginAccess('AT', 'entity');

      if (entityLogin['auto-login']) {
        this.entityTaxRegistrationNumber = entityLogin.username;
        this.entityPassword = this._generateFakePassword();
        this.entityUseFromVault = true;
        this.$.entityTaxRegistrationNumber.readonly = false;
        this.$.entityPassword.readonly = true;
      } else {
        this._addPassword('AT', 'entity');
      }

      if (this.isAccountant() && this.withAccountantPassword) {
        this.$.containerCheckbox.style.display = 'block';

        const accountantLogin = await this._checkVaultLoginAccess('AT', 'accountant');

        if (accountantLogin['auto-login']) {
          this.accountantTaxRegistrationNumber = accountantLogin.username;
          this.accountantPassword = this._generateFakePassword();
          this.accountantUseFromVault = true;
          this.$.accountantPassword.readonly = true;
        }
      }
    } catch (error) {
    }
  }

  isAccountant() {
    return ((this.app.role_mask & 4) > 0 ? true : false);
  }

  checkCredentials() {
    let errorMessages = [];

    if (this.submittedByAccountant === true) {
      if (this.accountantTaxRegistrationNumber === null || this.accountantTaxRegistrationNumber.length === 0) {
        errorMessages.push('O NIF do contabilista é de preenchimento obrigatório.');
      }

      if (this.accountantPassword === null || this.accountantPassword.length < this.accountantPassword.minlength) {
        if (this.accountantPassword.length === 0) {
          errorMessages.push('A senha do contabilista é de preenchimento obrigatório.');
        } else {
          errorMessages.push('A senha do contabilista é demasiado curta.');
        }
      }
    } else {
      if (this.entityPassword === null || this.entityPassword.length < this.minPasswordLength) {
        if (this.entityPassword.length === 0) {
          errorMessages.push('A senha do sujeito passivo é de preenchimento obrigatório.');
        } else {
          errorMessages.push('A senha do sujeito passivo é demasiado curta.');
        }
      }
    }
    return errorMessages;
  }

  _checkedSubmittedByAccountant(value) {
    if (value === true) {
      this.$.authorizedAccountant.style.display = 'flex';
      this.$.containerAccountant.style.display = 'flex';
      if (!this.accountantUseFromVault) {
        this._addPassword('AT', 'accountant');
      }
    } else {
      this.$.authorizedAccountant.style.display = 'none';
      this.$.containerAccountant.style.display = 'none';
      this.authorizedAccountant = false;
      if (!this.accountantUseFromVault) {
        this._removePassword('AT', 'accountant');
      }
    }
  }

  _checkedAuthorizedAccountant(value) {
    if (value === true) {
      this.$.entityTaxRegistrationNumber.disabled = true;
      this.$.entityPassword.disabled = true;
    } else {
      this.$.entityTaxRegistrationNumber.disabled = false;
      this.$.entityPassword.disabled = false;
    }
  }

  _generateFakePassword() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  _btoaPassword(password) {
    return btoa(password);
  }
}

window.customElements.define(AtLogin.is, AtLogin);