import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

export class ExternalEntitiesAuth extends PolymerElement {
  static get is() {
    return 'external-entities-auth';
  }

  static get properties() {
    return {
      _savePasswords: {
        type: Array,
        value: []
      },
      _storePasswords: {
        type: Boolean,
        value: false
      },
      _cdbUnavailable: {
        type: Boolean,
        value: false
      },
      _readonly: {
        type: Boolean,
        value: false
      },
      _errorMessages: {
        type: Array,
        value: []
      },
      _lockErrorMessages: {
        type: Boolean,
        value: false
      },
      minPasswordLength: {
        type: Number,
        value: 4
      },
      withoutDemoRestriction: {
        type: Boolean,
        value: false
      },
      withoutVaultAccess: {
        type: Boolean,
        value: false
      }
    };
  }

  static get observers() {
    return [
      '_whenCdbIsUnavailable(_cdbUnavailable)'
    ]
  }

  ready() {
    super.ready();
    afterNextRender(this, () => {
      if (this.parentElement.wizard && this.app.vault.allowedAccess()) {
        this.getVaultData();
        if (!this.withoutDemoRestriction) {
          this._checkDemoCompany();
        } else {
          this.withoutVaultAccess = true;
        }
      }
    });
  }

  async _checkVaultLoginAccess(entity, type) {
    if (this.withoutVaultAccess) {
      return { 'auto-login': false };
    }

    return await this.app.vault.checkLoginAccess(entity, type);
  }

  _canAccessVault() {
    return this.app.vault.allowedAccess();
  }

  async showSavePasswordsAlert() {
    if (this._savePasswords.length > 0) {
      try {
        await this.app.showAlert({
          title: 'Detetadas novas senhas',
          message: `Pretende gravar as novas senhas detetadas para utilização futura no sistema?`,
          accept: 'Sim',
          reject: 'Não'
        });
        this._storePasswords = true;
      } catch (error) {
        this._cleanStoredPasswords();
      }
    }

    return true;
  }

  getSavePasswords() {
    if (this._storePasswords && !this._cdbUnavailable && !this.withoutVaultAccess) {
      return this._savePasswords;
    }

    return [];
  }

  _addPassword(entity, type) {
    if (!this._cdbUnavailable && !this.withoutVaultAccess) {
      this._savePasswords.push({ entity: entity, type: type });
    }
  }

  getErrorMessages() {
    let _messages = this._errorMessages;
    if (!this._lockErrorMessages) {
      this._errorMessages = [];
    }
    return _messages;
  }

  _addError(message) {
    if (!this._lockErrorMessages) {
      this._errorMessages.push(message);
    } else {
      console.log('Do not add more errors. Messages are locked due to the fact that the company is demo');
    }
  }

  _checkDemoCompany() {
    if (this.app.demo_company) {
      this._addError('Esta funcionalidade não está disponível para empresas de demonstração');
      this._lockErrorMessages = true;
    }
  }

  _whenCdbIsUnavailable(cdbUnavailable) {
    if (cdbUnavailable) {
      this._cleanStoredPasswords();
      this.app.openToast({
        text: 'Não foi possível contactar com o serviço de Gestão de Senhas, no entanto pode prosseguir com a operação.',
        backgroundColor: 'var(--error-color)'
      });
    }
  }

  _cleanStoredPasswords() {
    this._storePasswords = false;
    this._savePasswords = [];
  }

  _removePassword(entity, type) {
    this._savePasswords.splice(this._savePasswords.findIndex(password => password.entity == entity && password.type == type), 1);
  }

  _generateFakePassword() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  _btoaPassword(password) {
    return btoa(password);
  }
}

window.customElements.define(ExternalEntitiesAuth.is, ExternalEntitiesAuth);
