import Component from 'can-component/';
import DefineMap from 'can-define/map/';
import view from './add.stache!';
import resources from '~/resources';
import Permissions from '~/permissions';
import router from '~/router';
import Api from 'shuttle-can-api';
import validator from 'can-define-validate-validatejs';
import localisation from '~/localisation';
import state from '~/state';

resources.add('role', {action: 'add', permission: Permissions.Manage.Roles});

var roles = new Api({ endpoint: 'roles' });

export const ViewModel = DefineMap.extend(
    'role-add',
    {
        working: 'boolean',
        name: {
            type: 'string',
            validate: {
                presence: true
            }
        },

        init() {
            state.title = 'role:list.title';
        },

        add: function () {
            var self = this;

            if (!!this.errors()) {
                return false;
            }

            this.working = true;

            roles.post({
                name: this.name
            })
                .then(function () {
                    self.working = false;
                })
                .catch(function () {
                    self.working = false;
                });

            this.close();

            return false;
        },

        close: function () {
            router.goto({
                resource: 'role',
                action: 'list'
            });
        }
    }
);

validator(ViewModel);

export default Component.extend({
    tag: 'access-role-add',
    ViewModel,
    view
});