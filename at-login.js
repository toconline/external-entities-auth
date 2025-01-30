/* 
 * Copyright (C) 2019 Cloudware S.A. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { ExternalEntitiesAuth } from './external-entities-auth.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@cloudware-casper/casper-notice/casper-notice.js';

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
          display: none;
        }

        .container-input-accountant {
          height: 80px;
          display: none;
        }

        .at-the-bottom {
          display: flex;
          flex-grow: 2.0;
          flex-direction: column-reverse;
        }

        .at-the-bottom casper-notice {
          margin-bottom: 10px;
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
          id="entityUsername"
          class="login-input"
          label="NIF do sujeito passivo"
          value="{{entityUsername}}"
          error-message="NIF inválido"
          allowed-pattern="[0-9]|\/"
          auto-validate
        >
        </paper-input>
        <paper-input
          id="entityPassword"
          type="password"
          class="password-input"
          label="Senha do sujeito passivo"
          value="{{entityPassword}}"
          error-message="Senha demasiado curta"
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
          id="accountantUsername"
          class="login-input"
          label="NIF do contabilista"
          value="{{accountantUsername}}"
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
          error-message="Senha demasiado curta"
          minlength="[[minPasswordLength]]"
          auto-validate
        >
        </paper-input>
      </div>
      <div class="at-the-bottom">
        <slot name="notice"></slot>
        <template is="dom-if" if="[[_readonly]]">
          <casper-notice type="warning">Para modificar os campos que estão bloqueados poderá fazê-lo na opção de menu <i>Senhas da Empresa</i></casper-notice>
        </template>
      </div>
    `;
  }

  static get is() {
    return 'at-login';
  }

  static get entity () {
    return 'AT';
  }

  static get properties() {
    return {
      entityUsername: {
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
      accountantUsername: {
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
        value: false
      },
      authorizedAccountant: {
        type: Boolean,
        value: false
      },
      withAccountantPassword: {
        type: Boolean,
        value: false
      }
    };
  }

  static get observers() {
    return [
      '_checkedSubmittedByAccountant(submittedByAccountant)',
      '_checkedAuthorizedAccountant(authorizedAccountant)'
    ]
  }

  async init () {
    await super.init();
    if ((this.isAccountant() || this.isCompanyAccountant()) && this.withAccountantPassword) {
      this.$.containerCheckbox.style.display = 'block';
    }
  }

  async getVaultData () {
    let _originalEntityUsername = this.entityUsername;
    let _originalaccountantUsername = this.accountantUsername;

    try {
      const entityLogin = this._entityAccess;

      if (entityLogin['auto-login'] && entityLogin['status'] == 'accepted') {
        this.entityUsername = entityLogin.username;
        this.entityPassword = this._generateFakePassword();
        this.entityUseFromVault = true;
        this._readonly = true;
        this.$.entityUsername.readonly = true;
        this.$.entityPassword.readonly = true;
      } else {
        this._addPassword('AT', 'entity');
      }

      if ((this.isAccountant() || this.isCompanyAccountant()) && this.withAccountantPassword) {
        const accountantLogin = await this._checkVaultLoginAccess('AT', 'accountant');

        if (accountantLogin['auto-login'] && accountantLogin['status'] == 'accepted') {
          this.accountantUsername = accountantLogin.username;
          this.accountantPassword = this._generateFakePassword();
          this.accountantUseFromVault = true;
          this._readonly = true;
          this.$.accountantUsername.readonly = true;
          this.$.accountantPassword.readonly = true;
        }
      }
    } catch (error) {
      this._cdbUnavailable = true;
      this._resetFieldsToOriginalState(_originalEntityUsername, _originalaccountantUsername);
    }
  }

  isAccountant() {
    return ((this.app.role_mask & 4) > 0 ? true : false);
  }

  isCompanyAccountant() {
    return ((this.app.role_mask & 1024) > 0 ? true : false);
  }

  checkCredentials() {
    if (!this.authorizedAccountant && (this.entityPassword === null || this.entityPassword.length < this.$.entityPassword.minlength)) {
      if (this.entityPassword.length === 0) {
        this._addError('A senha do sujeito passivo é de preenchimento obrigatório.');
      } else {
        this._addError('A senha do sujeito passivo é demasiado curta.');
      }
    }

    if (this.submittedByAccountant === true) {
      if (this.accountantUsername === null || this.accountantUsername.length === 0) {
        this._addError('O NIF do contabilista é de preenchimento obrigatório.');
      }

      if (this.accountantPassword === null || this.accountantPassword.length < this.$.accountantPassword.minlength) {
        if (this.accountantPassword.length === 0) {
          this._addError('A senha do contabilista é de preenchimento obrigatório.');
        } else {
          this._addError('A senha do contabilista é demasiado curta.');
        }
      }
    }
  }

  _resetFieldsToOriginalState(originalEntityUsername, originalaccountantUsername) {
    this._readonly = false;
    this.entityUsername = originalEntityUsername;
    this.entityPassword = '';
    this.entityUseFromVault = false;
    this.$.entityUsername.readonly = false;
    this.$.entityPassword.readonly = false;

    this.accountantUsername = originalaccountantUsername;
    this.accountantPassword = '';
    this.accountantUseFromVault = false;
    this.$.accountantUsername.readonly = false;
    this.$.accountantPassword.readonly = false;
  }

  _checkedSubmittedByAccountant(value) {
    if (value === true) {
      this.$.authorizedAccountant.style.display = 'flex';
      this.$.containerAccountant.style.display = 'flex';
      if (!this.accountantUseFromVault && this.isAccountant()) {
        this._addPassword('AT', 'accountant');
      }
    } else {
      this.$.authorizedAccountant.style.display = 'none';
      this.$.containerAccountant.style.display = 'none';
      this.authorizedAccountant = false;
      if (!this.accountantUseFromVault && this.isAccountant()) {
        this._removePassword('AT', 'accountant');
      }
    }
  }

  _checkedAuthorizedAccountant(value) {
    if (value === true) {
      this.$.entityUsername.disabled = true;
      this.$.entityPassword.disabled = true;
    } else {
      this.$.entityUsername.disabled = false;
      this.$.entityPassword.disabled = false;
    }
  }
}

window.customElements.define(AtLogin.is, AtLogin);
