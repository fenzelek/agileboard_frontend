(function ()
{
    'use strict';

    angular
        .module('app.tokens-form', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.tokens-form-new', {
                url    : '/users/tokens/form/:id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/tokens/form/form.html',
                        controller : 'TokensFormController as vm'
                    }
                }
            });
    }
})();