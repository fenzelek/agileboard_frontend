(function ()
{
    'use strict';

    angular
        .module('app.tokens-list', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.tokens-list', {
                url    : '/users/tokens/:id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/tokens/list/list.html',
                        controller : 'TokensListController as vm'
                    }
                }
            });
    }
})();