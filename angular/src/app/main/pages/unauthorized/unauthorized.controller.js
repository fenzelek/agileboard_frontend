(function ()
{
    'use strict';

    angular
        .module('app.page.unauthorized')
        .controller('UnauthorizedController', UnauthorizedController);

    /** @ngInject */
    function UnauthorizedController(transService)
    {
        var vm = this;
        transService.loadFile('main/pages/unauthorized');
        
        //////////
    }
})();
