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
      }
    };
  }

  async _checkVaultLoginAccess(entity, type) {
    return await this.app.vault.checkLoginAccess(entity, type);
  }

  _addPassword(entity, type) {
    this._savePasswords.push({ entity: entity, type: type });
  }

  _removePassword(entity, type) {
    this._savePasswords.splice(this._savePasswords.findIndex(password => password.entity == entity && password.type == type), 1);
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
}

window.customElements.define(ExternalEntitiesAuth.is, ExternalEntitiesAuth);
