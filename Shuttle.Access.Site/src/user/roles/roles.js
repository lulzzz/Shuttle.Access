import Component from 'can-component/';
import DefineList from 'can-define/list/';
import DefineMap from 'can-define/map/';
import view from './roles.stache!';
import resources from '~/resources';
import Permissions from '~/permissions';
import Api from 'shuttle-can-api';
import each from 'can-util/js/each/';
import makeArray from 'can-util/js/make-array/';
import router from '~/router';
import localisation from '~/localisation';
import state from '~/state';

resources.add('user', {action: 'roles', permission: Permissions.Manage.Users});

var roles = new Api({
    endpoint: 'roles',
    Map: UserRole
});

var api = {
    user: new Api({endpoint: 'users/{id}'}),
    setRole: new Api({endpoint: 'users/setrole'}),
    roleStatus: new Api({endpoint: 'users/roleStatus'})
}

const UserRole = DefineMap.extend({
    roleName: 'string',
    active: 'boolean',
    working: 'boolean',

    toggle: function () {
        var self = this;

        if (this.working) {
            state.alerts.show({message: localisation.value('workingMessage'), name: 'working-message'});
            return;
        }

        this.active = !this.active;
        this.working = true;

        api.setRole.post({
            userId: router.data.id,
            roleName: this.roleName,
            active: this.active
        })
            .then(function (response) {
                self.working = false;

                if (response.success) {
                    return;
                }

                switch (response.failureReason.toLowerCase()) {
                    case 'lastadministrator': {
                        self.active = true;
                        self.working = false;

                        state.alerts.show({
                            message: localisation.value('user:exceptions.last-administrator'),
                            name: 'last-administrator',
                            type: 'danger'
                        });

                        break;
                    }
                }
            })
            .catch(function () {
                self.working = false;
            });

    },

    rowClass: {
        get: function () {
            return this.active ? 'text-success success' : 'text-muted';
        }
    }
});

export const ViewModel = DefineMap.extend({
    user: {
        Type: DefineMap
    },
    isResolved: {
        type: 'boolean',
        default: false
    },

    init: function () {
        var self = this;

        this.refresh();

        this.on('workingCount',
            function () {
                self.getRoleStatus();
            });

        state.title = 'user:list.roles';
        state.navbar.addButton({
            type: 'back'
        });
        state.navbar.addButton({
            type: 'refresh',
            viewModel: this
        });
    },

    refresh() {
        const self = this;

        this.isResolved = false;

        self.roles.replace(new DefineList());

        roles.list()
            .then(function (availableRoles) {
                availableRoles = makeArray(availableRoles);
                availableRoles.push({id: '', roleName: 'administrator'});

                api.user.map({id: router.data.id})
                    .then(function (user) {
                        self.user = user;

                        each(availableRoles,
                            function (availableRole) {
                                const roleName = availableRole.roleName.toLowerCase();
                                const active = user.roles.filter(function (role) {
                                    return role.toLowerCase() === roleName;
                                }).length > 0;

                                self.roles.push(new UserRole({
                                    roleName: availableRole.roleName,
                                    active: active
                                }));
                            });
                    })
                    .then(function () {
                        self.isResolved = true;
                    });
            });
    },

    columns: {
        default() {
            return [
                {
                    columnTitle: 'active',
                    columnClass: 'col-1',
                    stache: '<cs-checkbox click:from="@toggle" checked:bind="active" checkedClass:from="\'fa-toggle-on\'" uncheckedClass:from="\'fa-toggle-off\'"/>{{#if working}}<i class="fa fa-hourglass-o" aria-hidden="true"></i>{{/if}}'
                },
                {
                    columnTitle: 'user:roleName',
                    columnClass: 'col',
                    attributeName: 'roleName'
                }
            ]
        }
    },

    roles: {
        Default: DefineList
    },

    getRoleItem: function (roleName) {
        var result;

        each(this.roles,
            function (item) {
                if (result) {
                    return;
                }

                if (item.roleName === roleName) {
                    result = item;
                }
            });

        return result;
    },

    workingItems: {
        get() {
            return this.roles.filter(function (item) {
                return item.working;
            });
        }
    },

    workingCount: {
        type: 'number',
        get() {
            return this.workingItems.length;
        }
    },

    getRoleStatus: function () {
        var self = this;

        if (this.workingCount === 0) {
            return;
        }

        var data = {
            userId: router.data.id,
            roles: []
        };

        each(this.workingItems,
            function (item) {
                data.roles.push(item.roleName);
            });

        api.roleStatus.post(data)
            .then(function (response) {
                each(response.data,
                    function (item) {
                        const roleItem = self.getRoleItem(item.roleName);

                        if (!roleItem) {
                            return;
                        }

                        roleItem.working = !(roleItem.active === item.active);
                    });
            })
            .then(function () {
                setTimeout(self.getRoleStatus(), 1000);
            });
    }
});

export default Component.extend({
    tag: 'access-user-roles',
    ViewModel,
    view
});