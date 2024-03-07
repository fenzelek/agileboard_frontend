(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('logoSqr', logoSqrDirective);

    /** @ngInject */
    function logoSqrDirective(__env)
    {
        return {
            require: 'E',
            template: __env.logo == '' ?
                '<div ng-click="openHome()" class="logo md-accent-bg"><span>F</span></div>' :
                "<div ng-click='openHome()' class='logo-sqr' style='background-image: url(\"/assets/logos/" + __env.logo + "/logo_sqr_t.png\")'></div>"
        };
    }
})();
