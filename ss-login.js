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
import '@cloudware-casper/casper-notice/casper-notice.js';

class SsLogin extends ExternalEntitiesAuth {
  static get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        #authorizedAgent {
          margin-top: 10px;
          display: none;
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

        .at-the-bottom casper-notice {
          margin-bottom: 10px;
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
        label="Número de sequência do ficheiro a substituir"
        value="{{seqNumber}}"
        allowed-pattern="[0-9]"
        maxlength="20"
        required
        hidden$=[[ssSimpleMode]]>
      </paper-input>
      <paper-checkbox id="authorizedAgent" checked="{{authorizedAgent}}">
        Declaração entregue por mandatário
      </paper-checkbox>
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
      },
      authorizedAgent: {
        type: Boolean,
        value: false,
        observer: '_checkedAuthorizedAgent'
      },
      withAuthorizedAgent: {
        type: Boolean,
        value: false
      },
      ssSimpleMode: {
        type: Boolean,
        value: false
      }
    };
  }

  async init() {
    if (this._entityType !== undefined) {
      this.__previousEntityType = this._entityType;
    }

    await super.init();

    if (this.__previousEntityType !== undefined) {
      this._entityType = this.__previousEntityType;
    }

    this._originalSsUsername = this.ssUsername;

    if (this.withAuthorizedAgent) {
      this.$.authorizedAgent.style.display = 'block';
    }
  }

  getVaultData () {
    const entityLogin = this._entityAccess;

    if (entityLogin['auto-login'] && entityLogin['status'] == 'accepted') {
      this.ssUsername = entityLogin.username;
      this.ssPassword = this._generateFakePassword();
      this.ssUseFromVault = true;
      this._readonly = true;
      this.$.ssUsername.readonly = true;
      this.$.ssPassword.readonly = true;
    } else {
      this._addPassword('SS', 'entity');
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

  async _checkedAuthorizedAgent(newValue, oldValue) {
    // This only should occur on the first default value assignment to authorizedAgent
    if (oldValue === undefined) {
      return true;
    }

    if (this.withoutVaultAccess) {
      return true;
    }

    this._resetFieldsToOriginalState(this._originalSsUsername);

    if (newValue) {
      this._removePassword('SS', 'entity');
      this._entityType = 'SSMT';
      try {
        const entityLogin = await this._checkVaultLoginAccess('SSMT', 'entity');

        if (entityLogin['auto-login'] && entityLogin['status'] == 'accepted') {
          this.ssUsername = entityLogin.username;
          this.ssPassword = this._generateFakePassword();
          this.ssUseFromVault = true;
          this._readonly = true;
          this.$.ssUsername.readonly = true;
          this.$.ssPassword.readonly = true;
        } else {
          this._addPassword('SSMT', 'entity');
        }
      } catch (error) {
        this._cdbUnavailable = true;
        this._resetFieldsToOriginalState(this._originalSsUsername);
      }
    } else {
      this._entityType = this.constructor.entity;
      this._removePassword('SSMT', 'entity');
      this.getVaultData();
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
