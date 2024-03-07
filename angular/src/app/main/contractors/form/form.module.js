(function ()
{
    'use strict';

    angular
        .module('app.contractors-form', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.contractors-form-new', {
                url    : '/contractors/form/:type?success',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/contractors/form/form.html',
                        controller : 'ContractorsFormController as vm'
                    }
                }
            })
            .state('app.contractors-form-edit', {
            url    : '/contractors/form/:type/:id',
            views  : {
                'content@app': {
                    templateUrl: 'app/main/contractors/form/form.html',
                    controller : 'ContractorsFormController as vm'
                }
            }
        });
    }
})();