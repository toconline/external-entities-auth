import { PolymerElement } from '@polymer/polymer/polymer-element.js';

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
      withDemoRestriction: {
        type: Boolean,
        readOnly: true,
        computed: '_computedNegationCondition(withoutDemoRestriction)'
      },
      withoutVaultAccess: {
        type: Boolean,
        value: false
      },
      withVaultAccess: {
        type: Boolean,
        readOnly: true,
        computed: '_computedNegationCondition(withoutVaultAccess)'
      }
    };
  }

  static get observers() {
    return [
      '_whenCdbIsUnavailable(_cdbUnavailable)'
    ]
  }

  ready () {
    super.ready();
  }

  async init () {
    this._errorMessages = []; // Cleanup possible error messages stored in memory

    if (this.withDemoRestriction) {
      this._addDemoRestriction();
    }

    if (this._isDemoCompany()) {
      this.withoutVaultAccess = true;
    }

    if (this.withoutVaultAccess) {
      return false;
    }

    if (!this.app.vault.allowedAccess()) {
      return false;
    }

    try {
      this._entityAccess = await this._checkVaultEntityAccess();
    } catch (error) {
      this._cdbUnavailable = true;
      this._entityAccess = {
        status: 'rejected'
      };
    }

    switch (this._entityAccess['status']) {
      case 'not_decided':
        try {
          await this._showVaultContract();
          try {
            // Need to checkLogin again
            this._entityAccess = await this._checkVaultEntityAccess();
          } catch (exception) {
            this._cdbUnavailable = true;
          }
        } catch (error) {
          this._cleanStoredPasswords();
          this.withoutVaultAccess = true;
        }
        break;

      case 'rejected':
        this.withoutVaultAccess = true;
        break;

      case 'accepted':
        break;
    }

    if (this.withVaultAccess) {
      this.getVaultData();
    }
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
    if (this._storePasswords && !this._cdbUnavailable && this.withVaultAccess) {
      return this._savePasswords;
    }

    return [];
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
      console.log('Do not add more errors. Error messages are locked due to the fact that the company is demo');
    }
  }

  async _checkVaultLoginAccess(entity, type) {
    let loginAccess = await this.app.vault.checkLoginAccess(entity, type);
    return loginAccess;
  }

  async _checkVaultEntityAccess () {
    return await this._checkVaultLoginAccess(this.constructor.entity, 'entity');
  }

  async _showVaultContract() {
    await this.app.showWizardWithPromise({
      append: true,
      tag_name: 'toconline-vault-contract',
      contract: {
        document_name: 'toconline-vault-contract',
        type: 'gdpr',
        optional: true,
        tube: 'toconline-dialog-authorization',
        payload: {
          type: 'gdpr',
          document_name: 'toconline-vault-contract'
        }
      }
    });
  }

  _isDemoCompany() {
    return this.app.demo_company;
  }

  _addDemoRestriction() {
    if (this._isDemoCompany()) {
      this._errorMessages = []; // Cleanup error messages, only show demo restriction message
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

  _addPassword(entity, type) {
    if (!this._cdbUnavailable && this.withVaultAccess) {
      this._savePasswords.push({ entity: entity, type: type });
    }
  }

  _removePassword(entity, type) {
    if (!this._cdbUnavailable && this.withVaultAccess) {
      this._savePasswords.splice(this._savePasswords.findIndex(password => password.entity == entity && password.type == type), 1);
    }
  }

  _cleanStoredPasswords() {
    this._storePasswords = false;
    this._savePasswords = [];
  }

  _generateFakePassword() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  _btoaPassword(password) {
    return btoa(password);
  }

  _computedNegationCondition(value) {
    return !value;
  }
}

window.customElements.define(ExternalEntitiesAuth.is, ExternalEntitiesAuth);
