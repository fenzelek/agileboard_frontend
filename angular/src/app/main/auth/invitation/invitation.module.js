(function ()
{
    'use strict';

    angular
        .module('app.invitation', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider.state('app.invitation', {
            url      : '/guest/invitation/:token/:company',
            views    : {
                'main@'                                : {
                    templateUrl: 'app/core/layouts/content-only.html',
                    controller : 'MainController as vm'
                },
                'content@app.invitation': {
                    templateUrl: 'app/main/auth/invitation/invitation.html',
                    controller : 'InvitationController as vm'
                }
            },
            bodyClass: 'invitation'
        });
    }

})();