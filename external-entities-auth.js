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
      minPasswordLength: {
        type: Number,
        value: 4
      }
    };
  }

  async _checkVaultLoginAccess(entity, type) {
    return await this.app.vault.checkLoginAccess(entity, type);
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
        this._storePasswords = false;
        this._savePasswords = [];
      }
    }

    return true;
  }

  getSavePasswords() {
    if (this._storePasswords) {
      return this._savePasswords;
    }

    return [];
  }

  _addPassword(entity, type) {
    this._savePasswords.push({ entity: entity, type: type });
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
