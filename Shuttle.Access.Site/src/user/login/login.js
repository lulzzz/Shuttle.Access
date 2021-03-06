import Component from 'can-component/';
import DefineMap from 'can-define/map/';
import view from './login.stache!';
import resources from '~/resources';
import access from 'shuttle-access';
import ValidationViewModel from 'shuttle-canstrap/infrastructure/validation-view-model';
import validate from 'can-define-validate-validatejs';
import state from '~/state';

resources.add('user', {action: 'login'});

export const ViewModel = ValidationViewModel.extend({
    init(){
        state.title = 'user:login.title';
    },
    username: {
        type: 'string',
        validate: {
            presence: true
        }
    },
    password: {
        type: 'string',
        validate: {
            presence: true
        }
    },
    working: {
        type: 'boolean',
        default: false
    },
    submitIconName: {
        get: function () {
            return this.working ? 'glyphicon-hourglass' : '';
        }
    },
    login: function () {
        var self = this;

        if (this.hasErrors()) {
            return false;
        }

        this.working = true;

        access.login({
            username: this.username,
            password: this.password
        })
            .then(function () {
                window.location.hash = '#!dashboard';
            })
            .then(function () {
                self.working = false;
            })
            .catch(function () {
                self.working = false;
            });

        return true;
    }
});

validate(ViewModel);

export default Component.extend({
    tag: 'access-user-login',
    ViewModel,
    view
});