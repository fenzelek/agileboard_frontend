(function ()
{
    'use strict';

    angular
        .module('app.products-form', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.products-form-new', {
                url    : '/products/form/:type?success',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/products/form/form.html',
                        controller : 'ProductsFormController as vm'
                    }
                }
            })
            .state('app.products-form-edit', {
            url    : '/products/form/:type/:id',
            views  : {
                'content@app': {
                    templateUrl: 'app/main/products/form/form.html',
                    controller : 'ProductsFormController as vm'
                }
            }
        });
    }
})();